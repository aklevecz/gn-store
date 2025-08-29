
/**
 * TicTacToe game types
 */
type Player = "X" | "O";
type CellValue = Player | null;
type Board = [
  [CellValue, CellValue, CellValue],
  [CellValue, CellValue, CellValue],
  [CellValue, CellValue, CellValue]
];

interface TicTacToeState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  gameActive: boolean;
}

/**
 * TicTacToe game tools
 */
const startTicTacToe = tool({
  description: "Start a new TicTacToe game. User plays as X, AI plays as O.",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();
    const gameState: TicTacToeState = {
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      currentPlayer: "X",
      winner: null,
      gameActive: true
    };
    
    // Use proper state management
    await (agent as any).setState({
      ...(agent as any).state,
      ticTacToeGame: gameState
    });
    
    return {
      message: "New TicTacToe game started! You are X, I am O. You go first!",
      board: formatBoard(gameState.board)
    };
  }
});

const showTicTacToeBoard = tool({
  description: "Show the current TicTacToe board state",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();
    const gameState = (agent as any).state?.ticTacToeGame as TicTacToeState | undefined;
    if (!gameState || !gameState.gameActive) {
      return "No active TicTacToe game. Use startTicTacToe to begin a new game.";
    }
    
    return {
      board: formatBoard(gameState.board),
      currentPlayer: gameState.currentPlayer,
      winner: gameState.winner
    };
  }
});

const makeTicTacToeMove = tool({
  description: "Make a move in TicTacToe game. Positions are 0-2 for both row and column.",
  parameters: z.object({
    row: z.number().min(0).max(2).describe("Row position (0-2)"),
    col: z.number().min(0).max(2).describe("Column position (0-2)")
  }),
  execute: async ({ row, col }) => {
    const { agent } = getCurrentAgent<Chat>();
    let gameState = (agent as any).state?.ticTacToeGame as TicTacToeState | undefined;
    
    if (!gameState || !gameState.gameActive) {
      return "No active TicTacToe game. Use startTicTacToe to begin a new game.";
    }
    
    if (gameState.currentPlayer !== "X") {
      return "It's not your turn! Wait for the AI to make a move.";
    }
    
    if (gameState.board[row][col] !== null) {
      return `Cell [${row}, ${col}] is already occupied! Choose an empty cell.`;
    }
    
    // Create a deep copy to avoid reference issues
    const newGameState: TicTacToeState = {
      board: gameState.board.map(row => [...row]) as TicTacToeState["board"],
      currentPlayer: gameState.currentPlayer,
      winner: gameState.winner,
      gameActive: gameState.gameActive
    };
    
    // Make player move
    newGameState.board[row][col] = "X";
    newGameState.winner = checkWinner(newGameState.board);
    
    if (newGameState.winner) {
      newGameState.gameActive = false;
      await (agent as any).setState({
        ...(agent as any).state,
        ticTacToeGame: newGameState
      });
      return {
        message: `You won! Congratulations! 🎉`,
        board: formatBoard(newGameState.board)
      };
    }
    
    // Check for draw
    if (isBoardFull(newGameState.board)) {
      newGameState.gameActive = false;
      await (agent as any).setState({
        ...(agent as any).state,
        ticTacToeGame: newGameState
      });
      return {
        message: "It's a draw! Good game!",
        board: formatBoard(newGameState.board)
      };
    }
    
    // Switch to AI turn
    newGameState.currentPlayer = "O";
    
    // AI makes a move
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      temperature: 0.1,
      prompt: `You are playing Tic-tac-toe as player O. Here's the current board state:

${JSON.stringify(newGameState.board, null, 2)}

Game rules and context:
- You are playing against X (the human player)
- Empty cells are null, X's are "X", O's are "O"
- Board positions are [row, col] from 0-2
- You need to respond with a single move as [row, col]
- Winning patterns: 3 in a row horizontally, vertically, or diagonally

Strategic priorities (in order):
1. If you can win in one move, take it
2. If opponent can win in one move, block it
3. If center is open, take it
4. If you can create a fork (two potential winning moves), do it
5. If opponent can create a fork next turn, block it
6. Take a corner if available
7. Take any edge

Analyze the board carefully and make the optimal move following these priorities.
Return only the [row, col] coordinates for your chosen move.`,
      schema: z.object({
        move: z.array(z.number()).length(2)
      })
    });
    
    const [aiRow, aiCol] = object.move;
    newGameState.board[aiRow][aiCol] = "O";
    newGameState.winner = checkWinner(newGameState.board);
    
    if (newGameState.winner) {
      newGameState.gameActive = false;
      await (agent as any).setState({
        ...(agent as any).state,
        ticTacToeGame: newGameState
      });
      return {
        message: "I won! Better luck next time! 😊",
        board: formatBoard(newGameState.board)
      };
    }
    
    // Check for draw after AI move
    if (isBoardFull(newGameState.board)) {
      newGameState.gameActive = false;
      await (agent as any).setState({
        ...(agent as any).state,
        ticTacToeGame: newGameState
      });
      return {
        message: "It's a draw! Good game!",
        board: formatBoard(newGameState.board)
      };
    }
    
    // Switch back to player
    newGameState.currentPlayer = "X";
    
    // Always save the state using proper setState
    await (agent as any).setState({
      ...(agent as any).state,
      ticTacToeGame: newGameState
    });
    
    return {
      message: `You played [${row}, ${col}]. I played [${aiRow}, ${aiCol}]. Your turn!`,
      board: formatBoard(newGameState.board)
    };
  }
});

const clearTicTacToeBoard = tool({
  description: "Clear the current TicTacToe game and reset the board",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();
    await (agent as any).setState({
      ...(agent as any).state,
      ticTacToeGame: undefined
    });
    return "TicTacToe board cleared. Use startTicTacToe to begin a new game.";
  }
});