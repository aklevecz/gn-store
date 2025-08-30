import { useAgentCompanion } from './AgentProvider';
import { useState, useRef, useEffect } from 'react';
import { TicTacToeBoard } from '../TicTacToeBoard';

export function AgentChatTab() {
  const {
    chatMessages,
    isProcessing,
    currentGame,
    sendChatMessage,
    handleTicTacToeMove,
    clearMessages,
    selectedCharacter
  } = useAgentCompanion();
  
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    sendChatMessage(input);
    setInput("");
  };

  const handleClearChat = () => {
    clearMessages();
  };

  return (
    <div className="agent-chat-tab">
      <div className="chat-header">
        <h4>Chat with {selectedCharacter?.name}</h4>
        <button 
          onClick={handleClearChat}
          className="clear-chat-btn"
          title="Clear chat history"
        >
          🗑️
        </button>
      </div>

      <div className="chat-messages">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="message assistant-message">
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Persistent TicTacToe Board */}
      {currentGame?.board && (
        <div className="current-game">
          <div className="game-status">
            <strong>{currentGame.message}</strong>
          </div>
          <TicTacToeBoard 
            boardString={currentGame.board}
            onCellClick={handleTicTacToeMove}
            disabled={isProcessing}
          />
        </div>
      )}

      <form onSubmit={handleChatSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Chat with ${selectedCharacter?.name}...`}
          className="chat-input"
          disabled={isProcessing}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={isProcessing || !input.trim()}
        >
          {isProcessing ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}