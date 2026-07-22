# tests/test_websockets.py
import pytest
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient

from realtime_messaging_project.asgi import application
from messaging.models import Message, UserProfile
from messaging.ws_groups import user_group_name
from messaging.ws_tickets import create_ticket


def _login_and_get_ticket(email, password):
    client = APIClient()
    token_res = client.post("/api/token/", {"email": email, "password": password})
    access = token_res.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    ticket_res = client.get("/api/users/ws-ticket")
    assert ticket_res.status_code == 200
    return ticket_res.data["ticket"]


async def _connect(email, password):
    ticket = _login_and_get_ticket(email, password)
    communicator = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket}")
    connected, _ = await communicator.connect()
    assert connected
    return communicator


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_two_real_users_can_message_each_other_via_personal_groups():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")
    communicator2 = await _connect("user2@example.com", "password123")

    # user2 connecting second broadcasts "online" to the global presence
    # group, which user1 (already connected) is a member of.
    presence_seen_by_1 = await communicator1.receive_json_from()
    assert presence_seen_by_1 == {"type": "presence", "user_id": user2.id, "status": "online"}

    await communicator1.send_json_to({"message": "Hello, user2!", "receiver_id": user2.id})

    # user2 receives it, correctly attributed to user1.
    response2 = await communicator2.receive_json_from()
    assert response2["type"] == "message"
    assert response2["message"] == "Hello, user2!"
    assert response2["sender"] == user1.id
    assert response2["receiver"] == user2.id

    # user1 also gets their own message echoed back to their own group, so
    # their other tabs/devices (and this connection) can render it.
    response1 = await communicator1.receive_json_from()
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

    communicator1 = await _connect("user1@example.com", "password123")
    communicator2 = await _connect("user2@example.com", "password123")

    # Drain the "user2 online" broadcast user1 sees from user2's connect.
    await communicator1.receive_json_from()

    await communicator1.send_json_to({"type": "typing", "receiver_id": user2.id})

    response2 = await communicator2.receive_json_from()
    assert response2 == {"type": "typing", "sender": user1.id}

    # The sender doesn't get their own typing notification echoed back.
    assert await communicator1.receive_nothing(timeout=0.2)

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_connect_without_ticket_is_rejected():
    communicator = WebsocketCommunicator(application, "/ws/chat/")
    connected, _ = await communicator.connect()
    assert not connected


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_ticket_cannot_be_reused():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    ticket = create_ticket(user1.id)

    communicator1 = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket}")
    connected1, _ = await communicator1.connect()
    assert connected1
    await communicator1.disconnect()

    communicator2 = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket}")
    connected2, _ = await communicator2.connect()
    assert not connected2


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_sending_a_message_to_an_unknown_or_self_receiver_gets_an_error_frame():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    communicator = await _connect("user1@example.com", "password123")

    await communicator.send_json_to({"message": "hi", "receiver_id": 999999})
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.send_json_to({"message": "hi", "receiver_id": user1.id})
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_invalid_json_gets_an_error_frame_not_a_crash():
    UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    communicator = await _connect("user1@example.com", "password123")

    await communicator.send_to(text_data="not valid json")
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_presence_transitions_are_broadcast_live_to_everyone_connected():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )
    warmup_user = UserProfile.objects.create_user(
        email="warmup@example.com", password="password123", first_name="Warm", last_name="Up"
    )

    communicator1 = await _connect("user1@example.com", "password123")

    # A throwaway connect/disconnect cycle first - works around a
    # channels_redis test-harness quirk where the very first disconnect
    # broadcast a freshly created channel layer processes can be lost in
    # transit to an already-connected communicator. channels_redis
    # multiplexes every local channel in the process through one shared
    # receive lock; a consumer's task being cancelled by its own disconnect
    # can race that very first hand-off. Doesn't reproduce once the shared
    # receive machinery has cycled at least once, and isn't a production
    # concern - a real worker doesn't tear a task down in the same breath
    # as a fresh group_send nearly as often as two communicators created
    # back-to-back in a test.
    warmup = await _connect("warmup@example.com", "password123")
    assert (await communicator1.receive_json_from())["user_id"] == warmup_user.id
    await warmup.disconnect()
    assert (await communicator1.receive_json_from())["status"] == "offline"

    communicator2 = await _connect("user2@example.com", "password123")

    # user1 gets a live broadcast that user2 came online - presence is
    # global now, not scoped to a shared conversation.
    live_update = await communicator1.receive_json_from()
    assert live_update == {"type": "presence", "user_id": user2.id, "status": "online"}

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
    UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    watcher = await _connect("user2@example.com", "password123")

    tab_a = await _connect("user1@example.com", "password123")
    assert (await watcher.receive_json_from())["status"] == "online"

    tab_b = await _connect("user1@example.com", "password123")

    # Second tab connecting doesn't re-announce "online" - the watcher
    # already knows. Nothing new should arrive from that connect.
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
    # original sender as a "read" frame. Triggered directly against the
    # channel layer rather than through a real REST call, since
    # MessageViewSet.list()'s async_to_sync(channel_layer.group_send) call
    # refuses to run on a thread that already has this test's own event loop
    # attached - a same-thread guard that only bites inside the test process
    # (Django's ASGI handler always runs sync views on its own worker-thread
    # pool in production, where this is the standard pattern).
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")
    communicator2 = await _connect("user2@example.com", "password123")

    # user2 connecting second broadcasts "online" to user1.
    await communicator1.receive_json_from()

    channel_layer = get_channel_layer()
    # target_user_id is user1: their messages (to user2) just got read.
    await channel_layer.group_send(
        user_group_name(user1.id), {"type": "messages_read_update", "reader_id": user2.id}
    )

    read_update = await communicator1.receive_json_from()
    assert read_update == {"type": "read", "reader_id": user2.id}

    # user2 is the reader - only user1's group was sent this, so user2 can't
    # receive it regardless.
    assert await communicator2.receive_nothing(timeout=0.2)

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_client_can_mark_messages_read_live_over_the_socket():
    # Covers the case the REST read-marking path misses entirely: a
    # conversation that's already open when a message arrives (or a reply
    # goes out) live, with no fresh "open this conversation" REST call to
    # trigger read-marking.
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")
    communicator2 = await _connect("user2@example.com", "password123")

    # user2 connecting second broadcasts "online" to user1.
    await communicator1.receive_json_from()

    await communicator1.send_json_to({"message": "hi", "receiver_id": user2.id})
    await communicator2.receive_json_from()  # the message itself
    await communicator1.receive_json_from()  # my own echo

    # user2 has this conversation open and immediately reports it read.
    await communicator2.send_json_to({"type": "read", "receiver_id": user1.id})

    read_update = await communicator1.receive_json_from()
    assert read_update == {"type": "read", "reader_id": user2.id}

    saved = await database_sync_to_async(Message.objects.get)(sender=user1, receiver=user2)
    assert saved.read is True
    assert saved.delivered is True

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_marking_read_with_nothing_unread_sends_no_update():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")
    communicator2 = await _connect("user2@example.com", "password123")
    await communicator1.receive_json_from()

    # Nothing was ever sent, so there's nothing to mark read - no spurious
    # broadcast should reach user1.
    await communicator2.send_json_to({"type": "read", "receiver_id": user1.id})
    assert await communicator1.receive_nothing(timeout=0.2)

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_message_is_delivered_immediately_when_receiver_is_online():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")
    communicator2 = await _connect("user2@example.com", "password123")

    # user2 connecting second broadcasts "online" to user1.
    await communicator1.receive_json_from()

    await communicator1.send_json_to({"message": "hi", "receiver_id": user2.id})

    response2 = await communicator2.receive_json_from()
    assert response2["delivered"] is True

    # I get my own echo too, already showing delivered - no separate round
    # trip needed for the common "they're already online" case.
    response1 = await communicator1.receive_json_from()
    assert response1["delivered"] is True

    saved = await database_sync_to_async(Message.objects.get)(sender=user1, receiver=user2)
    assert saved.delivered is True

    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_message_is_not_delivered_when_receiver_is_offline():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")

    await communicator1.send_json_to({"message": "hi", "receiver_id": user2.id})

    response1 = await communicator1.receive_json_from()
    assert response1["delivered"] is False

    saved = await database_sync_to_async(Message.objects.get)(sender=user1, receiver=user2)
    assert saved.delivered is False

    await communicator1.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_connecting_delivers_backlog_and_notifies_the_original_sender():
    user1 = UserProfile.objects.create_user(
        email="user1@example.com", password="password123", first_name="User", last_name="One"
    )
    user2 = UserProfile.objects.create_user(
        email="user2@example.com", password="password123", first_name="User", last_name="Two"
    )

    communicator1 = await _connect("user1@example.com", "password123")

    # user2 is offline - this message is saved but stays undelivered.
    await communicator1.send_json_to({"message": "hi", "receiver_id": user2.id})
    response1 = await communicator1.receive_json_from()
    assert response1["delivered"] is False

    # user2 connects now - the backlog sweep in connect() should catch it
    # and tell user1, without user2 ever having opened this conversation.
    communicator2 = await _connect("user2@example.com", "password123")

    presence_update = await communicator1.receive_json_from()
    assert presence_update == {"type": "presence", "user_id": user2.id, "status": "online"}

    delivered_update = await communicator1.receive_json_from()
    assert delivered_update == {"type": "delivered", "recipient_id": user2.id}

    saved = await database_sync_to_async(Message.objects.get)(sender=user1, receiver=user2)
    assert saved.delivered is True

    await communicator1.disconnect()
    await communicator2.disconnect()
