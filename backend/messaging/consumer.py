import logging
from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

from messaging.ws_tickets import consume_ticket
from messaging.presence import mark_online, mark_offline
from messaging.ws_groups import PRESENCE_GROUP, user_group_name

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

        # One connection per session, not per conversation: join a personal
        # group (so any event addressed to me reaches this connection no
        # matter what's on screen) and the global presence group (so I both
        # hear about, and can be heard about by, every other user - not just
        # whoever I happen to have a conversation open with).
        self.user_group_name = user_group_name(self.user.id)
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.channel_layer.group_add(PRESENCE_GROUP, self.channel_name)
        await self.accept()

        connection_count = await sync_to_async(mark_online)(self.user.id)
        if connection_count == 1:
            # Only announce on the 0->1 transition - a second open tab/device
            # shouldn't re-broadcast "online" for someone who already was.
            await self.channel_layer.group_send(
                PRESENCE_GROUP,
                {"type": "presence_update", "user_id": self.user.id, "status": "online"},
            )

    async def disconnect(self, close_code):
        remaining_connections = None
        if hasattr(self, "user"):
            remaining_connections = await sync_to_async(mark_offline)(self.user.id)
        if hasattr(self, "user_group_name"):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
            await self.channel_layer.group_discard(PRESENCE_GROUP, self.channel_name)
            # Only announce on the 1->0 transition - one of several open
            # tabs/devices closing shouldn't flip presence offline while
            # another is still connected.
            if remaining_connections is not None and remaining_connections <= 0:
                await self.channel_layer.group_send(
                    PRESENCE_GROUP,
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

        # There's no per-connection "other party" anymore - one session
        # connection is shared across every conversation, so each outgoing
        # frame has to say who it's for.
        receiver_id = text_data_json.get("receiver_id")
        receiver = await self.get_user_by_id(receiver_id) if receiver_id else None
        if not receiver or receiver.id == self.user.id:
            await self.send(text_data=json.dumps({"error": "Unknown message recipient."}))
            return

        if text_data_json.get("type") == "typing":
            await self.channel_layer.group_send(
                user_group_name(receiver.id),
                {"type": "user_typing", "sender": self.user.id},
            )
            return

        message = text_data_json.get("message")
        if not message:
            return

        timestamp = await self.save_message(self.user, receiver, message)

        event = {
            "type": "chat_message",
            "message": message,
            "sender": self.user.id,
            "receiver": receiver.id,
            "timestamp": timestamp,
        }
        # Sent to the receiver's group so it arrives live regardless of what
        # they have open, and to my own group so my other tabs/devices (and
        # this same connection, rendering my own sent message) see it too.
        await self.channel_layer.group_send(user_group_name(receiver.id), event)
        await self.channel_layer.group_send(user_group_name(self.user.id), event)

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "message": event["message"],
                    "sender": event["sender"],
                    "receiver": event["receiver"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    async def user_typing(self, event):
        # Only the intended receiver's group is sent this in the first
        # place, so there's no self-echo to guard against here.
        await self.send(
            text_data=json.dumps({"type": "typing", "sender": event["sender"]})
        )

    async def presence_update(self, event):
        # The presence group has every connected user in it, including me -
        # don't echo my own connect/disconnect back to myself.
        if event["user_id"] == self.user.id:
            return
        await self.send(
            text_data=json.dumps(
                {"type": "presence", "user_id": event["user_id"], "status": event["status"]}
            )
        )

    async def messages_read_update(self, event):
        # Only the original sender's group is sent this, so - same as
        # user_typing - no self-echo guard is needed here either.
        await self.send(
            text_data=json.dumps({"type": "read", "reader_id": event["reader_id"]})
        )

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        from messaging.models import UserProfile

        try:
            return UserProfile.objects.get(id=user_id)
        except (UserProfile.DoesNotExist, ValueError, TypeError):
            return None
