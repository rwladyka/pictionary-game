import pytest
from main import GameState

@pytest.fixture
def game_state():
    return GameState()

def test_create_room(game_state):
    game_state.create_room("room1")
    assert "room1" in game_state.rooms
    assert game_state.rooms["room1"]["players"] == set()
    assert game_state.rooms["room1"]["drawer"] is None
    assert game_state.rooms["room1"]["word"] is None
    assert game_state.rooms["room1"]["scores"] == {}
    assert game_state.rooms["room1"]["guessed"] == set()

def test_add_player(game_state):
    game_state.add_player("room1", "player1")
    assert "room1" in game_state.rooms
    assert "player1" in game_state.rooms["room1"]["players"]
    assert game_state.rooms["room1"]["scores"]["player1"] == 0

def test_remove_player(game_state):
    # Setup
    game_state.add_player("room1", "player1")
    game_state.add_player("room1", "player2")
    
    # Test removing one player
    game_state.remove_player("room1", "player1")
    assert "player1" not in game_state.rooms["room1"]["players"]
    assert "player1" not in game_state.rooms["room1"]["scores"]
    assert "player2" in game_state.rooms["room1"]["players"]
    
    # Test removing last player (should remove room)
    game_state.remove_player("room1", "player2")
    assert "room1" not in game_state.rooms

def test_select_word(game_state):
    game_state.create_room("room1")
    word = game_state.select_word("room1")
    assert word in game_state.words
    assert game_state.rooms["room1"]["word"] == word
    assert game_state.rooms["room1"]["guessed"] == set()

def test_check_guess_correct(game_state):
    # Setup
    game_state.add_player("room1", "player1")
    game_state.rooms["room1"]["word"] = "cat"
    
    # Test correct guess
    assert game_state.check_guess("room1", "player1", "cat") is True
    assert game_state.rooms["room1"]["scores"]["player1"] == 1
    assert "player1" in game_state.rooms["room1"]["guessed"]
    
    # Test same player guessing correctly again
    assert game_state.check_guess("room1", "player1", "cat") is False
    assert game_state.rooms["room1"]["scores"]["player1"] == 1

def test_check_guess_incorrect(game_state):
    # Setup
    game_state.add_player("room1", "player1")
    game_state.rooms["room1"]["word"] = "cat"
    
    # Test wrong guess
    assert game_state.check_guess("room1", "player1", "dog") is False
    assert game_state.rooms["room1"]["scores"]["player1"] == 0
    assert "player1" not in game_state.rooms["room1"]["guessed"]

def test_check_guess_case_insensitive(game_state):
    # Setup
    game_state.add_player("room1", "player1")
    game_state.rooms["room1"]["word"] = "Cat"
    
    # Test case-insensitive matching
    assert game_state.check_guess("room1", "player1", "cat") is True
    assert game_state.check_guess("room1", "player1", "CAT") is False  # Already guessed

def test_check_guess_invalid_room(game_state):
    assert game_state.check_guess("nonexistent", "player1", "cat") is False

def test_check_guess_no_word_set(game_state):
    game_state.create_room("room1")
    assert game_state.check_guess("room1", "player1", "cat") is False 