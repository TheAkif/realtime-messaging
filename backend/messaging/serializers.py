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
        fields = ["id", "sender", "receiver", "content", "timestamp", "read", "delivered"]


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
            raise serializers.ValidationError({"password": e.messages})

        # Deliberately not field-specific (see the email validators=[]
        # override below): a {"email": [...]} error would itself confirm
        # the account exists (account enumeration via registration - OWASP
        # ASVS 2.1). A generic, non-field error can't be distinguished from
        # any other registration failure.
        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError(
                "We couldn't create your account with those details. "
                "Please check your details and try again."
            )

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
        extra_kwargs = {
            "password": {"write_only": True},
            # Uniqueness is checked manually in validate() instead of via
            # the auto-generated UniqueValidator, so a duplicate email
            # doesn't surface as a distinguishing {"email": [...]} error.
            "email": {"validators": []},
        }


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
            "chat_uuid",
            "theme_preference",
        )


class ThemePreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("theme_preference",)
        extra_kwargs = {"theme_preference": {"required": True, "allow_null": False}}
