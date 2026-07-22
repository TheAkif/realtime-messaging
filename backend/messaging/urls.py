from django.urls import path, include
from rest_framework.routers import DefaultRouter
from messaging.views import (
    AvatarUploadView,
    ConversationListView,
    MessageViewSet,
    ProfileUpdateView,
    RegisterViewSet,
    RetrieveUserViewSet,
    ThemePreferenceView,
    UserListViewSet,
    WSTicketView,
)

router = DefaultRouter()
router.register(r"users", UserListViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path('messages/<int:target_user_id>/', MessageViewSet.as_view({'get': 'list'})),
    path("register", RegisterViewSet.as_view()),
    path("me", RetrieveUserViewSet.as_view()),
    path("ws-ticket", WSTicketView.as_view()),
    path("theme", ThemePreferenceView.as_view()),
    path("conversations", ConversationListView.as_view()),
    path("profile", ProfileUpdateView.as_view()),
    path("avatar", AvatarUploadView.as_view()),
]
