from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from messaging.models import Message
from messaging.serializers import MessageSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


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
            {
                'type': 'chat.message',
                'message': MessageSerializer(instance).data
            }
        )