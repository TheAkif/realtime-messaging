def room_name_for(chat_uuid_a, chat_uuid_b) -> str:
    """Canonical, order-independent room name shared by both participants."""
    pair = sorted([str(chat_uuid_a), str(chat_uuid_b)])
    return f"chat__{pair[0]}__{pair[1]}"
