from django.urls import re_path

from messaging import consumer

websocket_urlpatterns = [
    re_path(r'ws/chat/$', consumer.ChatConsumer.as_asgi()),
]
