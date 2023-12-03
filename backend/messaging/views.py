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
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

User = get_user_model()


class MessageViewSet(viewsets.ModelViewSet):
    """
    Viewset to handle CRUD operation for Message model.
    Includes serializer class to serialize data and permission
    class to handle if the request is authenticated or not.
    """

    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save(sender=self.request.user)

        # Broadcast the new message to WebSocket consumers
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "chat",  # Group name
            {"type": "chat.message", "message": MessageSerializer(instance).data},
        )


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


class LoginViewSet(APIView):
    """
    Viewset to handle Logging in a user.
    """

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
