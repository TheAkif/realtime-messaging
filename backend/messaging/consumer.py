import logging
from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

from messaging.rooms import room_name_for
from messaging.ws_tickets import consume_ticket
from messaging.presence import mark_online, mark_offline, is_online

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

        connection_count = await sync_to_async(mark_online)(self.user.id)
        if connection_count == 1:
            # Only announce on the 0->1 transition - a second open tab/device
            # shouldn't re-broadcast "online" for someone who already was.
            await self.channel_layer.group_send(
                self.room_name,
                {"type": "presence_update", "user_id": self.user.id, "status": "online"},
            )
        # The group_send above only reaches the other party if *they're*
        # already connected to this room - tell myself their current status
        # directly so I'm not stuck assuming "offline" until they happen to
        # reconnect or disconnect while I'm watching.
        other_online = await sync_to_async(is_online)(self.other_user.id)
        await self.send(text_data=json.dumps({
            "type": "presence",
            "user_id": self.other_user.id,
            "status": "online" if other_online else "offline",
        }))

    async def disconnect(self, close_code):
        remaining_connections = None
        if hasattr(self, "user"):
            remaining_connections = await sync_to_async(mark_offline)(self.user.id)
        if hasattr(self, "room_name"):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)
            # Only announce on the 1->0 transition - one of several open
            # tabs/devices closing shouldn't flip presence offline while
            # another is still connected.
            if remaining_connections is not None and remaining_connections <= 0:
                await self.channel_layer.group_send(
                    self.room_name,
                    {"type": "presence_update", "user_id": self.user.id, "status": "offline"},
                )

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

    async def presence_update(self, event):
        # Don't echo my own connect/disconnect back to myself.
        if event["user_id"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps(
                {"type": "presence", "user_id": event["user_id"], "status": event["status"]}
            )
        )

    async def messages_read_update(self, event):
        # Only the sender needs this - reflects back to the reader's own
        # connection is harmless but pointless, so skip it.
        if event["reader_id"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps({"type": "read", "reader_id": event["reader_id"]})
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
