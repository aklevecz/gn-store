import { useAgentCompanion } from './AgentProvider';
import { AgentSelector } from './AgentSelector';
import { AgentStatus } from './AgentStatus';
import { AgentInventory } from './AgentInventory';
import { AgentChatTab } from './AgentChatTab';
import { AgentTicTacToeTab } from './AgentTicTacToeTab';
import { useEffect, useState, useRef } from 'react';

export function Agent() {
  const {
    selectedCharacter,
    isVisible,
    toggleVisibility,
    mood,
    stats,
    isInitialized,
    playingAnimation
  } = useAgentCompanion();

  const [activeTab, setActiveTab] = useState('status');
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const panelRef = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setDragStart(touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;

    const touch = e.touches[0];
    const offset = touch.clientY - dragStart;

    // Only allow dragging down
    if (offset > 0) {
      setDragOffset(offset);
      // Prevent browser pull-to-refresh when dragging
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    // If dragged down more than 50px, dismiss (more sensitive)
    if (dragOffset > 50) {
      toggleVisibility();
    }

    // Reset
    setDragStart(null);
    setDragOffset(0);
  };

  // Don't render on server or before initialization
  if (!isInitialized || typeof window === 'undefined') {
    return null;
  }

  // Show character selector if none selected
  if (!selectedCharacter) {
    return (
      <div className="agent-modal">
        <div className="agent-modal-backdrop" />
        <div className="agent-modal-content">
          <AgentSelector />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating agent widget */}
      <div className={`agent-widget ${isVisible ? 'agent-visible' : 'agent-minimized'}`}>
        <button 
          className="agent-toggle"
          onClick={toggleVisibility}
          aria-label={isVisible ? 'Minimize agent' : 'Show agent'}
        >
          <div className="agent-avatar" data-mood={mood}>
            <img 
              src={selectedCharacter.moods[mood]}
              alt={selectedCharacter.name}
              width="48"
              height="48"
              style={{ borderRadius: '50%' }}
            />
            {!isVisible && stats.happiness < 40 && (
              <span className="agent-notification">!</span>
            )}
          </div>
        </button>

        {isVisible && (
          <div
            ref={panelRef}
            className="agent-panel"
            style={{
              transform: `translateY(${dragOffset}px)`,
              transition: dragStart === null ? 'transform 0.3s ease' : 'none'
            }}
          >
            <div
              className="agent-drag-area"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="agent-drag-handle"></div>
            </div>
            <div className="agent-header">
              <div className="agent-header-content">
                <h3>{selectedCharacter.name}</h3>
                <div className="agent-mood">Feeling {mood}</div>
              </div>
              <button
                className="agent-close-btn"
                onClick={toggleVisibility}
                aria-label="Close agent"
              >
                ✕
              </button>
            </div>

            <div className="agent-body">
              <div className="agent-character" data-character={selectedCharacter.id} data-mood={mood}>
                <div className="agent-character-image">
                  {playingAnimation ? (
                    <video
                      src={`/animations/${selectedCharacter.id}_${playingAnimation}.mp4`}
                      autoPlay
                      muted
                      playsInline
                      style={{width:'auto', height:250}}
                      onEnded={() => {/* Animation will be cleared by timeout in feedItem */}}
                    />
                  ) : (
                    <img 
                      src={selectedCharacter.moods[mood]}
                      alt={`${selectedCharacter.name} feeling ${mood}`}
                      style={{width:150, height:"auto"}}
                    />
                  )}
                </div>
              </div>

              {/* <div className="agent-quick-stats">
                <div className="stat-bar">
                  <span>😊</span>
                  <div className="stat-bar-fill" style={{ width: `${stats.happiness}%` }} />
                </div>
                <div className="stat-bar">
                  <span>⚡</span>
                  <div className="stat-bar-fill" style={{ width: `${stats.energy}%` }} />
                </div>
                <div className="stat-bar">
                  <span>🧠</span>
                  <div className="stat-bar-fill" style={{ width: `${stats.intelligence}%` }} />
                </div>
              </div> */}

              <div className="agent-actions">
                <button 
                  className={`agent-action-btn ${activeTab === 'status' ? 'active' : ''}`}
                  onClick={() => setActiveTab('status')}
                >
                  Stats
                </button>
                <button 
                  className={`agent-action-btn ${activeTab === 'feed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('feed')}
                >
                  Treat
                </button>
                <button 
                  className={`agent-action-btn ${activeTab === 'game' ? 'active' : ''}`}
                  onClick={() => setActiveTab('game')}
                >
                  Game
                </button>
                <button 
                  className={`agent-action-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  Chat
                </button>
              </div>

              {activeTab === 'status' && <AgentStatus />}
              {activeTab === 'feed' && <AgentInventory />}
              {activeTab === 'game' && <AgentTicTacToeTab />}
              {activeTab === 'chat' && <AgentChatTab />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}