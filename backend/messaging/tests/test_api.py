
import pytest
from rest_framework.test import APIClient
from messaging.models import Message, UserProfile
import pytest

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
