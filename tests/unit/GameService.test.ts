/**
 * Tests unitaires pour GameService
 * Logique métier : création, validation, état plateau, coups
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '@/services/GameService';
import type { Game, Position } from '@/types/game';

describe('GameService', () => {
  let game: Game;

  beforeEach(() => {
    game = GameService.createGame('Test Game', 'Alice', 'Bob');
  });

  describe('createGame', () => {
    it('should create a game with correct initial state', () => {
      expect(game.title).toBe('Test Game');
      expect(game.blackPlayer).toBe('Alice');
      expect(game.whitePlayer).toBe('Bob');
      expect(game.boardSize).toBe(19);
      expect(game.komi).toBe(6.5);
      expect(game.handicap).toBe(0);
      expect(game.rootMoves).toEqual([]);
      expect(game.variants).toEqual([]);
      expect(game.evaluations).toEqual([]);
    });

    it('should assign unique ID to each game', () => {
      const game1 = GameService.createGame('Game 1', 'A', 'B');
      const game2 = GameService.createGame('Game 2', 'C', 'D');

      expect(game1.id).not.toBe(game2.id);
    });

    it('should set timestamps', () => {
      const before = new Date();
      const testGame = GameService.createGame('Test', 'A', 'B');
      const after = new Date();

      expect(testGame.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(testGame.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(testGame.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should allow custom komi', () => {
      const customGame = GameService.createGame('Test', 'A', 'B', 7.5);
      expect(customGame.komi).toBe(7.5);
    });
  });

  describe('getBoardState', () => {
    it('should return empty board for new game (moveIndex -1)', () => {
      const state = GameService.getBoardState(game, -1);

      expect(state.moveCount).toBe(0);
      expect(state.lastMove).toBeNull();
      expect(state.board.length).toBe(19);
      expect(state.board[0].length).toBe(19);

      // Check all cells are empty
      state.board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBeNull();
        });
      });
    });

    it('should return board with stones up to moveIndex', () => {
      game = GameService.addMove(game, { x: 3, y: 3 }); // Black at (3,3)
      game = GameService.addMove(game, { x: 15, y: 15 }); // White at (15,15)
      game = GameService.addMove(game, { x: 10, y: 10 }); // Black at (10,10)

      const state = GameService.getBoardState(game, 1); // Up to move 2 (index 1)

      expect(state.moveCount).toBe(2);
      expect(state.board[3][3]).toBe('B');
      expect(state.board[15][15]).toBe('W');
      expect(state.board[10][10]).toBeNull(); // Not played yet at this index
    });

    it('should apply all moves when moveIndex exceeds total moves', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });

      const state = GameService.getBoardState(game, 999);

      expect(state.moveCount).toBe(2);
      expect(state.board[0][0]).toBe('B');
      expect(state.board[1][1]).toBe('W');
    });

    it('should set lastMove correctly', () => {
      game = GameService.addMove(game, { x: 5, y: 5 });
      game = GameService.addMove(game, { x: 7, y: 7 });

      const state = GameService.getBoardState(game, 1);

      expect(state.lastMove).not.toBeNull();
      expect(state.lastMove?.x).toBe(7);
      expect(state.lastMove?.y).toBe(7);

      // Vérifier la couleur du dernier coup via rootMoves
      const lastRootMove = game.rootMoves[game.rootMoves.length - 1];
      expect(lastRootMove.color).toBe('W');
    });
  });

  describe('isValidMove', () => {
    it('should reject out of bounds coordinates', () => {
      expect(GameService.isValidMove(game, { x: -1, y: 5 })).toBe(false);
      expect(GameService.isValidMove(game, { x: 5, y: -1 })).toBe(false);
      expect(GameService.isValidMove(game, { x: 19, y: 5 })).toBe(false);
      expect(GameService.isValidMove(game, { x: 5, y: 19 })).toBe(false);
      expect(GameService.isValidMove(game, { x: 100, y: 100 })).toBe(false);
    });

    it('should accept valid empty intersection', () => {
      expect(GameService.isValidMove(game, { x: 0, y: 0 })).toBe(true);
      expect(GameService.isValidMove(game, { x: 9, y: 9 })).toBe(true);
      expect(GameService.isValidMove(game, { x: 18, y: 18 })).toBe(true);
    });

    it('should reject occupied intersection', () => {
      game = GameService.addMove(game, { x: 10, y: 10 });

      expect(GameService.isValidMove(game, { x: 10, y: 10 })).toBe(false);
    });

    it('should accept move after first move', () => {
      game = GameService.addMove(game, { x: 3, y: 3 });

      // Can play elsewhere
      expect(GameService.isValidMove(game, { x: 5, y: 5 })).toBe(true);
    });

    it('should handle all 361 intersections', () => {
      // Fill entire board
      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 19; y++) {
          game = GameService.addMove(game, { x, y });

          // Current position should now be invalid
          if (x !== 18 || y !== 18) {
            expect(GameService.isValidMove(game, { x, y })).toBe(false);
          }
        }
      }

      // Board full - no valid moves
      expect(GameService.isValidMove(game, { x: 0, y: 0 })).toBe(false);
    });
  });

  describe('getNextColor', () => {
    it('should return B for first move', () => {
      expect(GameService.getNextColor(game)).toBe('B');
    });

    it('should alternate colors correctly', () => {
      expect(GameService.getNextColor(game)).toBe('B');

      game = GameService.addMove(game, { x: 0, y: 0 });
      expect(GameService.getNextColor(game)).toBe('W');

      game = GameService.addMove(game, { x: 1, y: 1 });
      expect(GameService.getNextColor(game)).toBe('B');

      game = GameService.addMove(game, { x: 2, y: 2 });
      expect(GameService.getNextColor(game)).toBe('W');
    });

    it('should alternate for many moves', () => {
      let expectedColor: 'B' | 'W' = 'B';

      for (let i = 0; i < 50; i++) {
        expect(GameService.getNextColor(game)).toBe(expectedColor);

        const pos: Position = {
          x: Math.floor(i / 19),
          y: i % 19,
        };

        game = GameService.addMove(game, pos);
        expectedColor = expectedColor === 'B' ? 'W' : 'B';
      }
    });
  });

  describe('addMove', () => {
    it('should add move with correct properties', () => {
      game = GameService.addMove(game, { x: 5, y: 10 });

      expect(game.rootMoves.length).toBe(1);
      expect(game.rootMoves[0].x).toBe(5);
      expect(game.rootMoves[0].y).toBe(10);
      expect(game.rootMoves[0].color).toBe('B');
      expect(game.rootMoves[0].moveNumber).toBe(1);
    });

    it('should increment move numbers', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });
      game = GameService.addMove(game, { x: 2, y: 2 });

      expect(game.rootMoves[0].moveNumber).toBe(1);
      expect(game.rootMoves[1].moveNumber).toBe(2);
      expect(game.rootMoves[2].moveNumber).toBe(3);
    });

    it('should not mutate original game', () => {
      const originalLength = game.rootMoves.length;
      const newGame = GameService.addMove(game, { x: 5, y: 5 });

      expect(game.rootMoves.length).toBe(originalLength);
      expect(newGame.rootMoves.length).toBe(originalLength + 1);
    });

    it('should assign unique IDs to moves', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });

      expect(game.rootMoves[0].id).not.toBe(game.rootMoves[1].id);
    });

    it('should update game.updatedAt', () => {
      const beforeTime = new Date();
      const newGame = GameService.addMove(game, { x: 5, y: 5 });
      const afterTime = new Date();

      expect(newGame.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(newGame.updatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('undoMove', () => {
    it('should remove last move', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });

      expect(game.rootMoves.length).toBe(2);

      game = GameService.undoMove(game);

      expect(game.rootMoves.length).toBe(1);
      expect(game.rootMoves[0].x).toBe(0);
    });

    it('should handle undo on empty game', () => {
      const emptyGame = GameService.createGame('Empty', 'A', 'B');
      const result = GameService.undoMove(emptyGame);

      expect(result.rootMoves.length).toBe(0);
      expect(result).toEqual(emptyGame); // Should be same reference (early return)
    });

    it('should remove all moves on repeated undo', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });
      game = GameService.addMove(game, { x: 2, y: 2 });

      expect(game.rootMoves.length).toBe(3);

      game = GameService.undoMove(game);
      expect(game.rootMoves.length).toBe(2);

      game = GameService.undoMove(game);
      expect(game.rootMoves.length).toBe(1);

      game = GameService.undoMove(game);
      expect(game.rootMoves.length).toBe(0);

      // Further undo does nothing
      game = GameService.undoMove(game);
      expect(game.rootMoves.length).toBe(0);
    });

    it('should not mutate original game', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      const originalLength = game.rootMoves.length;

      const undoGame = GameService.undoMove(game);

      expect(game.rootMoves.length).toBe(originalLength);
      expect(undoGame.rootMoves.length).toBe(originalLength - 1);
    });

    it('should update game.updatedAt', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });

      const beforeTime = new Date();
      const undoGame = GameService.undoMove(game);
      const afterTime = new Date();

      expect(undoGame.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(undoGame.updatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('isOccupied', () => {
    it('should return true for occupied cells', () => {
      game = GameService.addMove(game, { x: 5, y: 5 });
      const state = GameService.getBoardState(game, 0);

      expect(GameService.isOccupied(state, { x: 5, y: 5 })).toBe(true);
    });

    it('should return false for empty cells', () => {
      game = GameService.addMove(game, { x: 5, y: 5 });
      const state = GameService.getBoardState(game, 0);

      expect(GameService.isOccupied(state, { x: 10, y: 10 })).toBe(false);
    });

    it('should handle empty board', () => {
      const state = GameService.getBoardState(game, -1);

      for (let x = 0; x < 19; x++) {
        for (let y = 0; y < 19; y++) {
          expect(GameService.isOccupied(state, { x, y })).toBe(false);
        }
      }
    });
  });

  describe('countStones', () => {
    it('should count black stones', () => {
      game = GameService.addMove(game, { x: 0, y: 0 }); // B
      game = GameService.addMove(game, { x: 1, y: 1 }); // W
      game = GameService.addMove(game, { x: 2, y: 2 }); // B

      const state = GameService.getBoardState(game, 2);
      expect(GameService.countStones(state, 'B')).toBe(2);
    });

    it('should count white stones', () => {
      game = GameService.addMove(game, { x: 0, y: 0 }); // B
      game = GameService.addMove(game, { x: 1, y: 1 }); // W
      game = GameService.addMove(game, { x: 2, y: 2 }); // B

      const state = GameService.getBoardState(game, 2);
      expect(GameService.countStones(state, 'W')).toBe(1);
    });

    it('should return 0 for empty board', () => {
      const state = GameService.getBoardState(game, -1);

      expect(GameService.countStones(state, 'B')).toBe(0);
      expect(GameService.countStones(state, 'W')).toBe(0);
    });
  });

  describe('getBoardHash', () => {
    it('should generate consistent hash for same board', () => {
      game = GameService.addMove(game, { x: 3, y: 3 });
      game = GameService.addMove(game, { x: 15, y: 15 });

      const state = GameService.getBoardState(game, 1);
      const hash1 = GameService.getBoardHash(state);
      const hash2 = GameService.getBoardHash(state);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different boards', () => {
      game = GameService.addMove(game, { x: 3, y: 3 });
      const state1 = GameService.getBoardState(game, 0);
      const hash1 = GameService.getBoardHash(state1);

      game = GameService.addMove(game, { x: 15, y: 15 });
      const state2 = GameService.getBoardState(game, 1);
      const hash2 = GameService.getBoardHash(state2);

      expect(hash1).not.toBe(hash2);
    });

    it('should be compact for 19x19 board', () => {
      game = GameService.addMove(game, { x: 0, y: 0 });
      const state = GameService.getBoardState(game, 0);
      const hash = GameService.getBoardHash(state);

      // board.flat().join('') produit 'null' pour cases vides, puis replace → '.'
      // 1 coup B + 360 cases vides → 'B' + 360 × '.' = 361 chars
      expect(hash.length).toBe(361);
      expect(hash).toContain('B');
      expect(hash).toContain('.');
      expect(hash).not.toContain('null');
    });
  });

  /**
   * Integration tests
   */
  describe('Integration: Game flow', () => {
    it('should handle typical game sequence', () => {
      // Create game
      let testGame = GameService.createGame('Pro Game', 'Lee Sedol', 'AlphaGo');

      // Play sequence
      testGame = GameService.addMove(testGame, { x: 3, y: 3 });
      testGame = GameService.addMove(testGame, { x: 15, y: 3 });
      testGame = GameService.addMove(testGame, { x: 3, y: 15 });

      expect(testGame.rootMoves.length).toBe(3);
      expect(testGame.rootMoves[0].color).toBe('B');
      expect(testGame.rootMoves[1].color).toBe('W');
      expect(testGame.rootMoves[2].color).toBe('B');

      // Get board state
      const state = GameService.getBoardState(testGame, 2);
      expect(state.moveCount).toBe(3);
      expect(GameService.countStones(state, 'B')).toBe(2);
      expect(GameService.countStones(state, 'W')).toBe(1);

      // Undo last move
      testGame = GameService.undoMove(testGame);
      expect(testGame.rootMoves.length).toBe(2);
    });

    it('should maintain game consistency across operations', () => {
      const moves: Position[] = [
        { x: 3, y: 3 },
        { x: 15, y: 15 },
        { x: 9, y: 9 },
        { x: 3, y: 15 },
        { x: 15, y: 3 },
      ];

      for (const move of moves) {
        expect(GameService.isValidMove(game, move)).toBe(true);
        game = GameService.addMove(game, move);
      }

      // All 5 moves should be in game
      expect(game.rootMoves.length).toBe(5);

      // Colors should alternate correctly
      for (let i = 0; i < 5; i++) {
        const expectedColor = i % 2 === 0 ? 'B' : 'W';
        expect(game.rootMoves[i].color).toBe(expectedColor);
      }

      // Board state should have all stones
      const finalState = GameService.getBoardState(game, 4);
      expect(GameService.countStones(finalState, 'B')).toBe(3);
      expect(GameService.countStones(finalState, 'W')).toBe(2);
    });
  });
});
