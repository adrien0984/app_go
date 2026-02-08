import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import type { Game } from '@/types/game';
import Board from './Board';
import AnalysisPanel from './AnalysisPanel';
import type { KataGoAnalysisResult } from '@/types/katago';
import './GameEditor.css';

interface GameEditorProps {
  onBack: () => void;
}

const GameEditor: React.FC<GameEditorProps> = ({ onBack }) => {
  const { t } = useTranslation(['common', 'game']);
  const currentGame = useSelector((state: RootState) => state.game.current);

  // État heatmap policy
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<KataGoAnalysisResult | null>(null);

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
          <button className="btn btn-secondary">{t('common:save')}</button>
        </div>
      </div>

      <div className="editor-main">
        <div className="board-section">
          <Board
            policy={analysisResult?.policy ?? null}
            showHeatmap={showHeatmap}
          />

          {/* Toggle heatmap */}
          {analysisResult && (
            <div className="heatmap-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  aria-label={t('analysis:heatmap')}
                />
                <span className="toggle-text">🔥 {t('analysis:heatmap', 'Heatmap Policy')}</span>
              </label>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="sidebar-section">
            <h3>{t('game:moves')}</h3>
            <div className="moves-list">
              {currentGame.rootMoves.length === 0 ? (
                <p className="empty">{t('game:noGamesFound')}</p>
              ) : (
                currentGame.rootMoves.map((move, idx) => (
                  <div key={move.id} className="move-item">
                    {t('game:moveNumber', { number: move.moveNumber })} - {move.color}
                  </div>
                ))
              )}
            </div>
          </div>

          <AnalysisPanel onAnalysisComplete={setAnalysisResult} />
        </div>
      </div>
    </div>
  );
};

export default GameEditor;
