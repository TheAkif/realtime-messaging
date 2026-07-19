"""
Tracks which users currently have a live WebSocket connection open, so the
other party in a conversation can see a real online/offline indicator.

A user can have more than one tab/device connected at once, so this is a
connection *counter* per user rather than a plain online/offline flag -
closing one tab shouldn't mark the user offline while another tab is still
connected.
"""
import redis
from django.conf import settings

_ONLINE_KEY_PREFIX = "online:"
# Safety net, not the primary mechanism: disconnect() is expected to always
# fire and decrement the counter. But a killed/crashed process never gets to
# run disconnect(), which would otherwise leave a counter stuck online
# forever - refreshing this TTL on every increment bounds how long a stale
# count can survive.
_TTL_SECONDS = 60 * 60
_redis_client = None


def _get_redis_client():
    # Built lazily for the same reason as ws_tickets.py: this module sits on
    # the ASGI import chain before Django has necessarily finished
    # configuring settings.
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True,
        )
    return _redis_client


def mark_online(user_id) -> int:
    """Returns the connection count after incrementing, so the caller can
    tell whether this was the user's first (0->1) connection."""
    client = _get_redis_client()
    key = f"{_ONLINE_KEY_PREFIX}{user_id}"
    count = client.incr(key)
    client.expire(key, _TTL_SECONDS)
    return count


def mark_offline(user_id) -> int:
    """Returns the connection count after decrementing, so the caller can
    tell whether this was the user's last (1->0) connection. Floors at 0 and
    deletes the key rather than going negative."""
    client = _get_redis_client()
    key = f"{_ONLINE_KEY_PREFIX}{user_id}"
    count = client.decr(key)
    if count <= 0:
        client.delete(key)
    return count


def is_online(user_id) -> bool:
    return _get_redis_client().exists(f"{_ONLINE_KEY_PREFIX}{user_id}") == 1
