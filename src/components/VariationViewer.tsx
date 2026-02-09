/**
 * Composant VariationViewer
 * Affiche et permet de naviguer dans une ligne de jeu (PV) estimée par KataGo
 * @module components/VariationViewer
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalysisVariation } from '@/types/katago';
import type { Position } from '@/types/game';
import './VariationViewer.css';

export interface VariationViewerProps {
  /** Variation à afficher */
  variation: AnalysisVariation;
  
  /** Callback quand l'utilisateur ferme le viewer */
  onClose: () => void;
  
  /** Callback optionnel quand l'utilisateur clique sur un coup du PV */
  onMoveClick?: (moveIndex: number, position: Position) => void;
  
  /** Fonction pour convertir Position en notation SGF (ex: 'd3') */
  positionToSGF?: (pos: Position) => string;
}

/**
 * Composant de visualisation d'une variation (PV)
 * Affiche une ligne de jeu estimée avec navigation et statistiques
 */
export const VariationViewer: React.FC<VariationViewerProps> = ({
  variation,
  onClose,
  onMoveClick,
  positionToSGF,
}) => {
  const { t } = useTranslation('analysis');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Valider la variation
  const isValid = useMemo(() => {
    return (
      variation &&
      variation.pv &&
      variation.pv.length > 0 &&
      variation.pvWinrates &&
      variation.pvWinrates.length >= variation.pv.length
    );
  }, [variation]);
  
  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!isValid) return null;
    
    const avgWinrate =
      variation.pvWinrates.reduce((a: number, b: number) => a + b, 0) / variation.pvWinrates.length;
    
    const maxWinrate = Math.max(...variation.pvWinrates);
    const minWinrate = Math.min(...variation.pvWinrates);
    
    return {
      totalMoves: variation.pv.length,
      avgWinrate: (avgWinrate * 100).toFixed(1),
      maxWinrate: (maxWinrate * 100).toFixed(1),
      minWinrate: (minWinrate * 100).toFixed(1),
    };
  }, [isValid, variation]);
  
  // Gestionnaires
  const handlePrev = () => {
    setCurrentIndex((prev: number) => Math.max(0, prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev: number) => Math.min(variation.pv.length - 1, prev + 1));
  };
  
  const handleMoveClick = (index: number) => {
    setCurrentIndex(index);
    onMoveClick?.(index, variation.pv[index]);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };
  
  if (!isValid) {
    return (
      <div className="variation-viewer variation-error" role="alert">
        <div className="variation-error-message">
          {t('analysis:variationInvalid')}
        </div>
        <button
          className="btn-close"
          onClick={onClose}
          aria-label={t('common:close')}
        >
          ✕
        </button>
      </div>
    );
  }
  
  const currentWinrate = variation.pvWinrates[currentIndex];
  const currentScore = variation.pvScores ? variation.pvScores[currentIndex] : undefined;
  
  return (
    <div
      className="variation-viewer"
      role="region"
      aria-label={t('analysis:variationViewer')}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header avec bouton fermer */}
      <div className="variation-header">
        <h3 className="variation-title">
          {t('analysis:variationTitle')}
        </h3>
        <button
          className="btn-close"
          onClick={onClose}
          aria-label={t('common:close')}
          title={t('common:close')}
        >
          ✕
        </button>
      </div>
      
      {/* Statistiques */}
      {stats && (
        <div className="variation-stats">
          <div className="stat-item">
            <span className="stat-label">{t('analysis:totalMoves')}</span>
            <span className="stat-value">{stats.totalMoves}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('analysis:avgWinrate')}</span>
            <span className="stat-value">{stats.avgWinrate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('analysis:maxWinrate')}</span>
            <span className="stat-value">{stats.maxWinrate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('analysis:minWinrate')}</span>
            <span className="stat-value">{stats.minWinrate}%</span>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="variation-controls">
        <button
          className="btn-nav btn-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label={t('analysis:prevMove')}
          title={`${t('analysis:prevMove')} (←)`}
        >
          ← {t('analysis:prev')}
        </button>
        
        <div className="variation-position">
          <span className="position-label">
            {currentIndex + 1} / {variation.pv.length}
          </span>
          <span className="position-winrate">
            {(currentWinrate * 100).toFixed(1)}%
          </span>
          {currentScore !== undefined && (
            <span className="position-score">
              {currentScore > 0 ? '+' : ''}{currentScore.toFixed(1)}
            </span>
          )}
        </div>
        
        <button
          className="btn-nav btn-next"
          onClick={handleNext}
          disabled={currentIndex === variation.pv.length - 1}
          aria-label={t('analysis:nextMove')}
          title={`${t('analysis:nextMove')} (→)`}
        >
          {t('analysis:next')} →
        </button>
      </div>
      
      {/* Liste des coups */}
      <div className="variation-moves" role="listbox">
        {variation.pv.map((move: Position, index: number) => {
          const isSelected = index === currentIndex;
          const moveNum = index + 1;
          const isBlackMove = moveNum % 2 === 1;
          const winrate = variation.pvWinrates[index];
          const score = variation.pvScores ? variation.pvScores[index] : undefined;
          
          return (
            <button
              key={`move-${index}`}
              className={`variation-move ${isSelected ? 'selected' : ''}`}
              onClick={() => handleMoveClick(index)}
              role="option"
              aria-selected={isSelected}
              aria-label={`${t(`common:${isBlackMove ? 'black' : 'white'}`)} ${moveNum}: ${(winrate * 100).toFixed(1)}%`}
              tabIndex={isSelected ? 0 : -1}
            >
              <span className={`move-color ${isBlackMove ? 'black' : 'white'}`}>
                {moveNum}
              </span>
              <span className="move-coords">
                {positionToSGF ? positionToSGF(move) : `(${move.x},${move.y})`}
              </span>
              <span className="move-winrate">
                {(winrate * 100).toFixed(1)}%
              </span>
              {score !== undefined && (
                <span className="move-score">
                  {score > 0 ? '+' : ''}{score.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Aide clavier */}
      <div className="variation-help">
        <small>
          {t('analysis:variationKeyboardHelp')}
        </small>
      </div>
    </div>
  );
};

export default VariationViewer;
