import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

interface GameState {
  currentDrawer: string;
  word: string;
  scores: { [key: string]: number };
  timeLeft: number;
  isGameOver: boolean;
}

interface Message {
  player: string;
  message: string;
  type: 'system' | 'chat' | 'correct' | 'wrong';
}

const Game = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('player') || 'Anonymous';
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentDrawer: '',
    word: '',
    scores: {},
    timeLeft: 60,
    isGameOver: false,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawer, setIsDrawer] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [guess, setGuess] = useState('');
  const [showWord, setShowWord] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalWord, setModalWord] = useState('');
  const [lastGuessedWord, setLastGuessedWord] = useState('');
  const [correctGuesser, setCorrectGuesser] = useState<string>('');
  const [roundEnded, setRoundEnded] = useState(false);

  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/${roomId}/${encodeURIComponent(playerName)}`;
    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      // Optionally send a join message if needed
      // Try to start a new round if this is the first player
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'new_round' }));
        }
      }, 500);
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { from, to, color, size } = msg.data;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else if (msg.type === 'clear_canvas') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (msg.type === 'correct_guess') {
        setMessages((prev) => [...prev, { player: msg.player_id, message: `guessed the word!`, type: 'correct' }]);
        setShowModal(true);
        setModalTitle(`${msg.player_id} guessed the word!`);
        setModalWord(msg.word);
        setLastGuessedWord(msg.word);
        setCorrectGuesser(msg.player_id);
        if (msg.scores) {
          setGameState((prev) => ({ ...prev, scores: msg.scores, timeLeft: 0 }));
        } else {
          setGameState((prev) => ({ ...prev, timeLeft: 0 }));
        }
        setRoundEnded(true);
      } else if (msg.type === 'wrong_guess') {
        // Do not add a chat message here; already handled on guess submit
      } else if (msg.type === 'guess') {
        setMessages((prev) => [...prev, { player: msg.player_id, message: `guessed: ${msg.guess}`, type: 'chat' }]);
      } else if (msg.type === 'round_start') {
        setGameState((prev) => ({ ...prev, currentDrawer: msg.drawer, timeLeft: 60 }));
        setIsDrawer(msg.drawer === playerName);
        setShowWord(msg.drawer === playerName);
        setShowModal(false);
        setModalTitle('');
        setModalWord('');
        // Clear canvas at start of new round
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setRoundEnded(false);
      } else if (msg.type === 'word') {
        setGameState((prev) => ({ ...prev, word: msg.word }));
      } else if (msg.type === 'player_left') {
        setMessages((prev) => [...prev, { player: msg.player_id, message: `left the game.`, type: 'system' }]);
      } else if (msg.type === 'time_update') {
        setGameState((prev) => ({ ...prev, timeLeft: msg.timeLeft }));
      } else if (msg.type === 'scores_update') {
        if (msg.scores) {
          setGameState((prev) => ({ ...prev, scores: msg.scores }));
        }
      } else if (msg.type === 'round_end') {
        setShowModal(true);
        setModalTitle(`Round ended!`);
        setModalWord(msg.word);
        setCorrectGuesser('');
        setRoundEnded(true);
      }
      // Add more message types as needed
    };

    socket.onclose = () => {
      setMessages((prev) => [...prev, { player: '', message: 'Connection closed.', type: 'system' }]);
      return () => {
        // Only close the socket if it's open (readyState is 1)
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    };

    return () => {
      // Only close the socket if it's open (readyState is 1)
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomId, playerName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isDrawer) return;
      isDrawingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      lastPosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !isDrawer) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const currentPos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.stroke();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'draw',
          data: {
            from: lastPosRef.current,
            to: currentPos,
            color: brushColor,
            size: brushSize,
          },
        }));
      }
      lastPosRef.current = currentPos;
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [ws, isDrawer, brushColor, brushSize]);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'guess', guess: guess.trim() }));
    setGuess('');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear_canvas' }));
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'draw',
        data: {
          from: lastPosRef.current,
          to: { x, y },
          color: brushColor,
          size: brushSize,
        },
      }));
    }
    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleExit = () => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    navigate('/');
  };

  const handleNextRound = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'new_round' }));
    }
    setShowModal(false);
    setModalTitle('');
    setModalWord('');
  };

  // Timer fallback if backend doesn't send time updates
  useEffect(() => {
    if (!gameState.timeLeft || gameState.timeLeft <= 0) return;
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft > 0) {
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.timeLeft]);

  // Timer fallback and auto end
  useEffect(() => {
    if (gameState.timeLeft === 0 && isDrawer && !roundEnded) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'round_end', word: gameState.word }));
      }
      setRoundEnded(true);
    }
  }, [gameState.timeLeft, isDrawer, ws, roundEnded, gameState.word]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExit}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-indigo-400">Game Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400">Room ID:</p>
                  <p className="font-mono bg-gray-700 p-2 rounded">{roomId}</p>
                </div>
                <div>
                  <p className="text-gray-400">Time Left:</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${(gameState.timeLeft / 60) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-right mt-1">{gameState.timeLeft}s</p>
                </div>
                <div>
                  <p className="text-gray-400">Current Drawer:</p>
                  <p className="font-semibold">{gameState.currentDrawer}</p>
                </div>
                {isDrawer && showWord && (
                  <div className="bg-indigo-900/50 p-4 rounded-lg">
                    <p className="text-gray-400">Word to Draw:</p>
                    <p className="text-2xl font-bold text-indigo-300">{gameState.word}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scores Panel */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-indigo-400">Scores</h2>
              <div className="space-y-2">
                {Object.entries(gameState.scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([player, score]) => (
                    <div
                      key={player}
                      className="flex justify-between items-center p-2 rounded-lg bg-gray-700/50"
                    >
                      <span className={player === playerName ? 'text-indigo-300 font-semibold' : ''}>
                        {player}
                      </span>
                      <span className="font-mono">{score}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Drawing Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full bg-gray-900 rounded-lg cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              {isDrawer && (
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32"
                  />
                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl h-[calc(100vh-2rem)] flex flex-col">
              <h2 className="text-2xl font-bold mb-4 text-indigo-400">Chat</h2>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.type === 'system'
                        ? 'bg-indigo-900/50 text-indigo-200'
                        : msg.type === 'correct'
                        ? 'bg-green-900/50 text-green-200'
                        : msg.type === 'wrong'
                        ? 'bg-red-900/50 text-red-200'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <span className="font-semibold text-indigo-300">{msg.player}: </span>
                    )}
                    {msg.message}
                  </div>
                ))}
              </div>
              <form onSubmit={handleGuess} className="space-y-2">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Type your guess..."
                  className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-white placeholder-gray-400"
                  disabled={isDrawer}
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors"
                  disabled={isDrawer}
                >
                  Send Guess
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for correct guess */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 w-72 md:w-96 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">{modalTitle}</h3>
            {modalWord && (
              <p className="text-lg font-medium mb-6">
                The word was: <span className="text-indigo-500 font-bold">{modalWord}</span>
              </p>
            )}
            {playerName === correctGuesser || correctGuesser === '' ? (
              <button
                onClick={handleNextRound}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-lg font-semibold transition-colors"
              >
                Next Round
              </button>
            ) : (
              <p className="mt-4 text-gray-600 text-sm">Waiting for the winner to start the next round...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 