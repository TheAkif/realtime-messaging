from http.client import HTTPException
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64
import os

SECRET_KEY = os.environ.get("SECRET_KEY")


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.other_user_uuid = self.scope["url_route"]["kwargs"]["chat_uuid"]
        self.other_user = self.get_user_by_uuid(self.other_user_uuid)

        if self.other_user:
            self.room_name = f"chat__{self.other_user_uuid}"

            await self.channel_layer.group_add(self.room_name, self.channel_name)

            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    @database_sync_to_async
    def save_message(self, sender, receiver, message):
        from messaging.models import UserProfile

        sender = UserProfile.objects.get(
            id=sender.id
        )
        from messaging.models import Message
        encrypted_message = self.encrypt(message)

        Message.objects.create(sender=sender, receiver=receiver, content=encrypted_message)

    async def receive(self, text_data):
        print("Received text data:", text_data)
        if text_data:
            try:
                text_data_json = json.loads(text_data)
                message = text_data_json.get("message")
                chat_uuid = text_data_json.get("user_id")
                sender = self.get_user_by_uuid(chat_uuid)

                if message:
                    # Save the message to the database
                    await self.save_message(
                        sender, self.other_user, message
                    )

                    await self.channel_layer.group_send(
                        self.room_name, {"type": "chat_message", "message": message}
                    )
            except json.JSONDecodeError:
                raise HTTPException("Text message format not defined.")
        else:
            print("Received empty text_data")

    async def chat_message(self, event):
        print(f"inside chat_message() ${event}")
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message}))

    def get_user_by_uuid(self, chat_uuid):
        from messaging.models import UserProfile

        try:
            return UserProfile.objects.get(chat_uuid=chat_uuid)
        except UserProfile.DoesNotExist:
            return None

    def pad(self, s):
        return s + (AES.block_size - len(s) % AES.block_size) * chr(AES.block_size - len(s) % AES.block_size)

    def unpad(self, s):
        return s[:-ord(s[len(s) - 1:])]

    def encrypt(self, plain_text):
        import pdb
        pdb.set_trace()
        plain_text = self.pad(plain_text)
        cipher = AES.new(SECRET_KEY, AES.MODE_ECB)
        return base64.b64encode(cipher.encrypt(plain_text.encode('utf-8')))

    def decrypt(self, cipher_text):
        cipher = AES.new(SECRET_KEY, AES.MODE_ECB)
        return self.unpad(cipher.decrypt(base64.b64decode(cipher_text)).decode('utf-8'))