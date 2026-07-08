from django.db.models import Q
from django.shortcuts import get_object_or_404, render

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from messaging.models import Message
from messaging.serializers import (
    MessageSerializer,
    UserCreateSerializer,
    UserReadOnlySerializer,
)
from messaging.ws_tickets import create_ticket
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for listing users.
    """

    queryset = User.objects.all().exclude(
        is_staff=True
    )
    serializer_class = UserReadOnlySerializer
    permission_classes = [IsAuthenticated]


class MessageViewSet(viewsets.ModelViewSet):
    """
    Viewset to handle CRUD operation for Message model.
    Includes serializer class to serialize data and permission
    class to handle if the request is authenticated or not.
    """

    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        target_user_id = self.kwargs.get("target_user_id")

        if target_user_id:
            target_user = get_object_or_404(User, pk=target_user_id)
            return Message.objects.filter(sender=user, receiver=target_user) | \
                   Message.objects.filter(sender=target_user, receiver=user)

        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        target_user_id = self.kwargs.get("target_user_id")
        if target_user_id:
            # Viewing this conversation marks the other party's messages read.
            # (Doesn't push a live WS update to the sender yet - they'll see
            # the updated status next time their client re-fetches.)
            Message.objects.filter(
                sender_id=target_user_id, receiver=request.user, read=False
            ).update(read=True)
        return response



class RegisterViewSet(APIView):
    """
    Viewset to handle Registering a user.
    Includes serializer class to serialize data and permission
    class to handle if the request is authenticated or not.
    """

    def post(self, request):
        """
        Create the user after serializing the user data.
        """

        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RetrieveUserViewSet(APIView):
    """
    Viewset to handle Retrieving a user.
    """

    def get(self, request):
        """
        Get the current user logged-in through token.
        """

        user = request.user
        user = UserReadOnlySerializer(user)
        return Response(user.data, status=status.HTTP_200_OK)


class ConversationListView(APIView):
    """
    Every other user, enriched with their last message (if any) and how many
    of their messages to the requester are unread - what the sidebar needs.
    Most-recent-activity first; contacts with no message history are listed
    afterwards, alphabetically.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        contacts = User.objects.exclude(is_staff=True).exclude(id=user.id)

        conversations = []
        for contact in contacts:
            last_message = (
                Message.objects.filter(
                    Q(sender=user, receiver=contact) | Q(sender=contact, receiver=user)
                )
                .order_by("-timestamp")
                .first()
            )
            unread_count = Message.objects.filter(
                sender=contact, receiver=user, read=False
            ).count()
            conversations.append(
                {
                    "id": contact.id,
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "chat_uuid": contact.chat_uuid,
                    "last_message": (
                        {
                            "content": last_message.content,
                            "timestamp": last_message.timestamp,
                            "sender": last_message.sender_id,
                        }
                        if last_message
                        else None
                    ),
                    "unread_count": unread_count,
                }
            )

        conversations.sort(
            key=lambda c: (
                0 if c["last_message"] else 1,
                -c["last_message"]["timestamp"].timestamp() if c["last_message"] else 0,
                c["first_name"],
            )
        )
        return Response(conversations, status=status.HTTP_200_OK)


class WSTicketView(APIView):
    """
    Mints a short-lived, single-use ticket that the frontend attaches to the
    chat WebSocket URL, since a WebSocket handshake can't carry the JWT
    cookie/header this endpoint is authenticated with.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ticket = create_ticket(request.user.id)
        return Response({"ticket": ticket}, status=status.HTTP_200_OK)
