/**
 * Types TypeScript pour KataGo Analysis
 * @module types/katago
 */

import type { Position, Color } from './game';

/**
 * Configuration de l'analyse KataGo
 */
export interface KataGoConfig {
  /** Nombre de visites pour l'analyse (20 = rapide, 400 = pro) */
  visits: number;
  
  /** Temps maximum d'analyse en secondes */
  maxTime: number;
  
  /** Nombre de threads (1 pour WASM) */
  threads: number;
  
  /** Rapport pendant la recherche */
  reportDuringSearch: boolean;
  
  /** Nombre de meilleurs coups à retourner */
  topMoves: number;
  
  /** Température pour la sélection (1.0 = standard) */
  temperature: number;
}

/**
 * Profil d'analyse prédéfini
 * Permet de choisir le niveau de profondeur de l'analyse
 */
export type AnalysisProfileId = 'fast' | 'standard' | 'pro';

export interface AnalysisProfile {
  /** Identifiant unique du profil */
  id: AnalysisProfileId;
  
  /** Clé i18n pour le nom du profil */
  labelKey: string;
  
  /** Clé i18n pour la description du profil */
  descriptionKey: string;
  
  /** Icône emoji pour affichage rapide */
  icon: string;
  
  /** Configuration KataGo associée */
  config: Partial<KataGoConfig>;
}

/**
 * Profils d'analyse prédéfinis
 */
export const ANALYSIS_PROFILES: Record<AnalysisProfileId, AnalysisProfile> = {
  fast: {
    id: 'fast',
    labelKey: 'analysis:profileFast',
    descriptionKey: 'analysis:profileFastDesc',
    icon: '⚡',
    config: {
      visits: 20,
      maxTime: 3,
      topMoves: 3,
    },
  },
  standard: {
    id: 'standard',
    labelKey: 'analysis:profileStandard',
    descriptionKey: 'analysis:profileStandardDesc',
    icon: '🔍',
    config: {
      visits: 100,
      maxTime: 10,
      topMoves: 5,
    },
  },
  pro: {
    id: 'pro',
    labelKey: 'analysis:profilePro',
    descriptionKey: 'analysis:profileProDesc',
    icon: '🧠',
    config: {
      visits: 400,
      maxTime: 30,
      topMoves: 10,
    },
  },
};

/**
 * Configuration par défaut MVP
 */
export const DEFAULT_KATAGO_CONFIG: KataGoConfig = {
  visits: 20,
  maxTime: 5,
  threads: 1,
  reportDuringSearch: false,
  topMoves: 5,
  temperature: 1.0,
};

/**
 * Information sur un coup évalué par KataGo
 */
export interface KataGoMoveInfo {
  /** Position du coup en notation grille */
  move: Position;
  
  /** Coordonnées SGF (ex: "D4", "Q16") */
  moveSGF: string;
  
  /** Nombre de visites pour ce coup */
  visits: number;
  
  /** Taux de victoire (0.0-1.0) pour le joueur actuel */
  winrate: number;
  
  /** Écart de score estimé (positif = avantage joueur actuel) */
  scoreLead: number;
  
  /** Probabilité a priori du réseau de neurones (0.0-1.0) */
  prior: number;
  
  /** Lower Confidence Bound (borne inférieure de confiance) */
  lcb: number;
  
  /** Utilité du coup (combine winrate et score) */
  utility: number;
}

/**
 * Résultat complet d'une analyse KataGo
 */
export interface KataGoAnalysisResult {
  /** ID unique de l'analyse */
  id: string;
  
  /** Timestamp de l'analyse */
  timestamp: Date;
  
  /** Information racine de la position */
  rootInfo: {
    /** Joueur actuel (à qui de jouer) */
    currentPlayer: Color;
    
    /** Taux de victoire pour Noir (0.0-1.0) */
    winrate: number;
    
    /** Écart de score (positif = Noir gagne, négatif = Blanc gagne) */
    scoreLead: number;
    
    /** Nombre total de visites */
    visits: number;
    
    /** Utilité de la position */
    utility: number;
  };
  
  /** Liste des meilleurs coups avec leurs évaluations */
  moveInfos: KataGoMoveInfo[];
  
  /** 
   * Distribution de probabilité du réseau de neurones (policy network)
   * Tableau 19x19 avec probabilités pour chaque intersection (0.0-1.0)
   * Utilisé pour visualisation heatmap et analyse de l'intuition du réseau
   */
  policy: number[][];
  
  /** Niveau de confiance global (0.0-1.0) */
  confidence: number;
  
  /** Temps d'analyse en millisecondes */
  analysisTime: number;
}

/**
 * État du plateau pour analyse KataGo
 */
export interface BoardState {
  /** Taille du plateau (19 pour standard) */
  size: number;
  
  /** État de chaque intersection (null = vide, 'B' = noir, 'W' = blanc) */
  stones: Array<Array<Color | null>>;
  
  /** Joueur à qui de jouer */
  currentPlayer: Color;
  
  /** Komi (compensation points pour Blanc) */
  komi: number;
  
  /** Historique des coups (pour détection Ko) */
  moveHistory: Position[];
}

/**
 * Message pour communication Web Worker
 */
export interface KataGoWorkerMessage {
  type: 'analyze' | 'result' | 'error' | 'init' | 'terminate';
  payload?: {
    boardState?: BoardState;
    config?: KataGoConfig;
    result?: KataGoAnalysisResult;
    error?: string;
  };
}

/**
 * Options pour l'analyse
 */
export interface AnalysisOptions {
  /** Utiliser le cache si disponible */
  useCache?: boolean;
  
  /** Configuration KataGo personnalisée */
  config?: Partial<KataGoConfig>;
  
  /** Forcer une nouvelle analyse même si cache existe */
  forceRefresh?: boolean;
}

/**
 * Statut d'une analyse
 */
export type AnalysisStatus = 'idle' | 'loading' | 'analyzing' | 'complete' | 'error';

/**
 * Erreur KataGo
 */
export interface KataGoError {
  code: 'TIMEOUT' | 'WASM_CRASH' | 'INVALID_POSITION' | 'WORKER_ERROR' | 'UNKNOWN';
  message: string;
  details?: any;
}
