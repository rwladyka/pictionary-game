import pytest
from main import app, manager, game_state
from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def reset_state():
    """Reset game state and connection manager before each test"""
    game_state.rooms = {}
    manager.active_connections = {}
    yield

@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app"""
    return TestClient(app) 