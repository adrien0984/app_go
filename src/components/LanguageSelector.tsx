import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '@store/slices/settingsSlice';
import type { RootState } from '@store/index';
import type { Language } from '@/types/i18n';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const language = useSelector((state: RootState) => state.settings.language);

  const handleChangeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
  };

  return (
    <div className="language-selector" role="group" aria-label="Language selection">
      {(['fr', 'en'] as const).map(lang => (
        <button
          key={lang}
          className={`lang-btn ${language === lang ? 'active' : ''}`}
          onClick={() => handleChangeLanguage(lang)}
          aria-pressed={language === lang}
          aria-label={`Switch to ${lang.toUpperCase()}`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
