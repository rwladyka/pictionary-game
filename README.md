# Pictionary Game

A real-time multiplayer Pictionary game built with React, TypeScript, Tailwind CSS, and FastAPI.

## Features

- Real-time drawing and guessing
- Multiple rooms support
- Player scoring system
- Word selection system
- Responsive design

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

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
├── frontend/           # React + TypeScript + Tailwind
├── backend/           # FastAPI
├── docker/           # Docker configuration
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 