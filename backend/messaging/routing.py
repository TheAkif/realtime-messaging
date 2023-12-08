from django.urls import re_path

from messaging.consumer import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<chat_uuid>[^/]+)/$', ChatConsumer.as_asgi()),
]
