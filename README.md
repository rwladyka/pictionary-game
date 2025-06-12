# Pictionary Game

A real-time multiplayer Pictionary game built with React, TypeScript, Tailwind CSS, and FastAPI.

## Features

- Real-time drawing and guessing with WebSocket communication
- Multiple rooms support with unique room IDs
- Player scoring system with real-time updates
- Word selection system with random word generation
- Responsive design with Tailwind CSS
- Drawing tools:
  - Color picker
  - Brush size adjustment
  - Canvas clearing
- Game mechanics:
  - Round-based gameplay
  - Timer system
  - Score tracking
  - Player role management (drawer/guesser)
- Real-time chat with guess validation
- Modal system for game events
- Automatic round progression

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- WebSocket for real-time communication
- React Router for navigation
- ESLint + Prettier for code quality
- Vitest + React Testing Library for testing

### Backend
- FastAPI for the web framework
- WebSocket for real-time communication
- Pytest for testing
- Python-dotenv for configuration
- CORS middleware for security

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- npm or yarn package manager

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd pictionary-game
```

2. Copy the example environment files:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. Start the application using Docker Compose:
```bash
docker-compose up --build
```

4. Open your browser and navigate to `http://localhost:3000`

## Development Setup

### Frontend Development

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Run tests:
```bash
npm test
```

5. Run linting:
```bash
npm run lint
```

### Backend Development

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the development server:
```bash
uvicorn main:app --reload
```

5. Run tests:
```bash
python -m pytest
```

## Testing

### Frontend Tests
- Unit tests for components
- Integration tests for game logic
- WebSocket communication mocking
- React Testing Library for component testing
- Coverage reporting

### Backend Tests
- Unit tests for game state management
- WebSocket connection testing
- Message handling tests
- Integration tests for game logic
- Coverage reporting with pytest-cov

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-here
```

## Project Structure

```
.
├── frontend/                # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── __tests__/     # Test files
│   │   └── styles/        # CSS styles
│   ├── public/            # Static assets
│   └── package.json       # Dependencies and scripts
├── backend/               # FastAPI
│   ├── main.py           # Main application file
│   ├── tests/            # Test files
│   └── requirements.txt   # Python dependencies
├── docker/               # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
└── README.md            # Project documentation
```

## Game Rules

1. **Starting a Game**
   - Create a new room or join an existing one
   - First player becomes the drawer
   - Other players are guessers

2. **Gameplay**
   - Drawer gets a random word to draw
   - 60 seconds per round
   - Guessers type their guesses in chat
   - Points awarded for correct guesses
   - Round ends when word is guessed or time runs out

3. **Scoring**
   - First correct guess: 1 point
   - Drawer gets points when word is guessed
   - Scores are updated in real-time

## Troubleshooting

### Common Issues
1. WebSocket Connection:
   - Check if backend is running
   - Verify WebSocket URL in frontend
   - Check CORS settings

2. Docker:
   - Ensure ports 3000 and 8000 are available
   - Check Docker logs for errors
   - Verify environment variables

3. Development:
   - Clear browser cache
   - Restart development servers
   - Check console for errors