"""
ASGI config for realtime_messaging_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from messaging.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realtime_messaging_project.settings')

# ChatConsumer authenticates each connection itself via a short-lived ticket
# (messaging/ws_tickets.py) rather than Django sessions, so no auth middleware
# is wrapped around the websocket router here.
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': URLRouter(
        websocket_urlpatterns
    ),
})
