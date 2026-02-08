/**
 * Service métier pour la gestion des parties de Go
 * Logique de validation, calcul d'état plateau, gestion des coups
 * @module services/GameService
 */

import { v4 as uuidv4 } from 'uuid';
import type { Game, Move, Position, Color, BoardState } from '@/types/game';

/**
 * Service métier pour les parties de Go
 * Gère : création, validation, état plateau, historique
 */
export class GameService {
  /**
   * Crée un nouveau jeu vide (plateau vierge)
   *
   * @param title - Titre de la partie
   * @param blackPlayer - Nom du joueur Noir
   * @param whitePlayer - Nom du joueur Blanc
   * @param komi - Avantage Blanc (défaut 6.5)
   * @returns Nouveau jeu initialisé
   *
   * @example
   * const game = GameService.createGame('Demo', 'Alice', 'Bob');
   */
  static createGame(
    title: string,
    blackPlayer: string,
    whitePlayer: string,
    komi: number = 6.5
  ): Game {
    return {
      id: uuidv4(),
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      blackPlayer,
      whitePlayer,
      boardSize: 19,
      komi,
      handicap: 0,
      rootMoves: [],
      variants: [],
      event: null,
      date: null,
      result: null,
      comment: null,
      evaluations: [],
    };
  }

  /**
   * Calcule l'état du plateau à un index de coup donné
   * Applique tous les coups de 0 à moveIndex
   *
   * @param game - Jeu dont extraire l'état
   * @param moveIndex - Index du coup (0-based), -1 pour plateau vide
   * @returns État du plateau avec pierres et métadonnées
   *
   * @example
   * const state = GameService.getBoardState(game, 5);
   * // { board: [...], moveCount: 6, lastMove: {...} }
   */
  static getBoardState(game: Game, moveIndex: number): BoardState {
    // Initialiser plateau vide (19×19)
    const board: (Color | null)[][] = Array(19)
      .fill(null)
      .map(() => Array(19).fill(null));

    // Appliquer coups jusqu'à l'index
    const moves = game.rootMoves.slice(0, moveIndex + 1);

    moves.forEach((move) => {
      board[move.x][move.y] = move.color;
    });

    return {
      board,
      moveCount: moves.length,
      lastMove: moves.length > 0 ? moves[moves.length - 1] : null,
    };
  }

  /**
   * Valide si un coup est légal
   * Checks :
   *  - Limites plateau (0-18)
   *  - Intersection vide
   *  - (MVP) Pas de ko ou suicide
   *
   * @param game - Jeu actuel
   * @param position - Position à valider
   * @returns true si coup valide, false sinon
   *
   * @example
   * if (GameService.isValidMove(game, { x: 3, y: 3 })) {
   *   // Coup valide, peut être joué
   * }
   */
  static isValidMove(game: Game, position: Position): boolean {
    // Check limites plateau
    if (position.x < 0 || position.x > 18 || position.y < 0 || position.y > 18) {
      return false;
    }

    // Check intersection vide
    const boardState = this.getBoardState(game, game.rootMoves.length - 1);

    if (boardState.board[position.x][position.y] !== null) {
      return false;
    }

    // MVP v1.0 : Skip validation ko/suicide (Phase 2B)
    // TODO: Implémenter validation ko et suicide en Phase 2B

    return true;
  }

  /**
   * Ajoute un coup au jeu
   * Alterne automatiquement les couleurs
   *
   * @param game - Jeu actuel
   * @param position - Position du coup
   * @returns Nouveau jeu avec coup ajouté
   *
   * @example
   * const newGame = GameService.addMove(game, { x: 3, y: 3 });
   */
  static addMove(game: Game, position: Position): Game {
    const nextColor = this.getNextColor(game);
    const moveNumber = game.rootMoves.length + 1;

    const move: Move = {
      id: uuidv4(),
      moveNumber,
      color: nextColor,
      x: position.x,
      y: position.y,
      comment: null,
      symbols: null,
      variants: [],
      parentMoveId: null,
      createdAt: new Date(),
    };

    return {
      ...game,
      rootMoves: [...game.rootMoves, move],
      updatedAt: new Date(),
    };
  }

  /**
   * Supprime le dernier coup
   *
   * @param game - Jeu actuel
   * @returns Jeu avec dernier coup supprimé
   *
   * @example
   * const undoGame = GameService.undoMove(game);
   * // game.rootMoves.length - 1
   */
  static undoMove(game: Game): Game {
    if (game.rootMoves.length === 0) {
      return game;
    }

    return {
      ...game,
      rootMoves: game.rootMoves.slice(0, -1),
      updatedAt: new Date(),
    };
  }

  /**
   * Retourne la prochaine couleur à jouer
   * Noir commence (rootMoves.length pair)
   *
   * @param game - Jeu actuel
   * @returns 'B' (Noir) ou 'W' (Blanc)
   *
   * @example
   * GameService.getNextColor(game); // 'B' ou 'W'
   */
  static getNextColor(game: Game): Color {
    return game.rootMoves.length % 2 === 0 ? 'B' : 'W';
  }

  /**
   * Vérifie si une intersection est occupée
   *
   * @param boardState - État du plateau
   * @param position - Position à vérifier
   * @returns true si occupée (pierre noire ou blanche)
   *
   * @example
   * const occupied = GameService.isOccupied(state, { x: 3, y: 3 });
   */
  static isOccupied(boardState: BoardState, position: Position): boolean {
    return boardState.board[position.x][position.y] !== null;
  }

  /**
   * Compte les pierres d'une couleur sur le plateau
   *
   * @param boardState - État du plateau
   * @param color - Couleur à compter ('B' ou 'W')
   * @returns Nombre de pierres
   *
   * @example
   * const blackStones = GameService.countStones(state, 'B');
   */
  static countStones(boardState: BoardState, color: Color): number {
    let count = 0;

    boardState.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell === color) {
          count++;
        }
      });
    });

    return count;
  }

  /**
   * Calcule un hash de l'état du plateau
   * Utile pour détection ko ou comparaison d'états
   *
   * @param boardState - État du plateau
   * @returns String hash (format compact)
   *
   * @example
   * const hash = GameService.getBoardHash(state);
   */
  static getBoardHash(boardState: BoardState): string {
    return boardState.board
      .flat()
      .map((cell: 'B' | 'W' | null) => cell ?? '.')
      .join('');
  }
}
