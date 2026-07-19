import pytest
import redis
from django.conf import settings


@pytest.fixture(autouse=True)
def _clear_presence_state():
    """
    Presence counters live in Redis, which isn't part of Django's per-test
    transaction rollback - and @pytest.mark.django_db(transaction=True)
    resets Postgres's auto-increment sequences, so a fresh test's "user 1"
    can inherit a stale online:1 counter left behind by an earlier test (or
    a crashed process) that never reached zero. Clear it before and after
    every test so presence assertions start from a known state.
    """
    client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
    for key in client.scan_iter("online:*"):
        client.delete(key)
    yield
    for key in client.scan_iter("online:*"):
        client.delete(key)
