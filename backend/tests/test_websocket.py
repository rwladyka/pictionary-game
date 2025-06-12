import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
import json
from main import app, manager, game_state

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
def reset_state():
    # Reset game state and connection manager before each test
    game_state.rooms = {}
    manager.active_connections = {}

class MockWebSocket:
    def __init__(self):
        self.sent_messages = []
        self.closed = False
    
    async def accept(self):
        pass
    
    async def send_json(self, data):
        self.sent_messages.append(data)
    
    async def receive_text(self):
        return "{}"
    
    def close(self):
        self.closed = True

@pytest.mark.asyncio
async def test_websocket_connect(reset_state):
    ws = MockWebSocket()
    await manager.connect(ws, "room1", "player1")
    
    assert "room1" in manager.active_connections
    assert "player1" in manager.active_connections["room1"]
    assert "room1" in game_state.rooms
    assert "player1" in game_state.rooms["room1"]["players"]

@pytest.mark.asyncio
async def test_websocket_disconnect(reset_state):
    # Setup
    ws = MockWebSocket()
    await manager.connect(ws, "room1", "player1")
    
    # Test
    manager.disconnect("room1", "player1")
    
    assert "player1" not in manager.active_connections["room1"]
    assert "room1" not in game_state.rooms  # Room should be removed when last player leaves

@pytest.mark.asyncio
async def test_broadcast_to_room(reset_state):
    # Setup
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect(ws1, "room1", "player1")
    await manager.connect(ws2, "room1", "player2")
    
    # Test
    message = {"type": "test", "data": "hello"}
    await manager.broadcast_to_room("room1", message)
    
    assert ws1.sent_messages == [message]
    assert ws2.sent_messages == [message]

@pytest.mark.asyncio
async def test_send_personal_message(reset_state):
    # Setup
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect(ws1, "room1", "player1")
    await manager.connect(ws2, "room1", "player2")
    
    # Test
    message = {"type": "test", "data": "hello"}
    await manager.send_personal_message("room1", "player1", message)
    
    assert ws1.sent_messages == [message]
    assert ws2.sent_messages == []

@pytest.mark.asyncio
async def test_handle_draw_message(reset_state):
    # Setup
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect(ws1, "room1", "player1")
    await manager.connect(ws2, "room1", "player2")
    
    # Test
    draw_data = {
        "type": "draw",
        "data": {"x": 100, "y": 100}
    }
    
    await manager.broadcast_to_room("room1", {
        "type": "draw",
        "data": draw_data["data"],
        "player_id": "player1"
    })
    
    expected_message = {
        "type": "draw",
        "data": draw_data["data"],
        "player_id": "player1"
    }
    
    assert ws1.sent_messages == [expected_message]
    assert ws2.sent_messages == [expected_message]

@pytest.mark.asyncio
async def test_handle_guess_message_correct(reset_state):
    # Setup
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect(ws1, "room1", "player1")
    await manager.connect(ws2, "room1", "player2")
    
    # Set the word and check the guess
    game_state.rooms["room1"]["word"] = "cat"
    is_correct = game_state.check_guess("room1", "player1", "cat")
    
    # Test correct guess
    if is_correct:
        await manager.broadcast_to_room("room1", {
            "type": "guess",
            "player_id": "player1",
            "guess": "cat"
        })
        
        await manager.broadcast_to_room("room1", {
            "type": "correct_guess",
            "player_id": "player1",
            "word": "cat",
            "scores": game_state.rooms["room1"]["scores"]
        })
    
    # Both players should receive the guess message
    assert any(m["type"] == "guess" for m in ws1.sent_messages)
    assert any(m["type"] == "guess" for m in ws2.sent_messages)
    
    # Both players should receive the correct_guess message
    assert any(
        m["type"] == "correct_guess" and 
        m["player_id"] == "player1" and 
        m["word"] == "cat"
        for m in ws1.sent_messages
    )
    
    # Verify score was updated
    assert game_state.rooms["room1"]["scores"]["player1"] == 1

@pytest.mark.asyncio
async def test_handle_guess_message_incorrect(reset_state):
    # Setup
    ws = MockWebSocket()
    await manager.connect(ws, "room1", "player1")
    
    # Set the word
    game_state.rooms["room1"]["word"] = "cat"
    
    # Test incorrect guess
    await manager.send_personal_message("room1", "player1", {
        "type": "wrong_guess"
    })
    
    assert any(m["type"] == "wrong_guess" for m in ws.sent_messages)

@pytest.mark.asyncio
async def test_handle_new_round(reset_state):
    # Setup
    ws = MockWebSocket()
    await manager.connect(ws, "room1", "player1")
    
    # Test new round
    word = game_state.select_word("room1")
    await manager.send_personal_message("room1", "player1", {
        "type": "word",
        "word": word
    })
    
    await manager.broadcast_to_room("room1", {
        "type": "round_start",
        "drawer": "player1"
    })
    
    assert any(
        m["type"] == "word" and 
        m["word"] == word
        for m in ws.sent_messages
    )
    
    assert any(
        m["type"] == "round_start" and 
        m["drawer"] == "player1"
        for m in ws.sent_messages
    ) 