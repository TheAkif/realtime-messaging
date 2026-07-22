
import io
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient
from messaging.models import Message, UserProfile
from messaging.presence import mark_online
from messaging.ws_groups import user_group_name
import pytest


def _png_upload(name="avatar.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")

@pytest.mark.django_db
def test_user_token_generation():
    # Create a test user
    test_user = UserProfile.objects.create_user(
        first_name="Akif",
        last_name="Hussain",
        email="test@example.com",
        password="password123",
    )
    client = APIClient()

    # Obtain token
    response = client.post(
        "/api/token/",
        {
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data

    # Verify token
    access_token = response.data["access"]
    response = client.post("/api/token/verify/", {"token": access_token})
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_registration():
    client = APIClient()
    response = client.post(
        "/api/users/register",
        {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User",
        },
    )
    assert response.status_code == 201
    assert UserProfile.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_ws_ticket_requires_auth():
    client = APIClient()
    response = client.get("/api/users/ws-ticket")
    assert response.status_code == 401


@pytest.mark.django_db
def test_ws_ticket_issued_for_authenticated_user():
    UserProfile.objects.create_user(
        first_name="Akif",
        last_name="Hussain",
        email="ticket@example.com",
        password="password123",
    )
    client = APIClient()
    token_res = client.post(
        "/api/token/", {"email": "ticket@example.com", "password": "password123"}
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    response = client.get("/api/users/ws-ticket")
    assert response.status_code == 200
    assert response.data["ticket"]


@pytest.mark.django_db
def test_conversations_include_last_message_and_unread_count():
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="me@example.com", password="password123",
    )
    friend = UserProfile.objects.create_user(
        first_name="Priya", last_name="Raman", email="friend@example.com", password="password123",
    )
    UserProfile.objects.create_user(
        first_name="Stranger", last_name="NoHistory", email="stranger@example.com", password="password123",
    )

    Message.objects.create(sender=friend, receiver=me, content="hey")
    Message.objects.create(sender=friend, receiver=me, content="you around?")
    Message.objects.create(sender=me, receiver=friend, content="yep, what's up")

    client = APIClient()
    token_res = client.post("/api/token/", {"email": "me@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    response = client.get("/api/users/conversations")
    assert response.status_code == 200

    by_id = {c["id"]: c for c in response.data}
    friend_summary = by_id[friend.id]
    assert friend_summary["last_message"]["content"] == "yep, what's up"
    assert friend_summary["unread_count"] == 2

    stranger_summary = next(c for c in response.data if c["first_name"] == "Stranger")
    assert stranger_summary["last_message"] is None
    assert stranger_summary["unread_count"] == 0

    # Contacts with activity are listed before contacts with none.
    has_message_flags = [bool(c["last_message"]) for c in response.data]
    assert has_message_flags == sorted(has_message_flags, reverse=True)
    assert False in has_message_flags  # stranger (no history) is present


@pytest.mark.django_db
def test_conversations_report_live_online_status():
    # The sidebar needs to know who's online globally on load, not just
    # whoever's conversation happens to be open - this is the REST snapshot
    # that seeds it; live deltas after that arrive over the WS presence
    # group instead.
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="me5@example.com", password="password123",
    )
    online_friend = UserProfile.objects.create_user(
        first_name="Priya", last_name="Raman", email="online5@example.com", password="password123",
    )
    offline_friend = UserProfile.objects.create_user(
        first_name="Sam", last_name="Ortiz", email="offline5@example.com", password="password123",
    )
    mark_online(online_friend.id)

    client = APIClient()
    token_res = client.post("/api/token/", {"email": "me5@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    response = client.get("/api/users/conversations")
    assert response.status_code == 200

    by_id = {c["id"]: c for c in response.data}
    assert by_id[online_friend.id]["online"] is True
    assert by_id[offline_friend.id]["online"] is False


@pytest.mark.django_db
def test_fetching_history_marks_messages_read():
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="me2@example.com", password="password123",
    )
    friend = UserProfile.objects.create_user(
        first_name="Priya", last_name="Raman", email="friend2@example.com", password="password123",
    )
    Message.objects.create(sender=friend, receiver=me, content="hey")
    Message.objects.create(sender=friend, receiver=me, content="you around?")

    client = APIClient()
    token_res = client.post("/api/token/", {"email": "me2@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    assert Message.objects.filter(receiver=me, read=False).count() == 2
    response = client.get(f"/api/users/messages/{friend.id}/")
    assert response.status_code == 200
    assert Message.objects.filter(receiver=me, read=False).count() == 0
    # Read implies delivered - you can't read what never arrived.
    assert Message.objects.filter(receiver=me, delivered=False).count() == 0


@pytest.mark.django_db
def test_fetching_history_pushes_a_live_read_receipt_to_the_sender():
    # Live-broadcast half of the read-receipt feature: does the view tell
    # the sender's room that their messages were just read. Checked via a
    # mock rather than a real WebsocketCommunicator in the same test, since
    # a synchronous Django test client sharing pytest-asyncio's own running
    # loop trips async_to_sync's same-thread guard - a test-harness
    # limitation, not a production one (Django's ASGI handler always runs
    # sync views on its own worker-thread pool, where this pattern is
    # standard). The consumer's side of this - relaying the group_send as a
    # "read" frame to the sender - is covered separately in
    # test_websockets.py by sending the same event directly.
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="me3@example.com", password="password123",
    )
    friend = UserProfile.objects.create_user(
        first_name="Priya", last_name="Raman", email="friend3@example.com", password="password123",
    )
    Message.objects.create(sender=friend, receiver=me, content="hey")

    client = APIClient()
    token_res = client.post("/api/token/", {"email": "me3@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    with patch("messaging.views.async_to_sync") as mock_async_to_sync:
        response = client.get(f"/api/users/messages/{friend.id}/")
        assert response.status_code == 200

        mock_async_to_sync.assert_called_once()
        sync_call = mock_async_to_sync.return_value
        sync_call.assert_called_once_with(
            user_group_name(friend.id),
            {"type": "messages_read_update", "reader_id": me.id},
        )


@pytest.mark.django_db
def test_no_broadcast_when_there_was_nothing_new_to_mark_read():
    # Re-fetching a conversation with nothing unread shouldn't push a
    # pointless "read" frame on every single page load.
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="me4@example.com", password="password123",
    )
    friend = UserProfile.objects.create_user(
        first_name="Priya", last_name="Raman", email="friend4@example.com", password="password123",
    )

    client = APIClient()
    token_res = client.post("/api/token/", {"email": "me4@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    with patch("messaging.views.async_to_sync") as mock_async_to_sync:
        response = client.get(f"/api/users/messages/{friend.id}/")
        assert response.status_code == 200
        mock_async_to_sync.assert_not_called()


@pytest.mark.django_db
def test_profile_update_persists_bio_phone_and_name():
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="profile1@example.com", password="password123",
    )
    client = APIClient()
    token_res = client.post("/api/token/", {"email": "profile1@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    response = client.patch(
        "/api/users/profile",
        {
            "first_name": "Updated",
            "last_name": "Name",
            "bio": "Busy building things",
            "phone_number": "+1234567890",
        },
        format="json",
    )
    assert response.status_code == 200

    me.refresh_from_db()
    assert me.first_name == "Updated"
    assert me.last_name == "Name"
    assert me.bio == "Busy building things"
    assert me.phone_number == "+1234567890"


@pytest.mark.django_db
def test_avatar_upload_persists_and_is_retrievable_via_me():
    me = UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="profile2@example.com", password="password123",
    )
    client = APIClient()
    token_res = client.post("/api/token/", {"email": "profile2@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    response = client.put("/api/users/avatar", {"avatar": _png_upload()}, format="multipart")
    assert response.status_code == 200

    me.refresh_from_db()
    assert me.avatar

    me_response = client.get("/api/users/me")
    assert me_response.status_code == 200
    assert me_response.data["avatar"] == me.avatar.url


@pytest.mark.django_db
def test_avatar_upload_rejects_oversized_image():
    UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="profile3@example.com", password="password123",
    )
    client = APIClient()
    token_res = client.post("/api/token/", {"email": "profile3@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    with patch("messaging.serializers.MAX_AVATAR_SIZE_BYTES", 10):
        response = client.put("/api/users/avatar", {"avatar": _png_upload()}, format="multipart")
    assert response.status_code == 400


@pytest.mark.django_db
def test_avatar_upload_rejects_non_image_file():
    UserProfile.objects.create_user(
        first_name="Me", last_name="User", email="profile4@example.com", password="password123",
    )
    client = APIClient()
    token_res = client.post("/api/token/", {"email": "profile4@example.com", "password": "password123"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

    bad_file = SimpleUploadedFile("notes.txt", b"just some text", content_type="text/plain")
    response = client.put("/api/users/avatar", {"avatar": bad_file}, format="multipart")
    assert response.status_code == 400


@pytest.mark.django_db
def test_message_creation():
    sender = UserProfile.objects.create_user(
        first_name="Akif",
        last_name="Hussain",
        email="sender@example.com",
        password="password123",
    )
    receiver = UserProfile.objects.create_user(
        first_name="Nitish",
        last_name="last name",
        email="receiver@example.com",
        password="password123",
    )

    message = Message.objects.create(sender=sender, receiver=receiver, content="Hello")
    assert message.content == "Hello"
    assert Message.objects.count() == 1
