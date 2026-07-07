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

_redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True,
)

# GET+DEL as a single atomic step. Written as a Lua script (EVAL, supported
# since Redis 2.6) rather than the newer GETDEL command (Redis 6.2+) so this
# also works against older Redis builds.
_GET_AND_DELETE = """
local v = redis.call('GET', KEYS[1])
if v then redis.call('DEL', KEYS[1]) end
return v
"""


def create_ticket(user_id) -> str:
    ticket = secrets.token_urlsafe(32)
    _redis_client.setex(f"{_TICKET_KEY_PREFIX}{ticket}", TICKET_TTL_SECONDS, str(user_id))
    return ticket


def consume_ticket(ticket):
    """Redeem a ticket exactly once, returning the bound user id or None."""
    if not ticket:
        return None
    return _redis_client.eval(_GET_AND_DELETE, 1, f"{_TICKET_KEY_PREFIX}{ticket}")
