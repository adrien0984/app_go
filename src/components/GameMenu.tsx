import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { setCurrentGame, addGameToList } from '@store/slices/gameSlice';
import type { Game } from '@/types/game';
import StorageService from '@services/StorageService';
import './GameMenu.css';

interface GameMenuProps {
  onGameSelected: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onGameSelected }) => {
  const { t } = useTranslation(['common', 'game']);
  const dispatch = useDispatch();
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Partie',
    blackPlayer: 'Noir',
    whitePlayer: 'Blanc',
    komi: 6.5,
  });

  React.useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const games = await StorageService.listGames();
    setGamesList(games);
  };

  const handleCreateGame = async () => {
    const newGame: Game = {
      id: uuidv4(),
      title: formData.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      blackPlayer: formData.blackPlayer,
      whitePlayer: formData.whitePlayer,
      boardSize: 19,
      komi: formData.komi,
      handicap: 0,
      rootMoves: [],
      variants: [],
      event: null,
      date: new Date().toISOString().split('T')[0],
      result: null,
      comment: null,
      evaluations: [],
    };

    await StorageService.saveGame(newGame);
    dispatch(setCurrentGame(newGame));
    dispatch(addGameToList(newGame));
    setShowNewGameForm(false);
    onGameSelected();
  };

  const handleLoadGame = (game: Game) => {
    dispatch(setCurrentGame(game));
    onGameSelected();
  };

  const handleDeleteGame = async (gameId: string) => {
    if (confirm(t('common:delete') + '?')) {
      await StorageService.deleteGame(gameId);
      setGamesList(gamesList.filter(g => g.id !== gameId));
    }
  };

  return (
    <div className="game-menu">
      <div className="menu-content">
        <div className="menu-header">
          <h2>{t('game:myGames')}</h2>
        </div>

        {!showNewGameForm ? (
          <>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewGameForm(true)}
              aria-label={t('common:newGame')}
            >
              + {t('common:newGame')}
            </button>

            <div className="games-list">
              {gamesList.length === 0 ? (
                <p className="no-games">{t('game:noGamesFound')}</p>
              ) : (
                gamesList.map(game => (
                  <div key={game.id} className="game-card">
                    <div className="game-info">
                      <h3>{game.title}</h3>
                      <p>
                        {game.blackPlayer} vs {game.whitePlayer}
                      </p>
                      <small>{new Date(game.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div className="game-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleLoadGame(game)}
                      >
                        {t('common:back')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteGame(game.id)}
                      >
                        {t('common:delete')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <form className="new-game-form" onSubmit={e => {
            e.preventDefault();
            handleCreateGame();
          }}>
            <div className="form-group">
              <label htmlFor="title">{t('game:title')}</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la partie"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="blackPlayer">{t('game:blackPlayer')}</label>
              <input
                id="blackPlayer"
                type="text"
                value={formData.blackPlayer}
                onChange={e => setFormData({ ...formData, blackPlayer: e.target.value })}
                placeholder="Noir"
              />
            </div>

            <div className="form-group">
              <label htmlFor="whitePlayer">{t('game:whitePlayer')}</label>
              <input
                id="whitePlayer"
                type="text"
                value={formData.whitePlayer}
                onChange={e => setFormData({ ...formData, whitePlayer: e.target.value })}
                placeholder="Blanc"
              />
            </div>

            <div className="form-group">
              <label htmlFor="komi">{t('game:komi')}</label>
              <input
                id="komi"
                type="number"
                step="0.5"
                value={formData.komi}
                onChange={e => setFormData({ ...formData, komi: parseFloat(e.target.value) })}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('common:save')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNewGameForm(false)}
              >
                {t('common:cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GameMenu;
