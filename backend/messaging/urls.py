from django.urls import path, include
from rest_framework.routers import DefaultRouter
from messaging.views import MessageViewSet, RegisterViewSet, RetrieveUserViewSet, UserListViewSet

router = DefaultRouter()
# router.register(r"messages", MessageViewSet)
router.register(r"users", UserListViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path('messages/<int:target_user_id>/', MessageViewSet.as_view({'get': 'list'})),
    path("register", RegisterViewSet.as_view()),
    path("me", RetrieveUserViewSet.as_view()),
]
