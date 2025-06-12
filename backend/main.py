from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import random
from typing import Dict, List, Set
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Game state
class GameState:
    def __init__(self):
        self.rooms: Dict[str, Dict] = {}
        self.words = [
            "cat", "dog", "house", "tree", "sun", "moon", "star", "book",
            "chair", "table", "computer", "phone", "car", "bike", "flower",
            "mountain", "river", "ocean", "beach", "cloud"
        ]

    def create_room(self, room_id: str) -> None:
        self.rooms[room_id] = {
            "players": set(),
            "drawer": None,
            "word": None,
            "scores": {},
            "guessed": set()
        }

    def add_player(self, room_id: str, player_id: str) -> None:
        if room_id not in self.rooms:
            self.create_room(room_id)
        self.rooms[room_id]["players"].add(player_id)
        self.rooms[room_id]["scores"][player_id] = 0

    def remove_player(self, room_id: str, player_id: str) -> None:
        if room_id in self.rooms:
            self.rooms[room_id]["players"].discard(player_id)
            if player_id in self.rooms[room_id]["scores"]:
                del self.rooms[room_id]["scores"][player_id]
            if not self.rooms[room_id]["players"]:
                del self.rooms[room_id]

    def select_word(self, room_id: str) -> str:
        word = random.choice(self.words)
        self.rooms[room_id]["word"] = word
        self.rooms[room_id]["guessed"] = set()
        return word

    def check_guess(self, room_id: str, player_id: str, guess: str) -> bool:
        if room_id not in self.rooms:
            return False
        word = self.rooms[room_id].get("word")
        if not word:
            return False  # No word set yet, can't check
        if guess.lower() == word.lower():
            if player_id not in self.rooms[room_id]["guessed"]:
                self.rooms[room_id]["guessed"].add(player_id)
                self.rooms[room_id]["scores"][player_id] += 1
                return True
        return False

game_state = GameState()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, player_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][player_id] = websocket
        game_state.add_player(room_id, player_id)

    def disconnect(self, room_id: str, player_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(player_id, None)
            game_state.remove_player(room_id, player_id)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id].values():
                await connection.send_json(message)

    async def send_personal_message(self, room_id: str, player_id: str, message: dict):
        if room_id in self.active_connections and player_id in self.active_connections[room_id]:
            await self.active_connections[room_id][player_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await manager.connect(websocket, room_id, player_id)
    # Broadcast updated scores to everyone in the room when a player joins
    await manager.broadcast_to_room(room_id, {
        "type": "scores_update",
        "scores": game_state.rooms[room_id]["scores"]
    })
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "draw":
                # Broadcast drawing data to all players except the drawer
                await manager.broadcast_to_room(room_id, {
                    "type": "draw",
                    "data": message["data"],
                    "player_id": player_id
                })
            
            elif message["type"] == "guess":
                # Broadcast the guess to all players
                await manager.broadcast_to_room(room_id, {
                    "type": "guess",
                    "player_id": player_id,
                    "guess": message["guess"]
                })
                is_correct = game_state.check_guess(room_id, player_id, message["guess"])
                if is_correct:
                    await manager.broadcast_to_room(room_id, {
                        "type": "correct_guess",
                        "player_id": player_id,
                        "word": game_state.rooms[room_id]["word"],
                        "scores": game_state.rooms[room_id]["scores"]
                    })
                else:
                    await manager.send_personal_message(room_id, player_id, {
                        "type": "wrong_guess"
                    })
            
            elif message["type"] == "new_round":
                word = game_state.select_word(room_id)
                await manager.send_personal_message(room_id, player_id, {
                    "type": "word",
                    "word": word
                })
                await manager.broadcast_to_room(room_id, {
                    "type": "round_start",
                    "drawer": player_id
                })

            elif message["type"] == "clear_canvas":
                await manager.broadcast_to_room(room_id, {
                    "type": "clear_canvas"
                })

            elif message["type"] == "round_end":
                # Broadcast that the round has ended and reveal the word
                await manager.broadcast_to_room(room_id, {
                    "type": "round_end",
                    "word": message["word"]
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, player_id)
        await manager.broadcast_to_room(room_id, {
            "type": "player_left",
            "player_id": player_id
        })
        # Broadcast updated scores after player leaves
        if room_id in game_state.rooms:
            await manager.broadcast_to_room(room_id, {
                "type": "scores_update",
                "scores": game_state.rooms[room_id]["scores"]
            })

@app.get("/")
async def root():
    return {"message": "Pictionary Game API"} 