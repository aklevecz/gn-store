import { parseBoardString } from '~/lib/tictactoe-parser';

export function TicTacToeBoard({ boardString, onCellClick, disabled = false }) {
  const board = parseBoardString(boardString);
  
  const handleCellClick = (rowIndex, colIndex) => {
    // Only allow clicks on empty cells when not disabled
    if (!disabled && board[rowIndex][colIndex] === '' && onCellClick) {
      onCellClick(rowIndex, colIndex);
    }
  };
  
  return (
    <div className="tictactoe-container">
      <div className={`tictactoe-board ${disabled ? 'board-disabled' : ''}`}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="tictactoe-row">
            {row.map((cell, colIndex) => {
              const isEmpty = cell === '';
              const isClickable = !disabled && isEmpty && onCellClick;
              
              return (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`tictactoe-cell ${cell ? `cell-${cell.toLowerCase()}` : 'cell-empty'} ${isClickable ? 'cell-clickable' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  <span className="cell-content">
                    {cell}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}