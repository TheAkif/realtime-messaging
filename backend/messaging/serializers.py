# messaging/serializers.py
from django.forms import ValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from messaging.models import Message
from django.contrib.auth import get_user_model

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    """
    Viewset to convert the Message model instances into JSON and vice versa.
    """

    class Meta:
        model = Message
        fields = ["id", "sender", "receiver", "content", "timestamp"]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Viewset to convert the User model instances into JSON and vice versa.
    """

    def validate(self, attrs):
        user = User(**attrs)
        password = attrs.get("password")

        try:
            validate_password(password, user)
        except ValidationError as e:
            raise serializers.ValidationError(e)

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "password",
        )
        extra_kwargs = {"password": {"write_only": True}}


class UserReadOnlySerializer(serializers.ModelSerializer):
    """
    Viewset to convert the User model instances into JSON and vice versa.
    """

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
        )
