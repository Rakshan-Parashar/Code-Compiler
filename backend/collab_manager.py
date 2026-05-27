from typing import Optional
from fastapi import WebSocket

class CollaborationManager:
    def __init__(self):
        # Maps room_id -> {username: WebSocket}
        self.rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, room_id: str, username: str, websocket: WebSocket) -> list[str]:
        """Accepts the WebSocket connection and registers the user in the room."""
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        
        # Register user (overwrites old connection if same username connects again)
        self.rooms[room_id][username] = websocket
        return self.get_active_users(room_id)

    def disconnect(self, room_id: str, username: str) -> list[str]:
        """Unregisters the user and performs cleanup for empty rooms."""
        if room_id in self.rooms:
            if username in self.rooms[room_id]:
                del self.rooms[room_id][username]
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        return self.get_active_users(room_id)

    def get_active_users(self, room_id: str) -> list[str]:
        """Returns a list of usernames currently in the room."""
        if room_id in self.rooms:
            return list(self.rooms[room_id].keys())
        return []

    async def broadcast(self, room_id: str, message: dict, exclude_user: Optional[str] = None):
        """Sends a JSON message to all active web sockets in the room except the optional exclude_user."""
        if room_id not in self.rooms:
            return

        for username, websocket in self.rooms[room_id].items():
            if username == exclude_user:
                continue
            try:
                await websocket.send_json(message)
            except Exception:
                # Connection might have died, cleanup will happen on disconnect
                pass
