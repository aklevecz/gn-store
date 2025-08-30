import { useAgentCompanion } from './AgentProvider';
import { AgentSelector } from './AgentSelector';
import { AgentStatus } from './AgentStatus';
import { AgentInventory } from './AgentInventory';
import { AgentChatTab } from './AgentChatTab';
import { AgentTicTacToeTab } from './AgentTicTacToeTab';
import { useEffect, useState } from 'react';

export function Agent() {
  const { 
    selectedCharacter, 
    isVisible, 
    toggleVisibility,
    mood,
    stats,
    isInitialized 
  } = useAgentCompanion();
  
  const [activeTab, setActiveTab] = useState('status');

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
            <div className="agent-header">
              <h3>{selectedCharacter.name}</h3>
              <div className="agent-mood">Feeling {mood}</div>
            </div>

            <div className="agent-body">
              <div className="agent-character" data-character={selectedCharacter.id} data-mood={mood}>
                <div className="agent-character-image">
                  <img 
                    src={selectedCharacter.moods[mood]}
                    alt={`${selectedCharacter.name} feeling ${mood}`}
                    style={{width:150, height:"auto"}}
                  />
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
                  Feed
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