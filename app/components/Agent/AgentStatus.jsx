import { useAgent } from './AgentProvider';

export function AgentStatus() {
  const { stats, selectedCharacter, insights } = useAgent();

  const getStatLabel = (value) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    if (value >= 20) return 'Low';
    return 'Critical';
  };

  const getStatColor = (value) => {
    if (value >= 80) return '#4ade80';
    if (value >= 60) return '#facc15';
    if (value >= 40) return '#fb923c';
    if (value >= 20) return '#f87171';
    return '#ef4444';
  };

  return (
    <div className="agent-status">
      <div className="agent-stats-detailed">
        <div className="stat-item">
          <div className="stat-header">
            <span className="stat-icon">😊</span>
            <span className="stat-name">Happiness</span>
            <span className="stat-value">{stats.happiness}%</span>
          </div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill-detailed"
              style={{ 
                width: `${stats.happiness}%`,
                backgroundColor: getStatColor(stats.happiness)
              }}
            />
          </div>
          <span className="stat-label">{getStatLabel(stats.happiness)}</span>
        </div>

        <div className="stat-item">
          <div className="stat-header">
            <span className="stat-icon">⚡</span>
            <span className="stat-name">Energy</span>
            <span className="stat-value">{stats.energy}%</span>
          </div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill-detailed"
              style={{ 
                width: `${stats.energy}%`,
                backgroundColor: getStatColor(stats.energy)
              }}
            />
          </div>
          <span className="stat-label">{getStatLabel(stats.energy)}</span>
        </div>

        <div className="stat-item">
          <div className="stat-header">
            <span className="stat-icon">🧠</span>
            <span className="stat-name">Intelligence</span>
            <span className="stat-value">{stats.intelligence}%</span>
          </div>
          <div className="stat-bar-container">
            <div 
              className="stat-bar-fill-detailed"
              style={{ 
                width: `${stats.intelligence}%`,
                backgroundColor: getStatColor(stats.intelligence)
              }}
            />
          </div>
          <span className="stat-label">{getStatLabel(stats.intelligence)}</span>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="agent-insights">
          <h4>Recent Insights</h4>
          <div className="insights-list">
            {insights.slice(0, 3).map(insight => (
              <div key={insight.id} className="insight-item">
                <p>{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="agent-tips">
        {stats.happiness < 40 && (
          <p className="tip-warning">
            {selectedCharacter.name} needs some music or eco-friendly treats! 🎵
          </p>
        )}
        {stats.energy < 40 && (
          <p className="tip-warning">
            {selectedCharacter.name} is tired! Try some solar power or organic snacks ⚡
          </p>
        )}
        {stats.intelligence < 40 && (
          <p className="tip-warning">
            {selectedCharacter.name} wants to learn! Feed them recycled materials or compost 🧠
          </p>
        )}
      </div>
    </div>
  );
}