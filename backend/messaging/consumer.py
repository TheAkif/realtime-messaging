import logging
from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

from messaging.rooms import room_name_for
from messaging.ws_tickets import consume_ticket

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope["query_string"].decode())
        ticket = query_params.get("ticket", [None])[0]

        user_id = await sync_to_async(consume_ticket)(ticket)
        if not user_id:
            logger.warning("WS connect rejected: missing/invalid/expired ticket")
            await self.close(code=4401)
            return

        self.user = await self.get_user_by_id(user_id)
        if not self.user:
            logger.warning("WS connect rejected: ticket resolved to no user (id=%s)", user_id)
            await self.close(code=4401)
            return

        self.other_user_uuid = self.scope["url_route"]["kwargs"]["chat_uuid"]
        self.other_user = await self.get_user_by_uuid(self.other_user_uuid)

        if not self.other_user or self.other_user.id == self.user.id:
            logger.warning(
                "WS connect rejected: user %s requested unknown/self target %s",
                self.user.id, self.other_user_uuid,
            )
            await self.close(code=4404)
            return

        # Canonical, order-independent room shared by both participants,
        # regardless of which of them "other_user_uuid" refers to.
        self.room_name = room_name_for(self.user.chat_uuid, self.other_user.chat_uuid)

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_name"):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    @database_sync_to_async
    def save_message(self, sender, receiver, message):
        from messaging.models import Message

        message_obj = Message.objects.create(
            sender=sender, receiver=receiver, content=message
        )
        return message_obj.timestamp.isoformat()

    async def receive(self, text_data):
        if not text_data:
            return

        try:
            text_data_json = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid message format."}))
            return

        if text_data_json.get("type") == "typing":
            await self.channel_layer.group_send(
                self.room_name,
                {"type": "user_typing", "sender": self.user.id},
            )
            return

        message = text_data_json.get("message")
        if not message:
            return

        timestamp = await self.save_message(self.user, self.other_user, message)

        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": self.user.id,
                "timestamp": timestamp,
            },
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "message": event["message"],
                    "sender": event["sender"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    async def user_typing(self, event):
        # Don't echo typing notifications back to the sender's own connection.
        if event["sender"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps({"type": "typing", "sender": event["sender"]})
        )

    @database_sync_to_async
    def get_user_by_uuid(self, chat_uuid):
        from messaging.models import UserProfile

        try:
            return UserProfile.objects.get(chat_uuid=chat_uuid)
        except (UserProfile.DoesNotExist, ValueError):
            return None

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        from messaging.models import UserProfile

        try:
            return UserProfile.objects.get(id=user_id)
        except (UserProfile.DoesNotExist, ValueError):
            return None
