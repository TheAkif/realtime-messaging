
import pytest
from rest_framework.test import APIClient
from messaging.models import Message, UserProfile
import pytest

@pytest.mark.django_db
def test_user_token_generation():
    # Create a test user
    test_user = UserProfile.objects.create_user(
        first_name="Akif",
        last_name="Hussain",
        email="test@example.com",
        password="password123",
    )
    client = APIClient()

    # Obtain token
    response = client.post(
        "/api/token/",
        {
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data

    # Verify token
    access_token = response.data["access"]
    response = client.post("/api/token/verify/", {"token": access_token})
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_registration():
    client = APIClient()
    response = client.post(
        "/api/users/register",
        {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User",
        },
    )
    assert response.status_code == 201
    assert UserProfile.objects.filter(email="newuser@example.com").exists()


@pytest.mark.django_db
def test_message_creation():
    sender = UserProfile.objects.create_user(
        first_name="Akif",
        last_name="Hussain",
        email="sender@example.com",
        password="password123",
    )
    receiver = UserProfile.objects.create_user(
        first_name="Nitish",
        last_name="last name",
        email="receiver@example.com",
        password="password123",
    )

    message = Message.objects.create(sender=sender, receiver=receiver, content="Hello")
    assert message.content == "Hello"
    assert Message.objects.count() == 1
