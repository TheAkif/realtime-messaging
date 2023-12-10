import uuid
from django.db import models
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
)


class UserProfileManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValueError("Users must have an email address")

        user = self.model(
            first_name=first_name,
            last_name=last_name,
            email=self.normalize_email(email),
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None):
        """
        Creates and saves a superuser with the given email and password.
        """
        user = self.create_user(
            email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )

        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class UserProfile(AbstractBaseUser, PermissionsMixin):
    """
    User Account Model.
    """

    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
    )
    chat_uuid = models.UUIDField(default=uuid.uuid4, editable=False)

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserProfileManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def get_full_name(self):
        """ """
        return self.first_name + " " + self.last_name

    def get_short_name(self):
        """ """
        return self.first_name

    def __str__(self):
        """ """
        return self.email

    # user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # bio = models.TextField(null=True, blank=True)

    # def __str__(self):
    #     return self.user.username


# # Signal to create or update User Profile whenever a User instance is created or updated
# from django.db.models.signals import post_save
# from django.dispatch import receiver


# @receiver(post_save, sender=User)
# def create_or_update_user_profile(sender, instance, created, **kwargs):
#     if created:
#         UserProfile.objects.create(user=instance)
#     instance.userprofile.save()


class Message(models.Model):
    """
    Repository for message.
    """

    sender = models.ForeignKey(
        UserProfile,
        related_name="sent_messages",
        on_delete=models.CASCADE,
        default=None,
    )
    receiver = models.ForeignKey(
        UserProfile,
        related_name="received_messages",
        on_delete=models.CASCADE,
        default=None,
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        """
        This function shows a str name on the admin panel instead of showing like 'Object(1)'.
        """
        return f"From {self.sender} to {self.receiver} - {self.content[:50]}"
