import { CHARACTERS } from './constants';
import { useAgentCompanion } from './AgentProvider';

export function AgentSelector() {
  const { selectCharacter } = useAgentCompanion();

  return (
    <div className="agent-selector">
      <div className="agent-selector-header">
        <h2>Choose Your Companion!</h2>
        <p>Select an agent to guide you through your sustainable music journey</p>
      </div>
      
      <div className="agent-selector-options">
        {Object.entries(CHARACTERS).map(([key, character]) => (
          <div
            key={character.id}
            className="agent-selector-card"
          >
            <div className="agent-selector-image">
              <img 
                src={`/characters/${character.id}-thumbsup.png`}
                alt={character.name}
                width="100"
                height="100"
              />
            </div>
            <h3>{character.name}</h3>
            <div className="agent-selector-description">{character.description}</div>
            <button 
              className="agent-selector-choose button"
              onClick={() => selectCharacter(key)}
            >
              Choose {character.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}