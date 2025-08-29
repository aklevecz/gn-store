/**
 * Parse TicTacToe board string from agent response into 2D array
 * @param {string} boardString - Board string like "0 | X |   |   |\n1 |   | O |   |\n2 |   |   |   |\n    0   1   2"
 * @returns {Array<Array<string>>} - 2D array of board state [['X', '', ''], ['', 'O', ''], ['', '', '']]
 */
export function parseBoardString(boardString) {
  if (!boardString) return [['', '', ''], ['', '', ''], ['', '', '']];
  
  try {
    // Split by newlines and filter out the header row
    const lines = boardString.split('\n').filter(line => line.trim() !== '');
    
    // Remove the last line (column numbers) and parse the board rows
    const boardRows = lines.slice(0, 3);
    
    const board = boardRows.map(row => {
      // Split by | and get the cells (skip the row number, take only 3 cells)
      const cells = row.split('|').slice(1, 4);
      
      // Clean up each cell - trim whitespace and default to empty string
      return cells.map(cell => {
        const value = cell.trim();
        return value === '' || value === ' ' ? '' : value;
      });
    });
    
    // Ensure we have exactly 3x3
    while (board.length < 3) {
      board.push(['', '', '']);
    }
    
    board.forEach(row => {
      while (row.length < 3) {
        row.push('');
      }
    });
    
    return board;
  } catch (error) {
    console.error('Error parsing board string:', error);
    return [['', '', ''], ['', '', ''], ['', '', '']];
  }
}

/**
 * Determine whose turn it is based on board state
 * @param {Array<Array<string>>} board - 2D array board state
 * @returns {string} - 'X' or 'O'
 */
export function getCurrentPlayer(board) {
  let xCount = 0;
  let oCount = 0;
  
  board.forEach(row => {
    row.forEach(cell => {
      if (cell === 'X') xCount++;
      if (cell === 'O') oCount++;
    });
  });
  
  // X always goes first, so if counts are equal, it's X's turn
  return xCount <= oCount ? 'X' : 'O';
}