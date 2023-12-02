from django.db import models
from django.contrib.auth.models import User


class Message(models.Model):
    """
    Repository for message.
    """

    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """
        This function shows a str name on the admin panel instead of showing like 'Object(1)'.
        """
        return f"{self.sender} - {self.content[:50]}"
