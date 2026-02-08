/**
 * Service KataGo - Wrapper pour analyse de position Go
 * Utilise Web Worker pour calculs non-bloquants
 * @module services/KataGoService
 */

import { v4 as uuidv4 } from 'uuid';
import type { Game, Position, Color } from '@/types/game';
import {
  type KataGoAnalysisResult,
  type KataGoConfig,
  type BoardState,
  type KataGoMoveInfo,
  type AnalysisOptions,
  type KataGoError,
  DEFAULT_KATAGO_CONFIG,
} from '@/types/katago';
import { GameService } from './GameService';

/**
 * Service singleton pour intégration KataGo
 * 
 * @example
 * const service = KataGoService.getInstance();
 * await service.initialize();
 * const result = await service.analyzePosition(boardState);
 */
export class KataGoService {
  private static instance: KataGoService | null = null;
  private worker: Worker | null = null;
  private initialized = false;
  private analysisCache: Map<string, KataGoAnalysisResult> = new Map();
  private pendingAnalyses: Map<string, {
    resolve: (result: KataGoAnalysisResult) => void;
    reject: (error: KataGoError) => void;
  }> = new Map();

  private constructor() {
    // Private constructor pour singleton
  }

  /**
   * Obtenir l'instance singleton
   */
  public static getInstance(): KataGoService {
    if (!KataGoService.instance) {
      KataGoService.instance = new KataGoService();
    }
    return KataGoService.instance;
  }

  /**
   * Initialiser le service KataGo
   * Charge le Web Worker et le WASM
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[KataGo] Déjà initialisé');
      return;
    }

    try {
      console.log('[KataGo] Initialisation...');
      
      // TODO: Charger le vrai Web Worker quand WASM disponible
      // this.worker = new Worker(new URL('../workers/katagoWorker.ts', import.meta.url), {
      //   type: 'module',
      // });
      
      // Pour MVP : simulation sans WASM
      console.log('[KataGo] Mode simulation (MVP sans WASM)');
      
      this.initialized = true;
      console.log('[KataGo] ✅ Initialisé avec succès');
    } catch (error) {
      console.error('[KataGo] ❌ Erreur initialisation:', error);
      throw {
        code: 'WORKER_ERROR',
        message: 'Échec initialisation KataGo',
        details: error,
      } as KataGoError;
    }
  }

  /**
   * Analyser une position de jeu
   * 
   * @param game - Partie à analyser
   * @param moveIndex - Index du coup à analyser (défaut: dernier coup)
   * @param options - Options d'analyse
   * @returns Résultat de l'analyse
   */
  public async analyzePosition(
    game: Game,
    moveIndex?: number,
    options: AnalysisOptions = {}
  ): Promise<KataGoAnalysisResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const actualMoveIndex = moveIndex ?? game.rootMoves.length - 1;
    const boardState = this.gameToBoardState(game, actualMoveIndex);
    const config = { ...DEFAULT_KATAGO_CONFIG, ...options.config };

    // Vérifier cache
    const cacheKey = this.getBoardStateHash(boardState);
    if (options.useCache !== false && !options.forceRefresh) {
      const cached = this.analysisCache.get(cacheKey);
      if (cached) {
        console.log('[KataGo] ✅ Résultat depuis cache');
        return cached;
      }
    }

    console.log('[KataGo] 🔍 Analyse en cours...', {
      moveIndex: actualMoveIndex,
      visits: config.visits,
    });

    const startTime = Date.now();

    try {
      // Pour MVP : simulation d'analyse
      const result = await this.simulateAnalysis(boardState, config);
      
      const analysisTime = Date.now() - startTime;
      result.analysisTime = analysisTime;

      // Mettre en cache
      this.analysisCache.set(cacheKey, result);

      console.log('[KataGo] ✅ Analyse terminée en', analysisTime, 'ms');
      return result;

    } catch (error) {
      console.error('[KataGo] ❌ Erreur analyse:', error);
      throw error;
    }
  }

  /**
   * Obtenir les meilleurs coups pour une position
   * 
   * @param game - Partie
   * @param moveIndex - Index du coup
   * @param limit - Nombre maximum de coups à retourner
   * @returns Liste des meilleurs coups
   */
  public async getTopMoves(
    game: Game,
    moveIndex?: number,
    limit = 5
  ): Promise<KataGoMoveInfo[]> {
    const result = await this.analyzePosition(game, moveIndex, {
      config: { topMoves: limit },
    });
    return result.moveInfos.slice(0, limit);
  }

  /**
   * Terminer le Web Worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    console.log('[KataGo] 🛑 Service terminé');
  }

  /**
   * Vider le cache d'analyses
   */
  public clearCache(): void {
    this.analysisCache.clear();
    console.log('[KataGo] 🗑️ Cache vidé');
  }

  /**
   * Convertir Game en BoardState pour KataGo
   */
  private gameToBoardState(game: Game, moveIndex: number): BoardState {
    const size = game.boardSize;
    const stones: Array<Array<Color | null>> = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    // Placer les coups jusqu'à moveIndex
    const moves = game.rootMoves.slice(0, moveIndex + 1);
    moves.forEach((move) => {
      stones[move.y][move.x] = move.color;
    });

    const currentPlayer = GameService.getNextColor(game);

    return {
      size,
      stones,
      currentPlayer,
      komi: game.komi,
      moveHistory: moves.map((m) => ({ x: m.x, y: m.y })),
    };
  }

  /**
   * Générer hash unique pour BoardState (pour cache)
   */
  private getBoardStateHash(boardState: BoardState): string {
    const stoneString = boardState.stones
      .map((row) => row.map((s) => s || '.').join(''))
      .join('');
    return `${stoneString}_${boardState.currentPlayer}_${boardState.komi}`;
  }

  /**
   * Simulation d'analyse KataGo (MVP sans WASM)
   * Génère des données réalistes pour tester l'UI
   */
  private async simulateAnalysis(
    boardState: BoardState,
    config: KataGoConfig
  ): Promise<KataGoAnalysisResult> {
    // Simuler délai d'analyse
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Générer résultats simulés réalistes
    const isBlackTurn = boardState.currentPlayer === 'B';
    const baseWinrate = 0.45 + Math.random() * 0.1; // 45-55%
    const blackWinrate = isBlackTurn ? baseWinrate : 1 - baseWinrate;
    
    const scoreLead = (blackWinrate - 0.5) * 20; // -10 à +10 points

    // Générer top moves
    const moveInfos: KataGoMoveInfo[] = [];
    const candidates = this.generateCandidateMoves(boardState, config.topMoves);

    candidates.forEach((pos, idx) => {
      const winrateVariation = (Math.random() - 0.5) * 0.15; // ±7.5%
      const moveWinrate = Math.max(0.1, Math.min(0.9, baseWinrate + winrateVariation));
      
      moveInfos.push({
        move: pos,
        moveSGF: this.positionToSGF(pos),
        visits: Math.floor(config.visits * (1 - idx * 0.15)),
        winrate: moveWinrate,
        scoreLead: (moveWinrate - 0.5) * 20,
        prior: Math.random() * 0.3,
        lcb: moveWinrate - 0.05,
        utility: moveWinrate + (Math.random() - 0.5) * 0.1,
      });
    });

    // Trier par winrate décroissant et limiter au topMoves
    moveInfos.sort((a, b) => b.winrate - a.winrate);
    const limitedMoveInfos = moveInfos.slice(0, config.topMoves);

    // Générer policy (distribution de probabilité sur tout le plateau)
    const policy = this.generatePolicyDistribution(boardState, limitedMoveInfos);

    return {
      id: uuidv4(),
      timestamp: new Date(),
      rootInfo: {
        currentPlayer: boardState.currentPlayer,
        winrate: blackWinrate,
        scoreLead,
        visits: config.visits,
        utility: blackWinrate,
      },
      moveInfos: limitedMoveInfos,
      policy,
      confidence: 0.7 + Math.random() * 0.2, // 70-90%
      analysisTime: 0, // Sera rempli par appelant
    };
  }

  /**
   * Générer positions candidates réalistes
   */
  private generateCandidateMoves(boardState: BoardState, count: number): Position[] {
    const candidates: Position[] = [];
    const size = boardState.size;
    
    // Zones prioritaires : coins, hoshi, extensions
    const priorityAreas = [
      { x: 3, y: 3 }, { x: 3, y: 9 }, { x: 3, y: 15 },
      { x: 9, y: 3 }, { x: 9, y: 9 }, { x: 9, y: 15 },
      { x: 15, y: 3 }, { x: 15, y: 9 }, { x: 15, y: 15 },
    ];

    // Ajouter positions valides aléatoires
    while (candidates.length < count) {
      let pos: Position;
      
      if (candidates.length < 3 && Math.random() > 0.5) {
        // Préférer zones prioritaires pour premiers coups
        pos = priorityAreas[Math.floor(Math.random() * priorityAreas.length)];
      } else {
        // Position aléatoire
        pos = {
          x: Math.floor(Math.random() * size),
          y: Math.floor(Math.random() * size),
        };
      }

      // Vérifier que l'intersection est vide
      if (boardState.stones[pos.y][pos.x] === null) {
        // Éviter doublons
        if (!candidates.some((c) => c.x === pos.x && c.y === pos.y)) {
          candidates.push(pos);
        }
      }
    }

    return candidates;
  }

  /**
   * Générer distribution de probabilité policy sur tout le plateau
   * Reflète l'intuition du réseau de neurones avant MCTS
   * 
   * @param boardState - État du plateau
   * @param topMoves - Meilleurs coups identifiés
   * @returns Matrice 19x19 de probabilités (somme = 1.0)
   */
  private generatePolicyDistribution(
    boardState: BoardState,
    topMoves: KataGoMoveInfo[]
  ): number[][] {
    const size = boardState.size;
    const policy: number[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    // Probabilité de base très faible pour intersections vides
    const baseProbability = 0.0001;
    
    // Affecter probabilités aux meilleurs coups
    let totalProbability = 0;
    topMoves.forEach((moveInfo, idx) => {
      // Décroissance exponentielle : 1er coup = prior élevé, suivants diminuent
      const prob = moveInfo.prior * Math.pow(0.6, idx);
      policy[moveInfo.move.y][moveInfo.move.x] = prob;
      totalProbability += prob;
    });

    // Ajouter bruit gaussien autour des top moves (diffusion d'influence)
    topMoves.forEach((moveInfo) => {
      const { x, y } = moveInfo.move;
      
      // Influence sur intersections adjacentes (distance 1-3)
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          // Vérifier limites plateau
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            // Vérifier intersection vide
            if (boardState.stones[ny][nx] === null) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Influence décroît avec distance (gaussienne)
              const influence = moveInfo.prior * 0.1 * Math.exp(-distance / 2);
              policy[ny][nx] += influence;
              totalProbability += influence;
            }
          }
        }
      }
    });

    // Probabilité résiduelle pour autres intersections vides
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (boardState.stones[y][x] === null && policy[y][x] === 0) {
          policy[y][x] = baseProbability;
          totalProbability += baseProbability;
        }
      }
    }

    // Normaliser pour que somme = 1.0
    if (totalProbability > 0) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          policy[y][x] /= totalProbability;
        }
      }
    }

    return policy;
  }

  /**
   * Convertir Position en notation SGF
   */
  private positionToSGF(pos: Position): string {
    const x = String.fromCharCode(65 + pos.x); // A, B, C...
    const y = (19 - pos.y).toString(); // 19, 18, 17...
    return `${x}${y}`;
  }
}

// Export instance singleton
export default KataGoService.getInstance();
