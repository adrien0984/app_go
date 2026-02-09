/**
 * Panneau de comparaison de positions analysées
 * @module components/ComparisonPanel
 */

import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { ComparisonRecord, ComparisonResult, AnalysisHistoryEntry } from '@/types/katago';
import type { RootState } from '@store/index';
import {
  createComparisonRecord,
  createComparisonRecordFromEvaluation,
  createMissingRecord,
  calculateComparisonStats,
  formatComparisonRecord,
  downloadComparisonCSV,
  generateComparisonCSV,
} from '@utils/comparisonUtils';

import './ComparisonPanel.css';

export interface ComparisonPanelProps {
  /** ID de la partie comparée */
  gameId: string;

  /** Index des coups à comparer */
  selectedMoveIndexes: number[];

  /** Callback à la fermeture */
  onClose: () => void;

  /** Optionnel: Notation des coups (pour affichage) */
  moveNotations?: Record<number, string>;
}

/**
 * ComparisonPanel: Affiche un tableau côte-à-côte des analyses
 */
export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  gameId,
  selectedMoveIndexes,
  onClose,
  moveNotations = {},
}) => {
  const { t } = useTranslation('common');

  // Récupère les évaluations depuis Redux
  const evaluations = useSelector((state: RootState) => state.evaluations?.results || {});

  // Récupère l'historique depuis Redux pour enrichir les données
  const analysisHistoryByGameId = useSelector(
    (state: RootState) => state.analysisHistory?.byGameId || {},
  );

  // Tri des index sélectionnés
  const sortedIndexes = useMemo(
    () => [...selectedMoveIndexes].sort((a, b) => a - b),
    [selectedMoveIndexes],
  );

  const comparisonRecords = useMemo((): ComparisonRecord[] => {
    return sortedIndexes.map(moveIndex => {
      const notation = moveNotations[moveIndex] || `Move ${moveIndex + 1}`;
      const analysisKey = `${gameId}-${moveIndex}`;
      const analysis = evaluations[analysisKey];

      if (analysis) {
        // Utilise Evaluation depuis Redux
        return createComparisonRecordFromEvaluation(moveIndex, notation, analysis);
      }

      // Cherche dans l'historique
      const histEntries = analysisHistoryByGameId[gameId] || [];
      const histEntry = histEntries.find(
        (e: AnalysisHistoryEntry) => e.moveIndex === moveIndex && e.result,
      );
      if (histEntry) {
        return createComparisonRecord(
          moveIndex,
          notation,
          histEntry.result,
          histEntry.profile,
          histEntry.analysisTime,
        );
      }
      return createMissingRecord(moveIndex, notation);
    });
  }, [sortedIndexes, evaluations, analysisHistoryByGameId, gameId, moveNotations]);

  // Calcule les statistiques
  const comparisonResult = useMemo((): ComparisonResult => {
    const stats = calculateComparisonStats(comparisonRecords);
    return {
      gameId,
      records: comparisonRecords,
      generatedAt: new Date(),
      ...stats,
    };
  }, [comparisonRecords, gameId]);

  // Formatte les records pour l'affichage
  const formattedRecords = useMemo(
    () => comparisonRecords.map(formatComparisonRecord),
    [comparisonRecords],
  );

  // Handlers
  const handleExportCSV = useCallback(() => {
    downloadComparisonCSV(comparisonResult, gameId);
  }, [comparisonResult, gameId]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const csv = generateComparisonCSV(comparisonResult);
      await navigator.clipboard.writeText(csv);
      alert(t('comparison.copiedToClipboard', 'Tableau copié dans le clipboard'));
    } catch (err) {
      console.error('Copy error:', err);
      alert(t('comparison.copyError', 'Erreur lors de la copie'));
    }
  }, [comparisonResult, t]);

  if (comparisonRecords.length === 0) {
    return (
      <div className="comparison-panel comparison-empty">
        <div className="comparison-header">
          <h2>{t('comparison.title', 'Comparer positions')}</h2>
          <button className="comparison-close" onClick={onClose} aria-label={t('common.close', 'Fermer')}>
            ✕
          </button>
        </div>
        <div className="comparison-message">
          {t('comparison.noSelection', 'Aucun coup sélectionné')}
        </div>
      </div>
    );
  }

  return (
    <div className="comparison-panel">
      {/* En-tête */}
      <div className="comparison-header">
        <h2>{t('comparison.title', 'Comparer positions')}</h2>
        <div className="comparison-controls">
          <button
            className="comparison-btn comparison-btn-secondary"
            onClick={handleCopyToClipboard}
            title={t('comparison.copyTooltip', 'Copier tableau')}
          >
            📋 {t('comparison.copy', 'Copier')}
          </button>
          <button
            className="comparison-btn comparison-btn-primary"
            onClick={handleExportCSV}
            title={t('comparison.exportTooltip', 'Exporter en CSV')}
          >
            📥 {t('comparison.export', 'Exporter')}
          </button>
          <button
            className="comparison-close"
            onClick={onClose}
            aria-label={t('common.close', 'Fermer')}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="comparison-stats">
        <div className="comparison-stat">
          <div className="stat-label">{t('comparison.totalAnalyzed', 'Analysés')}</div>
          <div className="stat-value">{comparisonResult.totalAnalyzed}</div>
        </div>
        <div className="comparison-stat">
          <div className="stat-label">{t('comparison.totalMissing', 'Manquants')}</div>
          <div className="stat-value">{comparisonResult.totalMissing}</div>
        </div>
        <div className="comparison-stat">
          <div className="stat-label">{t('comparison.avgBlackWinrate', 'Noir Avg')}</div>
          <div className="stat-value">
            {(comparisonResult.avgBlackWinrate * 100).toFixed(0)}%
          </div>
        </div>
        <div className="comparison-stat">
          <div className="stat-label">{t('comparison.avgWhiteWinrate', 'Blanc Avg')}</div>
          <div className="stat-value">
            {(comparisonResult.avgWhiteWinrate * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Tableau de comparaison */}
      <div className="comparison-table-container">
        <table className="comparison-table" role="table">
          <thead>
            <tr>
              <th role="columnheader">{t('comparison.move', 'Coup')}</th>
              <th role="columnheader">{t('comparison.blackWr', 'Noir WR')}</th>
              <th role="columnheader">{t('comparison.whiteWr', 'Blanc WR')}</th>
              <th role="columnheader">{t('comparison.score', 'Score')}</th>
              <th role="columnheader">{t('comparison.bestMove', 'Meilleur Coup')}</th>
              <th role="columnheader">{t('comparison.status', 'Status')}</th>
            </tr>
          </thead>
          <tbody>
            {formattedRecords.map(record => (
              <tr key={record.moveIndex} className={`comparison-row-${record.status}`}>
                <td className="comparison-cell-move">{record.moveNotation}</td>
                <td className="comparison-cell-number">{record.blackWinrate}</td>
                <td className="comparison-cell-number">{record.whiteWinrate}</td>
                <td className="comparison-cell-number">{record.scoreEstimate}</td>
                <td className="comparison-cell-move">{record.bestMove}</td>
                <td className="comparison-cell-status">
                  {record.status === 'cached' ? (
                    <>
                      <span className="status-badge status-cached">
                        {t('comparison.cached', 'Cache')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="status-badge status-missing">
                        {t('comparison.missing', 'Manquant')}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graphique simplifié de tendance de winrate */}
      <div className="comparison-chart">
        <h3>{t('comparison.trendTitle', 'Tendance du Winrate')}</h3>
        <svg
          className="comparison-chart-svg"
          viewBox="0 0 600 200"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t('comparison.trendChart', 'Graphique de tendance')}
        >
          {/* Grille */}
          <line x1="50" y1="20" x2="50" y2="170" stroke="#ccc" strokeWidth="1" />
          <line x1="50" y1="170" x2="580" y2="170" stroke="#ccc" strokeWidth="1" />

          {/* Axes labels */}
          <text x="20" y="100" textAnchor="end" fontSize="12" fill="#666">
            100%
          </text>
          <text x="20" y="180" textAnchor="end" fontSize="12" fill="#666">
            0%
          </text>

          {/* Points Noir (bleu) */}
          {formattedRecords
            .filter(r => r.status === 'cached')
            .map((record, idx) => {
              const x = 50 + ((idx + 1) / (formattedRecords.length + 1)) * 530;
              const blackWr = parseFloat(record.blackWinrate) / 100;
              const y = 170 - blackWr * 150;
              return (
                <g key={`black-${idx}`}>
                  <circle cx={x} cy={y} r="3" fill="#3b82f6" />
                  <title>{record.moveNotation}: {record.blackWinrate}</title>
                </g>
              );
            })}

          {/* Points Blanc (vert) */}
          {formattedRecords
            .filter(r => r.status === 'cached')
            .map((record, idx) => {
              const x = 50 + ((idx + 1) / (formattedRecords.length + 1)) * 530;
              const whiteWr = parseFloat(record.whiteWinrate) / 100;
              const y = 170 - whiteWr * 150;
              return (
                <g key={`white-${idx}`}>
                  <circle cx={x} cy={y} r="3" fill="#10b981" />
                  <title>{record.moveNotation}: {record.whiteWinrate}</title>
                </g>
              );
            })}

          {/* Légende */}
          <circle cx="60" cy="200" r="2.5" fill="#3b82f6" />
          <text x="70" y="203" fontSize="11" fill="#333">
            {t('comparison.blackPlayer', 'Noir')}
          </text>

          <circle cx="150" cy="200" r="2.5" fill="#10b981" />
          <text x="160" y="203" fontSize="11" fill="#333">
            {t('comparison.whitePlayer', 'Blanc')}
          </text>
        </svg>
      </div>

      {/* Pied de page */}
      <div className="comparison-footer">
        <p>
          {t('comparison.info', 'Tableau comparant {{count}} positions', {
            count: comparisonRecords.length,
          })}
        </p>
      </div>
    </div>
  );
};

export default ComparisonPanel;
