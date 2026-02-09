/**
 * Utilitaires pour les fonctionnalités de comparaison d'analyses
 * @module utils/comparisonUtils
 */

import type {
  ComparisonRecord,
  ComparisonResult,
  KataGoAnalysisResult,
  AnalysisProfileId,
  AnalysisHistoryEntry,
} from '@/types/katago';
import type { Evaluation, Position } from '@/types/game';

/**
 * Convertit une Position en notation SGF (ex: {x: 3, y: 3} → "D4")
 */
export function positionToNotation(pos: Position): string {
  const col = String.fromCharCode(97 + (pos.x || 0)); // a-s
  const row = String(19 - (pos.y || 0)); // 19-1
  return `${col.toUpperCase()}${row}`;
}

/**
 * Génère un enregistrement de comparaison à partir d'une analyse KataGo
 */
export function createComparisonRecord(
  moveIndex: number,
  moveNotation: string,
  analysis: KataGoAnalysisResult,
  profile?: AnalysisProfileId,
  analysisTime?: number,
): ComparisonRecord {
  const blackWr = analysis.rootInfo?.winrate ?? 0;
  let bestMoveName = 'N/A';
  if (analysis.moveInfos?.[0]?.move) {
    try {
      bestMoveName = positionToNotation(analysis.moveInfos[0].move);
    } catch {
      bestMoveName = 'N/A';
    }
  }

  return {
    moveIndex,
    moveNotation,
    blackWinrate: blackWr,
    whiteWinrate: 1 - blackWr,
    scoreEstimate: analysis.rootInfo?.scoreLead ?? 0,
    bestMove: bestMoveName,
    analyzed: true,
    profile,
    analysisTime,
    timestamp: new Date(),
  };
}

/**
 * Génère un enregistrement de comparaison à partir d'une Evaluation (Redux)
 */
export function createComparisonRecordFromEvaluation(
  moveIndex: number,
  moveNotation: string,
  evaluation: Evaluation,
): ComparisonRecord {
  const topMove = evaluation.topMoves?.[0]?.move
    ? positionToNotation(evaluation.topMoves[0].move)
    : 'N/A';

  return {
    moveIndex,
    moveNotation,
    blackWinrate: evaluation.winrate?.black ?? 0,
    whiteWinrate: evaluation.winrate?.white ?? 0,
    scoreEstimate: evaluation.scoreLeadPV ?? 0,
    bestMove: topMove,
    analyzed: true,
    timestamp: evaluation.timestamp,
  };
}

/**
 * Crée un enregistrement "non analysé" pour un coup manquant
 */
export function createMissingRecord(
  moveIndex: number,
  moveNotation: string,
): ComparisonRecord {
  return {
    moveIndex,
    moveNotation,
    blackWinrate: 0,
    whiteWinrate: 0,
    scoreEstimate: 0,
    bestMove: 'N/A',
    analyzed: false,
  };
}

/**
 * Calcule les statistiques de comparaison
 */
export function calculateComparisonStats(records: ComparisonRecord[]): Omit<
  ComparisonResult,
  'gameId' | 'records' | 'generatedAt'
> {
  const analyzedRecords = records.filter(r => r.analyzed);

  if (analyzedRecords.length === 0) {
    return {
      totalAnalyzed: 0,
      totalMissing: records.length,
      avgBlackWinrate: 0,
      avgWhiteWinrate: 0,
      avgScore: 0,
      stdDevScore: 0,
    };
  }

  const avgBlackWinrate =
    analyzedRecords.reduce((sum, r) => sum + r.blackWinrate, 0) /
    analyzedRecords.length;

  const avgWhiteWinrate =
    analyzedRecords.reduce((sum, r) => sum + r.whiteWinrate, 0) /
    analyzedRecords.length;

  const avgScore =
    analyzedRecords.reduce((sum, r) => sum + r.scoreEstimate, 0) /
    analyzedRecords.length;

  // Variance et écart type
  const variance =
    analyzedRecords.reduce((sum, r) => sum + Math.pow(r.scoreEstimate - avgScore, 2), 0) /
    analyzedRecords.length;
  const stdDevScore = Math.sqrt(variance);

  return {
    totalAnalyzed: analyzedRecords.length,
    totalMissing: records.filter(r => !r.analyzed).length,
    avgBlackWinrate,
    avgWhiteWinrate,
    avgScore,
    stdDevScore,
  };
}

/**
 * Formate un pourcentage pour affichage (ex: 0.45 → "45%")
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formate un score estimé pour affichage (ex: 2.5 → "N+2.5")
 */
export function formatScore(value: number): string {
  if (value === 0) return '±0.0';
  const player = value > 0 ? 'N' : 'B';
  return `${player}+${Math.abs(value).toFixed(1)}`;
}

/**
 * Génère une ligne CSV à partir d'un enregistrement de comparaison
 */
export function recordToCSV(record: ComparisonRecord): string {
  const moveStr = record.moveNotation;
  const blackWRStr = formatPercentage(record.blackWinrate);
  const whiteWRStr = formatPercentage(record.whiteWinrate);
  const scoreStr = record.analyzed ? formatScore(record.scoreEstimate) : 'N/A';
  const bestMoveStr = record.bestMove;

  return `${moveStr},${blackWRStr},${whiteWRStr},${scoreStr},${bestMoveStr}`;
}

/**
 * Génère un CSV complet pour l'export
 */
export function generateComparisonCSV(result: ComparisonResult): string {
  const lines: string[] = [];

  // En-têtes
  lines.push('Coup,Noir Winrate,Blanc Winrate,Score,Meilleur Coup');

  // Données
  result.records.forEach(record => {
    lines.push(recordToCSV(record));
  });

  // Statistiques
  lines.push('');
  lines.push('Statistiques');
  lines.push(`Total Analysé,${result.totalAnalyzed}`);
  lines.push(`Total Manquant,${result.totalMissing}`);
  lines.push(`Winrate Noir Moyen,${formatPercentage(result.avgBlackWinrate)}`);
  lines.push(`Winrate Blanc Moyen,${formatPercentage(result.avgWhiteWinrate)}`);
  lines.push(`Score Moyen,${formatScore(result.avgScore)}`);
  lines.push(`Écart Type Score,${result.stdDevScore.toFixed(2)}`);

  return lines.join('\n');
}

/**
 * Exporte les données en CSV et déclenche le téléchargement
 */
export function downloadComparisonCSV(result: ComparisonResult, gameId: string): void {
  const csv = generateComparisonCSV(result);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `comparison_${gameId}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copie les données de comparaison en tableau dans le clipboard
 */
export async function copyComparisonToClipboard(result: ComparisonResult): Promise<void> {
  const csv = generateComparisonCSV(result);

  try {
    await navigator.clipboard.writeText(csv);
  } catch (err) {
    console.error('Erreur copie clipboard:', err);
    throw new Error('Impossible de copier dans le clipboard');
  }
}

/**
 * Convertit un enregistrement de comparaison en objet d'affichage formaté
 */
export interface FormattedComparisonRecord {
  moveIndex: number;
  moveNotation: string;
  blackWinrate: string;
  whiteWinrate: string;
  scoreEstimate: string;
  bestMove: string;
  status: 'cached' | 'missing';
}

export function formatComparisonRecord(
  record: ComparisonRecord,
): FormattedComparisonRecord {
  return {
    moveIndex: record.moveIndex,
    moveNotation: record.moveNotation,
    blackWinrate: formatPercentage(record.blackWinrate, 1),
    whiteWinrate: formatPercentage(record.whiteWinrate, 1),
    scoreEstimate: record.analyzed ? formatScore(record.scoreEstimate) : 'N/A',
    bestMove: record.bestMove,
    status: record.analyzed ? 'cached' : 'missing',
  };
}

/**
 * Calcule les coefficients pour l'interpolation SVG Path
 * Utilisé pour dessiner les graphes de tendance
 */
export function interpolateSpline(points: [number, number][]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0][0]} ${points[0][1]}`;

  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];

    // Calcul du contrôle point pour courbe lisse
    const xc = (x1 + x2) / 2;
    const yc = (y1 + y2) / 2;

    path += ` Q ${xc} ${yc} ${x2} ${y2}`;
  }

  return path;
}

/**
 * Normalise une valeur entre 0 et 1 pour l'affichage sur un axe Y
 */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Récupère la plage de winrates (min/max) pour un ensemble d'enregistrements
 */
export function getWinrateRange(records: ComparisonRecord[]): [number, number] {
  if (records.length === 0) return [0, 1];

  const winrates = records
    .filter(r => r.analyzed)
    .flatMap(r => [r.blackWinrate, r.whiteWinrate]);

  if (winrates.length === 0) return [0, 1];

  const min = Math.min(...winrates);
  const max = Math.max(...winrates);

  // Ajoute un padding de 5%
  const padding = (max - min) * 0.05 || 0.05;

  return [Math.max(0, min - padding), Math.min(1, max + padding)];
}

/**
 * Récupère la plage de scores pour l'affichage
 */
export function getScoreRange(records: ComparisonRecord[]): [number, number] {
  if (records.length === 0) return [-5, 5];

  const scores = records.filter(r => r.analyzed).map(r => r.scoreEstimate);

  if (scores.length === 0) return [-5, 5];

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // Ajoute un padding
  const padding = Math.max(1, (max - min) * 0.1);

  return [min - padding, max + padding];
}
