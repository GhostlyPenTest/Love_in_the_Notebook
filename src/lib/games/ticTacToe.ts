export type Mark = 'X' | 'O';
export interface TicTacToeState {
  board: (Mark | null)[]; // length 9
}

export function emptyBoard(): TicTacToeState {
  return { board: Array(9).fill(null) };
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(board: (Mark | null)[]): Mark | 'draw' | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every((c) => c !== null) ? 'draw' : null;
}
