/**
 * Composant pour afficher l'historique des analyses KataGo
 * @component
 */

import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/store';
import { selectGameHistory, deleteHistoryEntry } from '@/store/slices/analysisHistorySlice';
import type { AnalysisHistoryEntry } from '@/types/katago';
import './AnalysisHistory.css';

export interface AnalysisHistoryProps {
  gameId?: string;
  onEntrySelected?: (entry: AnalysisHistoryEntry) => void;
  className?: string;
}

/**
 * Affiche l'historique des analyses pour une partie
 * @component
 */
export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  gameId,
  onEntrySelected,
  className = '',
}) => {
  const { t } = useTranslation(['common', 'analysis']);
  const dispatch = useDispatch();

  // Récupérer l'historique de la partie
  const history = useSelector((state: RootState) =>
    gameId ? selectGameHistory(state.analysisHistory, gameId) : []
  );

  // Calculer statistiques
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const profiles = history.map((e: AnalysisHistoryEntry) => e.profile);
    const profileCounts = profiles.reduce(
      (acc: Record<string, number>, p: string) => ({
        ...acc,
        [p]: (acc[p] ?? 0) + 1,
      }),
      {} as Record<string, number>
    );

    const avgWinrate = history.reduce((sum: number, e: AnalysisHistoryEntry) => sum + e.result.rootInfo.winrate, 0) / history.length;
    const avgScore = history.reduce((sum: number, e: AnalysisHistoryEntry) => sum + e.result.rootInfo.scoreLead, 0) / history.length;
    const avgTime = history.reduce((sum: number, e: AnalysisHistoryEntry) => sum + e.analysisTime, 0) / history.length;
    const mostUsedProfile = (
      Object.entries(profileCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0] || []
    )[0];

    return {
      totalAnalyses: history.length,
      mostUsedProfile,
      avgWinrate,
      avgScore,
      avgAnalysisTime: Math.round(avgTime),
    };
  }, [history]);

  const handleDeleteEntry = (entryId: string) => {
    if (gameId && confirm(t('common:delete') + '?')) {
      dispatch(deleteHistoryEntry({ gameId, entryId }));
    }
  };

  if (!gameId || history.length === 0) {
    return (
      <div className={`analysis-history ${className}`}>
        <div className="history-empty">
          {t('analysis:noHistory')}
        </div>
      </div>
    );
  }

  return (
    <div className={`analysis-history ${className}`}>
      <div className="history-header">
        <h4>{t('analysis:history')}</h4>
        <span className="history-count">{history.length}</span>
      </div>

      {/* Statistiques résumées */}
      {stats && (
        <div className="history-stats">
          <div className="stat-item">
            <span className="stat-label">{t('analysis:totalAnalyses')}</span>
            <span className="stat-value">{stats.totalAnalyses}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{t('analysis:avgWinrate')}</span>
            <span className="stat-value">
              {(stats.avgWinrate * 100).toFixed(0)}%
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{t('analysis:avgScore')}</span>
            <span className="stat-value">
              {stats.avgScore > 0 ? '+' : ''}{stats.avgScore.toFixed(1)}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">{t('analysis:avgTime')}</span>
            <span className="stat-value">{stats.avgAnalysisTime}ms</span>
          </div>
        </div>
      )}

      {/* Liste des analyses */}
      <div className="history-list">
        {history.map((entry: AnalysisHistoryEntry, index: number) => {
          const isOld = Date.now() - new Date(entry.timestamp).getTime() > 7 * 24 * 60 * 60 * 1000;

          return (
            <div
              key={entry.id}
              className={`history-entry ${index === 0 ? 'latest' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onEntrySelected?.(entry)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEntrySelected?.(entry);
                }
              }}
            >
              <div className="entry-header">
                <span className="entry-move">{entry.moveNotation}</span>
                <span className="entry-profile">{entry.profile}</span>
                {isOld && <span className="badge badge-old">{t('analysis:old')}</span>}
              </div>

              <div className="entry-results">
                <span className="entry-winrate">
                  {(entry.result.rootInfo.winrate * 100).toFixed(0)}%
                </span>
                <span className="entry-score">
                  {entry.result.rootInfo.scoreLead > 0 ? '+' : ''}
                  {entry.result.rootInfo.scoreLead.toFixed(1)}
                </span>
              </div>

              <div className="entry-footer">
                <span className="entry-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(entry.id);
                  }}
                  title={t('common:delete')}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisHistory;
