import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { setCurrentMoveIndex } from '@store/slices/gameSlice';
import type { Game } from '@/types/game';
import Board from './Board';
import AnalysisPanel from './AnalysisPanel';
import { SGFService } from '@services/SGFService';
import StorageService from '@services/StorageService';
import type { KataGoAnalysisResult } from '@/types/katago';
import type { HeatmapMode } from '@/utils/canvasUtils';
import './GameEditor.css';

interface GameEditorProps {
  onBack: () => void;
}

const GameEditor: React.FC<GameEditorProps> = ({ onBack }) => {
  const { t } = useTranslation(['common', 'game']);
  const dispatch = useDispatch();
  const currentGame = useSelector((state: RootState) => state.game.current);
  const currentMoveIndex = useSelector((state: RootState) => state.game.currentMoveIndex);

  // État heatmap
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none');
  const [analysisResult, setAnalysisResult] = useState<KataGoAnalysisResult | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save debounced : sauvegarde IndexedDB à chaque modification de la partie
  // CA-11 : Debounce 500ms (attendre 500ms sans nouveau coup avant sauvegarde)
  useEffect(() => {
    if (!currentGame) return;

    // Ne pas sauvegarder au premier rendu (la partie vient d'être chargée)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    StorageService.saveGameDebounced(currentGame, 500);
  }, [currentGame]);

  /** Export la partie courante en SGF et déclenche le téléchargement */
  const handleExportSGF = useCallback(() => {
    if (!currentGame) return;

    const sgf = SGFService.serialize(currentGame);
    const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentGame.title.replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_')}.sgf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentGame]);

  /** Navigation des coups */
  const handleNavigateFirst = () => dispatch(setCurrentMoveIndex(0));
  const handleNavigatePrev = () => {
    if (currentMoveIndex > 0) dispatch(setCurrentMoveIndex(currentMoveIndex - 1));
  };
  const handleNavigateNext = () => {
    if (currentGame && currentMoveIndex < currentGame.rootMoves.length)
      dispatch(setCurrentMoveIndex(currentMoveIndex + 1));
  };
  const handleNavigateLast = () => {
    if (currentGame) dispatch(setCurrentMoveIndex(currentGame.rootMoves.length));
  };
  const handleMoveClick = (idx: number) => dispatch(setCurrentMoveIndex(idx + 1));

  if (!currentGame) {
    return <div>{t('common:loading')}</div>;
  }

  return (
    <div className="game-editor">
      <div className="editor-header">
        <button className="btn-back" onClick={onBack} aria-label={t('common:back')}>
          ← {t('common:back')}
        </button>
        <h2>{currentGame.title}</h2>
        <div className="editor-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExportSGF}
            aria-label={t('common:exportSGF')}
          >
            📤 {t('common:exportSGF')}
          </button>
          <button className="btn btn-secondary">{t('common:save')}</button>
        </div>
      </div>

      <div className="editor-main">
        <div className="board-section">
          <Board
            policy={analysisResult?.policy ?? null}
            ownership={analysisResult?.ownership ?? null}
            heatmapMode={heatmapMode}
          />

          {/* Toggle heatmap modes */}
          {analysisResult && (
            <div className="heatmap-toggle">
              <div className="heatmap-buttons">
                <button
                  className={`heatmap-btn${heatmapMode === 'none' ? ' active' : ''}`}
                  onClick={() => setHeatmapMode('none')}
                >
                  🎯 {t('common:close')}
                </button>
                <button
                  className={`heatmap-btn${heatmapMode === 'policy' ? ' active' : ''}`}
                  onClick={() => setHeatmapMode('policy')}
                >
                  🔥 {t('analysis:heatmap')}
                </button>
                <button
                  className={`heatmap-btn${heatmapMode === 'ownership' ? ' active' : ''}`}
                  onClick={() => setHeatmapMode('ownership')}
                >
                  🗺️ {t('analysis:territory')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="sidebar-section">
            <h3>{t('game:moves')}</h3>

            {/* Navigation controls */}
            <div className="nav-controls">
              <button
                className="nav-btn"
                onClick={handleNavigateFirst}
                disabled={currentMoveIndex <= 0}
                aria-label={t('game:previousMove')}
                title="⏮ Début"
              >
                ⏮
              </button>
              <button
                className="nav-btn"
                onClick={handleNavigatePrev}
                disabled={currentMoveIndex <= 0}
                aria-label={t('game:previousMove')}
                title="◀ Précédent"
              >
                ◀
              </button>
              <span className="nav-info">
                {currentMoveIndex} / {currentGame.rootMoves.length}
              </span>
              <button
                className="nav-btn"
                onClick={handleNavigateNext}
                disabled={currentMoveIndex >= currentGame.rootMoves.length}
                aria-label={t('game:nextMove')}
                title="▶ Suivant"
              >
                ▶
              </button>
              <button
                className="nav-btn"
                onClick={handleNavigateLast}
                disabled={currentMoveIndex >= currentGame.rootMoves.length}
                aria-label={t('game:nextMove')}
                title="⏭ Fin"
              >
                ⏭
              </button>
            </div>

            <div className="moves-list">
              {currentGame.rootMoves.length === 0 ? (
                <p className="empty">{t('game:noGamesFound')}</p>
              ) : (
                currentGame.rootMoves.map((move, idx) => (
                  <div
                    key={move.id}
                    className={`move-item${idx + 1 === currentMoveIndex ? ' active' : ''}${idx + 1 > currentMoveIndex ? ' future' : ''}`}
                    onClick={() => handleMoveClick(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleMoveClick(idx); }}
                  >
                    <span className={`move-color ${move.color === 'B' ? 'black' : 'white'}`}>●</span>
                    {t('game:moveNumber', { number: move.moveNumber })}
                    {move.comment && <span className="move-comment-icon" title={move.comment}>💬</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          <AnalysisPanel 
            onAnalysisComplete={setAnalysisResult}
            onMoveSelected={(move) => {
              // Quand un coup proposé est cliqué, l'ajouter au plateau
              // GameEditor gère le dispatch via setAnalysisResult callback
              console.log('[GameEditor] Coup proposé cliqué:', move);
              // Note: addMove sera appelé via AnalysisPanel directement
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GameEditor;
