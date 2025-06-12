import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import Game from '../Game';

// ---- Mock WebSocket ----
class MockWebSocket {
  // Static constants to mimic WebSocket API
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];
  public readyState = 1; // OPEN
  public sent: string[] = [];
  public onopen: (() => void) | null = null;
  public onmessage: ((e: { data: string }) => void) | null = null;
  public onclose: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    // simulate async open
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose && this.onclose();
  }

  // helper for tests
  receive(json: unknown) {
    this.onmessage && this.onmessage({ data: JSON.stringify(json) });
  }
}

// Setup mocks
beforeAll(() => {
  vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
  
  // Canvas mock
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
  })) as unknown as any;

  // Timer mocks
  vi.useFakeTimers();
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

beforeEach(() => {
  MockWebSocket.instances.length = 0;
  cleanup(); // ensure DOM is clean
});

afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

describe('Game component', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={[`/game/room1?player=Tester`]}>
        <Routes>
          <Route path="/game/:roomId" element={<Game />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  test('renders room ID and sends new_round on open', async () => {
    renderComponent();
    
    const ws = MockWebSocket.instances[0];
    const sendSpy = vi.spyOn(ws, 'send');

    await act(async () => {
      // Trigger the WebSocket onopen callback
      ws.onopen && ws.onopen();
      // Advance timers by 500ms to trigger the setTimeout
      vi.advanceTimersByTime(500);
    });

    expect(ws).toBeDefined();
    expect(screen.getByText('room1')).toBeInTheDocument();
    expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('"type":"new_round"'));
  });

  test('submitting guess message', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();
    
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    const ws = MockWebSocket.instances[0];
    const sendSpy = vi.spyOn(ws, 'send');
    
    const input = screen.getByTestId("guess-input");
    await user.type(input, 'apple');
    
    expect(input).toHaveValue('apple');
    
    await user.click(screen.getByTestId("send-guess-button"));
    
    expect(sendSpy).toHaveBeenCalledWith(expect.stringContaining('"guess":"apple"'));
  });

  test('shows word to draw when player is drawer', async () => {
    renderComponent();
    
    await act(async () => {
      vi.advanceTimersByTime(0);
      const ws = MockWebSocket.instances[0];
      ws.receive({ type: 'round_start', drawer: 'Tester' });
      ws.receive({ type: 'word', word: 'tree' });
    });

    expect(screen.getByText(/word to draw/i)).toBeInTheDocument();
    expect(screen.getByText('tree')).toBeInTheDocument();
  });

  test('correct guess modal behavior', async () => {
    renderComponent();
    
    await act(async () => {
      vi.advanceTimersByTime(0);
      const ws = MockWebSocket.instances[0];
      ws.receive({ type: 'correct_guess', player_id: 'Alice', word: 'dog', scores: { Alice: 10 } });
    });

    expect(screen.getByText('Alice guessed the word!')).toBeInTheDocument();
    expect(screen.getByText(/waiting for the winner/i)).toBeInTheDocument();
  });
}); 