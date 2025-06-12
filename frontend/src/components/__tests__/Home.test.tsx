import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Home from '../Home';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Stub canvas 2D context and requestAnimationFrame for jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
    fillRect: vi.fn(),
    fillStyle: '',
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  }) as unknown as CanvasRenderingContext2D);

  // Prevent animation loop and act warnings
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Home component', () => {
  test('renders page heading', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', {
        name: /pictionary game/i,
      }),
    ).toBeInTheDocument();
  });

  test('toggles rules visibility', async () => {
    const user = userEvent.setup();
    render(<Home />);
    const toggle = screen.getByRole('button', { name: /show rules/i });

    await user.click(toggle);
    expect(screen.getByRole('button', { name: /hide rules/i })).toBeInTheDocument();
    // One of the rule cards
    expect(screen.getByText(/use your mouse to draw/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /hide rules/i }));
    expect(screen.getByRole('button', { name: /show rules/i })).toBeInTheDocument();
  });

  test('creates room and navigates when player name provided', async () => {
    const user = userEvent.setup();
    render(<Home />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    await user.type(nameInput, 'Tester');

    const createBtn = screen.getByRole('button', { name: /create new room/i });

    // Fix Math.random to deterministic value
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

    await user.click(createBtn);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled(), { timeout: 600 });

    const calledWith: string = mockNavigate.mock.calls[0][0];
    expect(calledWith).toMatch(/\/game\//);
    expect(calledWith).toMatch(/\?player=Tester$/);
  });

  test('joins room and navigates when name and room id provided', async () => {
    const user = userEvent.setup();
    render(<Home />);

    const nameInput = screen.getByPlaceholderText(/enter your name/i);
    const roomInput = screen.getByPlaceholderText(/enter room id to join/i);

    await user.type(nameInput, 'Tester');
    await user.type(roomInput, 'room12');

    const joinBtn = screen.getByRole('button', { name: /join room/i });

    await user.click(joinBtn);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/game/room12?player=Tester'), {
      timeout: 600,
    });
  });
});
