import { ITEMS } from './constants';
import { useAgentCompanion } from './AgentProvider';
import { useState } from 'react';

export function AgentInventory() {
  const { feedItem, selectedCharacter, stats } = useAgentCompanion();
  const [selectedTab, setSelectedTab] = useState('all');
  const [feedingItem, setFeedingItem] = useState(null);

  const handleFeedItem = (itemId) => {
    setFeedingItem(itemId);
    feedItem(itemId);
    
    // Show feeding animation
    setTimeout(() => {
      setFeedingItem(null);
    }, 1000);
  };

  const filterItems = () => {
    return Object.values(ITEMS).filter(item => {
      if (selectedTab === 'all') return true;
      return item.type === selectedTab;
    });
  };

  const getItemIcon = (itemId) => {
    // All icons are now images
    const iconPaths = {
      coffee: '/icons/coffee-icon.png',
      // Future items (currently commented out in ITEMS)
      vinyl: '/icons/vinyl-icon.png',
      ticket: '/icons/ticket-icon.png',
      note: '/icons/note-icon.png',
      solar: '/icons/solar-icon.png',
      recycled: '/icons/recycled-icon.png',
      organic: '/icons/organic-icon.png',
      seeds: '/icons/seeds-icon.png',
      water: '/icons/water-icon.png',
      compost: '/icons/compost-icon.png',
    };
    return iconPaths[itemId] || '/icons/default-icon.png';
  };

  return (
    <div className="agent-inventory">
      <div className="inventory-tabs">
        <button 
          className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          All Items
        </button>
        <button 
          className={`tab ${selectedTab === 'music' ? 'active' : ''}`}
          onClick={() => setSelectedTab('music')}
        >
          Music
        </button>
        <button 
          className={`tab ${selectedTab === 'eco' ? 'active' : ''}`}
          onClick={() => setSelectedTab('eco')}
        >
          Eco
        </button>
      </div>

      <div className="inventory-grid">
        {filterItems().map(item => (
          <button
            key={item.id}
            className={`inventory-item ${feedingItem === item.id ? 'feeding' : ''}`}
            onClick={() => handleFeedItem(item.id)}
            disabled={feedingItem !== null}
          >
            <span className="item-icon">
              <img 
                src={getItemIcon(item.id)} 
                alt={item.name} 
              />
            </span>
            <span className="item-name">{item.name}</span>
            {/* <div className="item-effects">
              {Object.entries(item.effect).map(([stat, value]) => (
                <span key={stat} className="effect">
                  {stat === 'happiness' && '😊'}
                  {stat === 'energy' && '⚡'}
                  {stat === 'intelligence' && '🧠'}
                  +{value}
                </span>
              ))}
            </div> */}
          </button>
        ))}
      </div>

      {/* <div className="inventory-tip">
        {selectedCharacter.id === 'groovy' ? (
          <p>🎵 Groovy loves music items but eco items work too!</p>
        ) : (
          <p>🌍 Globby prefers eco items but enjoys music too!</p>
        )}
      </div> */}
    </div>
  );
}