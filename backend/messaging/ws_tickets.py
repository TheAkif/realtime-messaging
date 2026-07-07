"""
Short-lived, single-use tickets that let an already-authenticated (JWT/cookie)
HTTP request hand off identity to a WebSocket connection.

Browsers can't attach the httpOnly JWT cookie or a custom Authorization header
to a WebSocket handshake, so the frontend first calls the authenticated
GET /api/users/ws-ticket endpoint to mint a ticket, then opens the socket with
that ticket as a query param. The ticket is redeemed exactly once.
"""
import secrets

import redis
from django.conf import settings

TICKET_TTL_SECONDS = 30
_TICKET_KEY_PREFIX = "ws_ticket:"

# GET+DEL as a single atomic step. Written as a Lua script (EVAL, supported
# since Redis 2.6) rather than the newer GETDEL command (Redis 6.2+) so this
# also works against older Redis builds.
_GET_AND_DELETE = """
local v = redis.call('GET', KEYS[1])
if v then redis.call('DEL', KEYS[1]) end
return v
"""

_redis_client = None


def _get_redis_client():
    # Built lazily rather than at import time: this module is imported as
    # part of the ASGI app chain (asgi.py -> messaging.routing ->
    # messaging.consumer -> here) before Django has necessarily finished
    # configuring settings, so touching `settings.REDIS_HOST` at module
    # import time can raise ImproperlyConfigured depending on import order.
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True,
        )
    return _redis_client


def create_ticket(user_id) -> str:
    ticket = secrets.token_urlsafe(32)
    _get_redis_client().setex(f"{_TICKET_KEY_PREFIX}{ticket}", TICKET_TTL_SECONDS, str(user_id))
    return ticket


def consume_ticket(ticket):
    """Redeem a ticket exactly once, returning the bound user id or None."""
    if not ticket:
        return None
    return _get_redis_client().eval(_GET_AND_DELETE, 1, f"{_TICKET_KEY_PREFIX}{ticket}")
