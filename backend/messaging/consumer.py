from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from messaging.models import UserProfile
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.other_user_uuid = self.scope['url_route']['kwargs']['chat_uuid']
        self.other_user = await self.get_user(self.other_user_uuid)

        if self.other_user:
            self.room_name = f"chat_{self.channel_name}_{self.other_user_uuid}"

            await self.channel_layer.group_add(
                self.room_name,
                self.channel_name
            )

            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def get_user(self, chat_uuid):
        try:
            return UserProfile.objects.get(chat_uuid=chat_uuid)
        except UserProfile.DoesNotExist:
            return None
