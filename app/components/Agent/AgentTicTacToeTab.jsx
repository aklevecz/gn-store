import { useAgentCompanion } from './AgentProvider';
import { useState } from 'react';
import { TicTacToeBoard } from '../TicTacToeBoard';

export function AgentTicTacToeTab() {
  const {
    currentGame,
    sendChatMessage,
    handleTicTacToeMove,
    isProcessing,
    selectedCharacter
  } = useAgentCompanion();

  const startNewGame = () => {
    sendChatMessage("Please start a new TicTacToe game");
  };

  const clearGame = () => {
    sendChatMessage("Please call the clearTicTacToeBoard tool");
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
            <TicTacToeBoard 
              boardString={currentGame.board}
              onCellClick={handleTicTacToeMove}
              disabled={isProcessing}
            />
            
            {currentGame?.message && (
              <div className="game-feedback">
                <div className="feedback-avatar">
                  <img 
                    src={selectedCharacter?.moods.happy}
                    alt={selectedCharacter?.name}
                    style={{ width: 32, height: 'auto' }}
                  />
                </div>
                <div className="feedback-message">
                  {currentGame.message}
                </div>
              </div>
            )}
            
            {isProcessing && (
              <div className="game-thinking">
                <div className="thinking-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>{selectedCharacter?.name} is thinking...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}