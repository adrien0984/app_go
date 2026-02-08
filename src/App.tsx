import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import GameEditor from '@components/GameEditor';
import GameMenu from '@components/GameMenu';
import LanguageSelector from '@components/LanguageSelector';
import { setCurrentGame } from '@store/slices/gameSlice';
import { RootState } from '@store/index';
import './App.css';

function App() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentGame = useSelector((state: RootState) => state.game.current);
  const [view, setView] = useState<'menu' | 'editor'>('menu');

  useEffect(() => {
    if (currentGame) {
      setView('editor');
    }
  }, [currentGame]);

  const handleNewGame = () => {
    setView('menu');
    dispatch(setCurrentGame(null));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('common:appTitle')}</h1>
        <LanguageSelector />
      </header>
      <main className="app-main">
        {view === 'menu' && currentGame === null ? (
          <GameMenu onGameSelected={() => setView('editor')} />
        ) : (
          <GameEditor onBack={handleNewGame} />
        )}
      </main>
    </div>
  );
}

export default App;
