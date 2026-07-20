PRESENCE_GROUP = "presence"


def user_group_name(user_id) -> str:
    """Per-user Channels group. A user joins this once per connection (not
    once per conversation), so any event addressed to them - a message, a
    typing notification, a read receipt - reaches them live regardless of
    what conversation they currently have open."""
    return f"user_{user_id}"
