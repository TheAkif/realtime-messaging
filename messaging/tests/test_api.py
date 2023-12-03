# yourapp/tests.py
import pytest
from django.contrib.auth.models import User
from messaging.models import Message
from messaging.tests.factories import UserFactory
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator

@pytest.mark.django_db
def test_message_creation():
    user = UserFactory.create()

    message = Message.objects.create(sender=user, content="Test Message")

    assert message.sender == user
    assert message.content == "Test Message"
    assert Message.objects.count() == 1

@pytest.mark.django_db
def test_message_str():
    user = UserFactory.create()
    message = Message.objects.create(sender=user, content="Test Message")
    expected_str = f"{user} - Test Message"
    assert str(message) == expected_str

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_chat_consumer():
    user = User.objects.create_user(username='testuser', password='testpassword')
    communicator = WebsocketCommunicator(get_channel_layer().as_asgi(), "/ws/chat/")

    connected, _ = await communicator.connect()
    assert connected

    message_data = {'type': 'chat.message', 'message': {'sender': 'testuser', 'content': 'Test message'}}
    await communicator.send_json_to(message_data)

    response = await communicator.receive_json_from()
    assert response['message']['sender'] == 'testuser'
    assert response['message']['content'] == 'Test message'

    await communicator.disconnect()