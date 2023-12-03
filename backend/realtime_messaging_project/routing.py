# realtime_messaging_project/routing.py
from channels.routing import ProtocolTypeRouter, URLRouter

from messaging.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'websocket': URLRouter(
        websocket_urlpatterns
    ),
})
