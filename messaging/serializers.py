# messaging/serializers.py
from rest_framework import serializers
from messaging.models import Message


class MessageSerializer(serializers.ModelSerializer):
    """
    Viewset to convert the Message model instances into JSON and vice versa.
    """

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "timestamp"]
