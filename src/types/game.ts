/**
 * Core game types for Go game editor
 */

export type Color = 'B' | 'W';
export type Symbol = 'triangle' | 'square' | 'circle' | null;
export type BoardSize = 19 | 13 | 9;

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  id: string;
  moveNumber: number;
  color: Color;
  x: number;
  y: number;
  comment: string | null;
  symbols: Symbol;
  variants: Variant[];
  parentMoveId: string | null;
  createdAt: Date;
}

export interface Variant {
  id: string;
  moveId: string;
  moves: Move[];
  name: string | null;
}

export interface Game {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;

  // Players
  blackPlayer: string;
  whitePlayer: string;

  // Board
  boardSize: BoardSize;
  komi: number;
  handicap: number;

  // Moves & variants
  rootMoves: Move[];
  variants: Variant[];

  // SGF metadata
  event: string | null;
  date: string | null;
  result: string | null;
  comment: string | null;

  // Evaluations cache
  evaluations: Evaluation[];
}

export interface Evaluation {
  id: string;
  gameId: string;
  moveId: string;
  timestamp: Date;

  winrate: {
    black: number;
    white: number;
  };
  scoreLeadPV: number;

  topMoves: EvaluatedMove[];
  confidence: number;
}

export interface EvaluatedMove {
  move: Position;
  visits: number;
  winrate: number;
  lcb: number;
  prior: number;
}

export interface BoardState {
  board: ('B' | 'W' | null)[][];
  moveCount: number;
  lastMove: Position | null;
}
