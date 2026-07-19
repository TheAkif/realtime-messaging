# tests/test_websockets.py
import pytest
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient

from realtime_messaging_project.asgi import application
from messaging.models import UserProfile
from messaging.rooms import room_name_for
from messaging.ws_tickets import create_ticket


def _login_and_get_ticket(email, password):
    client = APIClient()
    token_res = client.post("/api/token/", {"email": email, "password": password})
    access = token_res.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    ticket_res = client.get("/api/users/ws-ticket")
    assert ticket_res.status_code == 200
    return ticket_res.data["ticket"]


async def _receive_skipping_presence(communicator):
    """Every successful connect() now sends the connecting client an
    immediate presence snapshot of the other party, ahead of whatever the
    test actually cares about - drain those first."""
    while True:
        msg = await communicator.receive_json_from()
        if msg.get("type") != "presence":
            return msg


async def _drain_presence(communicator):
    """Consumes any already-queued presence frames so a following
    receive_nothing() check isn't tripped up by connect()-time noise."""
    try:
        while True:
            msg = await communicator.receive_json_from(timeout=0.05)
            if msg.get("type") != "presence":
                raise AssertionError(f"expected only presence frames, got {msg}")
    except TimeoutError:
        pass


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
    response2 = await _receive_skipping_presence(communicator2)
    assert response2["type"] == "message"
    assert response2["message"] == "Hello, user2!"
    assert response2["sender"] == user1.id

    # user1 also gets their own message echoed back, since both sides are in
    # the one shared room now.
    response1 = await _receive_skipping_presence(communicator1)
    assert response1["message"] == "Hello, user2!"
    assert response1["sender"] == user1.id

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_typing_notification_reaches_the_other_party_only():
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
    assert (await communicator1.connect())[0]
    assert (await communicator2.connect())[0]

    await communicator1.send_json_to({"type": "typing"})

    response2 = await _receive_skipping_presence(communicator2)
    assert response2 == {"type": "typing", "sender": user1.id}

    # The sender doesn't get their own typing notification echoed back.
    await _drain_presence(communicator1)
    assert await communicator1.receive_nothing(timeout=0.2)

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
    response = await _receive_skipping_presence(communicator)
    assert "error" in response

    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_presence_is_broadcast_live_on_connect_and_disconnect():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    ticket1 = _login_and_get_ticket("user1@example.com", "password123")
    communicator1 = WebsocketCommunicator(
        application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket1}"
    )
    assert (await communicator1.connect())[0]

    # user1 connected before user2 - their snapshot of user2 is "offline".
    snapshot = await communicator1.receive_json_from()
    assert snapshot == {"type": "presence", "user_id": user2.id, "status": "offline"}

    ticket2 = _login_and_get_ticket("user2@example.com", "password123")
    communicator2 = WebsocketCommunicator(
        application, f"/ws/chat/{user1.chat_uuid}/?ticket={ticket2}"
    )
    assert (await communicator2.connect())[0]

    # user1 now gets a live broadcast that user2 came online.
    live_update = await communicator1.receive_json_from()
    assert live_update == {"type": "presence", "user_id": user2.id, "status": "online"}

    # user2, connecting second, learns user1 is already online immediately.
    snapshot2 = await communicator2.receive_json_from()
    assert snapshot2 == {"type": "presence", "user_id": user1.id, "status": "online"}

    await communicator2.disconnect()

    offline_update = await communicator1.receive_json_from()
    assert offline_update == {"type": "presence", "user_id": user2.id, "status": "offline"}

    await communicator1.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_a_second_open_tab_does_not_flip_presence_offline_when_one_closes():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    ticket_watcher = _login_and_get_ticket("user2@example.com", "password123")
    watcher = WebsocketCommunicator(
        application, f"/ws/chat/{user1.chat_uuid}/?ticket={ticket_watcher}"
    )
    assert (await watcher.connect())[0]
    assert (await watcher.receive_json_from())["status"] == "offline"

    ticket_tab_a = _login_and_get_ticket("user1@example.com", "password123")
    tab_a = WebsocketCommunicator(application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket_tab_a}")
    assert (await tab_a.connect())[0]
    assert (await watcher.receive_json_from())["status"] == "online"

    ticket_tab_b = _login_and_get_ticket("user1@example.com", "password123")
    tab_b = WebsocketCommunicator(application, f"/ws/chat/{user2.chat_uuid}/?ticket={ticket_tab_b}")
    assert (await tab_b.connect())[0]

    # Second tab connecting doesn't re-announce "online" to the room - the
    # watcher already knows. Nothing new should arrive from that connect.
    assert await watcher.receive_nothing(timeout=0.2)

    await tab_a.disconnect()

    # One of user1's two tabs closed - still online via tab_b, so the
    # watcher must not see a spurious "offline".
    assert await watcher.receive_nothing(timeout=0.2)

    await tab_b.disconnect()

    # Now both of user1's tabs are gone - genuinely offline.
    final_update = await watcher.receive_json_from()
    assert final_update == {"type": "presence", "user_id": user1.id, "status": "offline"}

    await watcher.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_consumer_relays_a_read_receipt_event_to_the_sender_only():
    # The REST-view side of this (does opening a conversation actually
    # trigger the group_send) is covered in test_api.py via a synchronous
    # test with a mocked channel layer - this covers the other half: does
    # the consumer, on receiving that event, correctly relay it to the
    # sender as a "read" frame and skip echoing it back to the reader.
    # Triggered directly against the channel layer rather than through a
    # real REST call, since MessageViewSet.list()'s
    # async_to_sync(channel_layer.group_send) call refuses to run on a
    # thread that already has this test's own event loop attached - a
    # same-thread guard that only bites inside the test process (Django's
    # ASGI handler always runs sync views on its own worker-thread pool in
    # production, where this is the standard pattern).
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
    assert (await communicator1.connect())[0]
    assert (await communicator2.connect())[0]
    # Known quantity, not a timeout-polling drain: communicator1 connected
    # first, so it gets its own "user2 offline" snapshot plus a live "user2
    # online" broadcast once communicator2 connects; communicator2,
    # connecting second, gets exactly one "user1 online" snapshot.
    await communicator1.receive_json_from()
    await communicator1.receive_json_from()
    await communicator2.receive_json_from()

    channel_layer = get_channel_layer()
    room_name = room_name_for(user1.chat_uuid, user2.chat_uuid)
    await channel_layer.group_send(
        room_name, {"type": "messages_read_update", "reader_id": user2.id}
    )

    read_update = await communicator1.receive_json_from()
    assert read_update == {"type": "read", "reader_id": user2.id}

    # user2 is the reader - they don't need to see their own read receipt.
    assert await communicator2.receive_nothing(timeout=0.2)

    await communicator1.disconnect()
    await communicator2.disconnect()
