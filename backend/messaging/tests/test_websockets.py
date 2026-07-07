# tests/test_websockets.py
import pytest
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient

from realtime_messaging_project.asgi import application
from messaging.models import UserProfile
from messaging.ws_tickets import create_ticket


def _login_and_get_ticket(email, password):
    client = APIClient()
    token_res = client.post("/api/token/", {"email": email, "password": password})
    access = token_res.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    ticket_res = client.get("/api/users/ws-ticket")
    assert ticket_res.status_code == 200
    return ticket_res.data["ticket"]


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_two_real_users_share_a_room_and_see_each_others_messages():
    # Regression test for the old room-keying bug: each side connects using
    # the *other* party's chat_uuid (as the real frontend does), never their
    # own, and they must still land in the same room.
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    ticket1 = _login_and_get_ticket("user1@example.com", "password123")
    ticket2 = _login_and_get_ticket("user2@example.com", "password123")

    communicator1 = WebsocketCommunicator(
        application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket1}"
    )
    communicator2 = WebsocketCommunicator(
        application, f"/ws/chat/{user1.chat_uuid}/?ticket={ticket2}"
    )

    connected1, _ = await communicator1.connect()
    connected2, _ = await communicator2.connect()
    assert connected1
    assert connected2

    await communicator1.send_json_to({"message": "Hello, user2!"})

    # user2 receives it, correctly attributed to user1 - not to whatever
    # user_id user2's own client might have sent.
    response2 = await communicator2.receive_json_from()
    assert response2["message"] == "Hello, user2!"
    assert response2["sender"] == user1.id

    # user1 also gets their own message echoed back, since both sides are in
    # the one shared room now.
    response1 = await communicator1.receive_json_from()
    assert response1["message"] == "Hello, user2!"
    assert response1["sender"] == user1.id

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_connect_without_ticket_is_rejected():
    UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator = WebsocketCommunicator(application, f"/ws/chat/{user2.chat_uuid}/")
    connected, _ = await communicator.connect()
    assert not connected


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_ticket_cannot_be_reused():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    ticket = create_ticket(user1.id)

    communicator1 = WebsocketCommunicator(application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket}")
    connected1, _ = await communicator1.connect()
    assert connected1
    await communicator1.disconnect()

    communicator2 = WebsocketCommunicator(application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket}")
    connected2, _ = await communicator2.connect()
    assert not connected2


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_connect_to_unknown_target_is_rejected():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    ticket = create_ticket(user1.id)

    communicator = WebsocketCommunicator(
        application, f"/ws/chat/00000000-0000-0000-0000-000000000000/?ticket={ticket}"
    )
    connected, _ = await communicator.connect()
    assert not connected


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_invalid_json_gets_an_error_frame_not_a_crash():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )
    ticket = create_ticket(user1.id)

    communicator = WebsocketCommunicator(application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket}")
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_to(text_data="not valid json")
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.disconnect()
