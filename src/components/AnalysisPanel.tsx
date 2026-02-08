/**
 * Composant AnalysisPanel - Panneau d'analyse KataGo
 * Affiche les résultats d'analyse IA pour une position
 * @component
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { setEvaluation } from '@/store/slices/evaluationsSlice';
import KataGoService from '@/services/KataGoService';
import type { KataGoAnalysisResult, AnalysisStatus, AnalysisProfileId } from '@/types/katago';
import { ANALYSIS_PROFILES } from '@/types/katago';
import './AnalysisPanel.css';

export interface AnalysisPanelProps {
  /** Classe CSS supplémentaire */
  className?: string;
  /** Callback quand une analyse est terminée */
  onAnalysisComplete?: (result: KataGoAnalysisResult) => void;
}

/**
 * Panneau d'analyse IA avec KataGo
 * 
 * Features:
 * - Bouton "Analyser" pour lancer l'analyse
 * - Affichage winrate Noir/Blanc avec barres
 * - Liste top 5 coups recommandés
 * - Loading state avec spinner
 * - Gestion erreurs
 * - Badge "Ancienne" si analyse > 7 jours
 * 
 * @component
 * @example
 * <AnalysisPanel />
 */
export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ className = '', onAnalysisComplete }) => {
  const { t } = useTranslation(['common', 'analysis']);
  const dispatch = useDispatch();

  const game = useSelector((state: RootState) => state.game.current);
  const currentMoveIndex = useSelector((state: RootState) => state.game.currentMoveIndex);

  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<KataGoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AnalysisProfileId>('standard');

  /**
   * Lancer l'analyse de la position courante
   */
  const handleAnalyze = async () => {
    if (!game) {
      setError(t('analysis:noGame'));
      return;
    }

    setStatus('analyzing');
    setError(null);

    try {
      const profile = ANALYSIS_PROFILES[selectedProfile];
      const analysisResult = await KataGoService.analyzePosition(
        game,
        currentMoveIndex,
        { useCache: true, config: profile.config }
      );

      setResult(analysisResult);
      setStatus('complete');

      // Notifier le parent (pour heatmap, etc.)
      onAnalysisComplete?.(analysisResult);

      // Sauvegarder dans Redux store
      dispatch(setEvaluation({
        id: analysisResult.id,
        gameId: game.id,
        moveId: game.rootMoves[currentMoveIndex]?.id || '',
        timestamp: analysisResult.timestamp,
        winrate: {
          black: analysisResult.rootInfo.winrate,
          white: 1 - analysisResult.rootInfo.winrate,
        },
        scoreLeadPV: analysisResult.rootInfo.scoreLead,
        topMoves: analysisResult.moveInfos.map((m) => ({
          move: m.move,
          visits: m.visits,
          winrate: m.winrate,
          lcb: m.lcb,
          prior: m.prior,
        })),
        confidence: analysisResult.confidence,
      }));

      console.log('[AnalysisPanel] ✅ Analyse terminée', analysisResult);
    } catch (err: any) {
      console.error('[AnalysisPanel] ❌ Erreur analyse:', err);
      setError(err.message || t('analysis:error'));
      setStatus('error');
    }
  };

  /**
   * Vérifier si l'analyse est ancienne (> 7 jours)
   */
  const isOldAnalysis = (): boolean => {
    if (!result) return false;
    const age = Date.now() - result.timestamp.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return age > sevenDays;
  };

  /**
   * Formater pourcentage
   */
  const formatPercent = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  /**
   * Formater score
   */
  const formatScore = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return sign + value.toFixed(1);
  };

  // Pas de jeu → afficher placeholder
  if (!game) {
    return (
      <div className={`analysis-panel ${className}`}>
        <div className="analysis-empty">
          {t('analysis:noGame')}
        </div>
      </div>
    );
  }

  return (
    <div className={`analysis-panel ${className}`}>
      <div className="analysis-header">
        <h3>{t('analysis:title')}</h3>
        {result && isOldAnalysis() && (
          <span className="badge badge-old">{t('analysis:old')}</span>
        )}
      </div>

      {/* Sélecteur de profil d'analyse */}
      <div className="analysis-profile-selector">
        <label className="profile-label">{t('analysis:profile')}</label>
        <div className="profile-buttons">
          {(Object.keys(ANALYSIS_PROFILES) as AnalysisProfileId[]).map((profileId) => {
            const profile = ANALYSIS_PROFILES[profileId];
            return (
              <button
                key={profileId}
                className={`btn-profile ${selectedProfile === profileId ? 'active' : ''}`}
                onClick={() => setSelectedProfile(profileId)}
                title={t(profile.descriptionKey)}
                aria-pressed={selectedProfile === profileId}
              >
                <span className="profile-icon">{profile.icon}</span>
                <span className="profile-name">{t(profile.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton Analyser */}
      {status === 'idle' || status === 'complete' ? (
        <button
          className="btn btn-primary btn-analyze"
          onClick={handleAnalyze}
          disabled={!game || game.rootMoves.length === 0}
        >
          {status === 'complete' ? t('analysis:reanalyze') : t('analysis:analyze')}
        </button>
      ) : null}

      {/* Loading state */}
      {status === 'analyzing' && (
        <div className="analysis-loading">
          <div className="spinner" />
          <p>{t('analysis:analyzing')}</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && error && (
        <div className="analysis-error">
          <p className="error-message">❌ {error}</p>
          <button className="btn btn-secondary btn-sm" onClick={handleAnalyze}>
            {t('common:retry')}
          </button>
        </div>
      )}

      {/* Résultats d'analyse */}
      {status === 'complete' && result && (
        <div className="analysis-results">
          {/* Winrate */}
          <div className="winrate-section">
            <h4>{t('analysis:winrate')}</h4>
            
            <div className="winrate-item">
              <div className="winrate-label">
                <span className="color-indicator black">⚫</span>
                <span>{t('analysis:black')}</span>
              </div>
              <div className="winrate-bar-container">
                <div
                  className="winrate-bar winrate-bar-black"
                  style={{ width: formatPercent(result.rootInfo.winrate) }}
                />
              </div>
              <span className="winrate-value">{formatPercent(result.rootInfo.winrate)}</span>
            </div>

            <div className="winrate-item">
              <div className="winrate-label">
                <span className="color-indicator white">⚪</span>
                <span>{t('analysis:white')}</span>
              </div>
              <div className="winrate-bar-container">
                <div
                  className="winrate-bar winrate-bar-white"
                  style={{ width: formatPercent(1 - result.rootInfo.winrate) }}
                />
              </div>
              <span className="winrate-value">{formatPercent(1 - result.rootInfo.winrate)}</span>
            </div>
          </div>

          {/* Score estimé */}
          <div className="score-section">
            <h4>{t('analysis:scoreEstimate')}</h4>
            <p className="score-value">
              {result.rootInfo.scoreLead > 0 ? t('analysis:blackLeads') : t('analysis:whiteLeads')}
              {' '}
              <strong>{formatScore(Math.abs(result.rootInfo.scoreLead))} {t('analysis:points')}</strong>
            </p>
          </div>

          {/* Territoire estimé (dérivé du score et de la policy) */}
          <div className="territory-section">
            <h4>{t('analysis:territory')}</h4>
            <div className="territory-bars">
              <div className="territory-item">
                <div className="territory-label">
                  <span className="color-indicator black">⚫</span>
                  <span>{t('analysis:territoryBlack')}</span>
                </div>
                <div className="territory-bar-container">
                  <div
                    className="territory-bar territory-bar-black"
                    style={{ width: `${Math.max(5, Math.min(95, 50 + result.rootInfo.scoreLead * 1.5))}%` }}
                  />
                </div>
              </div>
              <div className="territory-item">
                <div className="territory-label">
                  <span className="color-indicator white">⚪</span>
                  <span>{t('analysis:territoryWhite')}</span>
                </div>
                <div className="territory-bar-container">
                  <div
                    className="territory-bar territory-bar-white"
                    style={{ width: `${Math.max(5, Math.min(95, 50 - result.rootInfo.scoreLead * 1.5))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top moves */}
          <div className="topmoves-section">
            <h4>{t('analysis:topMoves')}</h4>
            <div className="topmoves-list">
              {result.moveInfos.map((moveInfo, idx) => (
                <div
                  key={`${moveInfo.move.x}-${moveInfo.move.y}`}
                  className="topmove-item"
                >
                  <span className="topmove-rank">#{idx + 1}</span>
                  <span className="topmove-coords">{moveInfo.moveSGF}</span>
                  <div className="topmove-stats">
                    <span className="topmove-winrate">
                      {formatPercent(moveInfo.winrate)}
                    </span>
                    <span className="topmove-visits">
                      {moveInfo.visits} {t('analysis:visits')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="analysis-meta">
            <span className="meta-item">
              {ANALYSIS_PROFILES[selectedProfile].icon} {t(ANALYSIS_PROFILES[selectedProfile].labelKey)}
            </span>
            <span className="meta-item">
              ⏱️ {result.analysisTime}ms
            </span>
            <span className="meta-item">
              🎯 {formatPercent(result.confidence)} {t('analysis:confidence')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
