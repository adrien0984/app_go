import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import type { Game } from '@/types/game';
import Board from './Board';
import AnalysisPanel from './AnalysisPanel';
import './GameEditor.css';

interface GameEditorProps {
  onBack: () => void;
}

const GameEditor: React.FC<GameEditorProps> = ({ onBack }) => {
  const { t } = useTranslation(['common', 'game']);
  const currentGame = useSelector((state: RootState) => state.game.current);

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
          <Board />
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

          <AnalysisPanel />
        </div>
      </div>
    </div>
  );
};

export default GameEditor;
