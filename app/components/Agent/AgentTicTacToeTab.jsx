import { useAgentCompanion } from './AgentProvider';
import { useState, useEffect } from 'react';
import { TicTacToeBoard } from '../TicTacToeBoard';
import { normalizeBoard } from '~/lib/tictactoe-parser';

export function AgentTicTacToeTab() {
  const {
    currentGame,
    sendChatMessage,
    handleTicTacToeMove,
    isProcessing,
    selectedCharacter
  } = useAgentCompanion();
  
  // Local optimistic board state
  const [optimisticBoard, setOptimisticBoard] = useState(null);
  
  // Update optimistic board when server game updates
  useEffect(() => {
    if (currentGame?.board) {
      setOptimisticBoard(null); // Clear optimistic state when server updates
    }
  }, [currentGame]);

  const startNewGame = () => {
    setOptimisticBoard(null);
    sendChatMessage("Please start a new TicTacToe game", { isToolCall: true });
  };

  const clearGame = () => {
    setOptimisticBoard(null);
    sendChatMessage("Please call the clearTicTacToeBoard tool", { isToolCall: true });
  };
  
  const handleOptimisticMove = (row, col) => {
    if (!currentGame?.board || isProcessing) return;
    
    // Normalize the current board (raw array format)
    const board = normalizeBoard(currentGame.board);
    
    // Check if cell is empty
    if (board[row][col] !== '') return;
    
    // Create optimistic board with the user's X (keep as raw array)
    const optimisticBoardArray = board.map((boardRow, rIndex) => 
      boardRow.map((cell, cIndex) => 
        rIndex === row && cIndex === col ? 'X' : cell
      )
    );
    
    setOptimisticBoard(optimisticBoardArray);
    
    // Send the actual move to the server
    handleTicTacToeMove(row, col);
  };

  return (
    <div className="agent-tictactoe-tab">
      <div className="tictactoe-header">
        <h4>TicTacToe with {selectedCharacter?.name}</h4>
        <div className="tictactoe-controls">
          <button 
            onClick={startNewGame}
            disabled={isProcessing}
            className="game-control-btn start-btn"
          >
            {isProcessing ? 'Starting...' : 'New Game'}
          </button>
          {currentGame && (
            <button 
              onClick={clearGame}
              disabled={isProcessing}
              className="game-control-btn clear-btn"
            >
              Clear Game
            </button>
          )}
        </div>
      </div>

      <div className="tictactoe-content">
        {!currentGame ? (
          <div className="no-game-state">
            <div className="game-character">
              <img 
                src={selectedCharacter?.moods.neutral || selectedCharacter?.defaultImage}
                alt={selectedCharacter?.name}
                style={{ width: 80, height: 'auto' }}
              />
            </div>
            <p>Ready to play TicTacToe?</p>
            <p>Click "New Game" to start!</p>
          </div>
        ) : (
          <div className="active-game">
            <div className={optimisticBoard ? 'optimistic-board' : ''}>
              <TicTacToeBoard 
                board={optimisticBoard || currentGame.board}
                onCellClick={handleOptimisticMove}
                disabled={isProcessing}
              />
            </div>
            
            {/* Game Status Info */}
            {/* {currentGame && (
              <div className="game-status-bar">
                <div className="game-status-info">
                  <span className="current-player">
                    Current Turn: <strong>{currentGame.currentPlayer || 'X'}</strong>
                  </span>
                  {currentGame.winner && (
                    <span className="winner-status">
                      Winner: <strong>{currentGame.winner}</strong>
                    </span>
                  )}
                  {currentGame.lastMove && (
                    <span className="last-move">
                      Last Move: [{currentGame.lastMove.row}, {currentGame.lastMove.col}]
                    </span>
                  )}
                </div>
              </div>
            )} */}

            <div className="game-feedback">
              <div className="feedback-avatar">
                <img 
                  src={selectedCharacter?.moods.happy}
                  alt={selectedCharacter?.name}
                  style={{ width: 32, height: 'auto' }}
                />
              </div>
              <div className="feedback-message">
                {isProcessing ? (
                  <div className="thinking-inline">
                    <span>{selectedCharacter?.name} is thinking</span>
                    <span className="thinking-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                ) : (
                  currentGame?.message || 'Make your move!'
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}