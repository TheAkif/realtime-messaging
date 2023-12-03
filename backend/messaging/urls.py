from django.urls import path, include
from rest_framework.routers import DefaultRouter
from messaging.views import MessageViewSet, RegisterViewSet, RetrieveUserViewSet

router = DefaultRouter()
router.register(r'messages', MessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register', RegisterViewSet.as_view()),
    path('user', RetrieveUserViewSet.as_view())
]
