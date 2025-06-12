import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  // Animated background effect
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: { x: number; y: number; size: number; speedX: number; speedY: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
      });
    }

    const animate = () => {
      ctx!.fillStyle = 'rgba(17, 24, 39, 0.1)';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx!.fillStyle = 'rgba(99, 102, 241, 0.5)';
        ctx!.beginPath();
        ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx!.fill();

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.body.removeChild(canvas);
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    setIsLoading(true);
    const newRoomId = Math.random().toString(36).substring(2, 8);
    setTimeout(() => {
      navigate(`/game/${newRoomId}?player=${encodeURIComponent(playerName.trim())}`);
    }, 500);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) {
      alert('Please enter both your name and room ID');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      navigate(`/game/${roomId.trim()}?player=${encodeURIComponent(playerName.trim())}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            Pictionary Game
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unleash your creativity and test your guessing skills in this exciting multiplayer drawing game!
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105">
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter your name"
                />
                <label
                  htmlFor="playerName"
                  className="absolute left-4 -top-2.5 px-2 text-sm text-gray-400 bg-gray-800"
                >
                  Your Name
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter room ID to join"
                />
                <label
                  htmlFor="roomId"
                  className="absolute left-4 -top-2.5 px-2 text-sm text-gray-400 bg-gray-800"
                >
                  Room ID
                </label>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Room...' : 'Create New Room'}
                </button>
                
                <button
                  onClick={handleJoinRoom}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining Room...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => setShowRules(!showRules)}
            className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
          >
            {showRules ? 'Hide Rules' : 'Show Rules'}
          </button>
          
          {showRules && (
            <div className="mt-8 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-gray-800 p-6 rounded-xl transform transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold mb-2 text-indigo-400">Draw</h3>
                <p className="text-gray-300">
                  Use your mouse to draw the given word. Be creative and clear!
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl transform transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold mb-2 text-indigo-400">Guess</h3>
                <p className="text-gray-300">
                  Type your guesses in the chat. Be quick to earn more points!
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl transform transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2 text-indigo-400">Score</h3>
                <p className="text-gray-300">
                  Earn points for correct guesses. The faster you guess, the more points you get!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 