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

  // Lock body scroll when agent is visible on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth <= 640;
    if (isMobile && isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isVisible]);

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
          <div className="agent-panel">
            <div className="agent-body">
              <div className={`agent-character ${activeTab === 'chat' ? 'compact' : ''}`} data-character={selectedCharacter.id} data-mood={mood}>
                <button
                  className="agent-close-btn"
                  onClick={toggleVisibility}
                  aria-label="Close agent"
                >
                  ✕
                </button>
                <h3 className="agent-name">{selectedCharacter.name}</h3>
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
                <div className="agent-mood">Feeling {mood}</div>
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