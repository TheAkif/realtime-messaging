# tests/test_websockets.py
import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from realtime_messaging_project.asgi import application
from messaging.models import UserProfile

User = get_user_model()

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_chat_consumer():
    # Create test users
    user1 = UserProfile.objects.create_user(email="user1@example.com", password="password123", first_name="User", last_name="One")
    user2 = UserProfile.objects.create_user(email="user2@example.com", password="password123", first_name="User", last_name="Two")

    communicator1 = WebsocketCommunicator(
        application, f"/ws/chat/{user1.chat_uuid}/"
    )
    communicator2 = WebsocketCommunicator(
        application, f"/ws/chat/{user1.chat_uuid}/"
    )

    connected1, _ = await communicator1.connect()
    connected2, _ = await communicator2.connect()
    assert connected1
    assert connected2

    await communicator1.send_json_to({
        'user_id': str(user1.chat_uuid),
        'message': 'Hello, user2!'
    })

    response = await communicator2.receive_json_from()
    assert response == {'message': 'Hello, user2!'}

    await communicator1.disconnect()
    await communicator2.disconnect()