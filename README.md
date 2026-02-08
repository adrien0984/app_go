# GoAI Editor - MVP v1.0

Application Progressive Web App (PWA) interactive pour créer, éditer et analyser des parties de Go avec une IA locale (KataGo).

## 🎯 Objectifs MVP

- ✅ Créer et éditer des parties (SGF) via un plateau interactif 19×19
- ✅ Importer/exporter des fichiers SGF
- ✅ Analyser des positions avec KataGo (% victoire, meilleurs coups)
- ✅ Reconnaître un plateau à partir d'une photo (OCR offline)
- ✅ Fonctionne 100% offline avec IndexedDB
- ✅ Interface responsive (desktop + mobile)
- ✅ Langues : FR (priorité) + EN

## 📦 Installation

```bash
# Cloner le repo
git clone <repo-url>
cd go-ai-editor

# Installer dépendances
npm install

# Dev server
npm run dev

# Build
npm run build

# Tests
npm test
npm run test:e2e
```

## 🏗️ Architecture

### Stack Technologique

- **Frontend** : React 18 + TypeScript + Vite
- **State** : Redux Toolkit
- **i18n** : i18next + react-i18next (FR/EN)
- **Stockage** : IndexedDB (parties, analyses)
- **Cache** : Service Worker + Cache API
- **IA** : KataGo.js (WASM local)
- **OCR** : TensorFlow.js (local, offline)

### Structure Dossiers

```
src/
├── components/          # Composants React (Board, GameEditor, etc.)
├── services/            # Services métier (GameService, SGFParser, etc.)
├── store/               # Redux slices (game, ui, settings, evaluations)
├── types/               # TypeScript types (game.ts, sgf.ts, ocr.ts)
├── utils/               # Utilitaires (boardUtils, i18nConfig, etc.)
├── hooks/               # Custom React hooks
├── locales/             # Traductions (fr.json, en.json)
├── workers/             # Web Workers (KataGo, OCR async)
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles

public/
├── manifest.json        # PWA manifest
├── sw.ts                # Service Worker
└── icons/               # App icons (192x192, 512x512, maskable)
```

## 🚀 Démarrage Rapide

### 1. Créer une Nouvelle Partie

```
Menu → "Nouvelle Partie"
  ├─ Saisir titre
  ├─ Entrer noms joueurs
  └─ Créer → Ouvre éditeur
```

### 2. Éditer une Partie

- **Cliquer plateau** : ajouter coup
- **Panneau droite** : variantes, commentaires, analyses
- **Menu** : exporter SGF

### 3. Analyser une Position

```
Éditeur → Bouton "Analyser"
  ├─ KataGo compute (~1-3s)
  └─ Affiche % victoire N/B, top 5 coups
```

### 4. OCR Photo → Partie

```
Menu → "OCR Photo"
  ├─ Capturer image plateau
  ├─ TensorFlow détect stones
  └─ Importe position automatiquement
```

## 📚 Documentation

Pour une documentation complète, consultez le dossier [docs/](./docs/) :

- **[Guide de Démarrage Rapide](./docs/guides/QUICK-START.md)** - Setup en 5 minutes
- **[Architecture](./docs/architecture/ARCHITECTURE.md)** - Vue d'ensemble technique
- **[Spécifications](./docs/specifications/)** - SF et ST complètes
- **[User Stories](./docs/user-stories/)** - Stories détaillées
- **[Rapports QA](./docs/qa-reports/)** - Validation et tests
- **[Index Complet](./docs/INDEX.md)** - Hub de navigation

### 📖 Fichiers Utiles

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Guide de navigation de la doc
- **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)** - Structure complète du projet
- **[CHANGELOG.md](./CHANGELOG.md)** - Historique des changements
- **[BUGS.md](./BUGS.md)** - Tracker de bugs (0 critiques, 3 mineurs)

### Guides Essentiels

- [Comment exécuter les tests E2E](./docs/guides/HOW-TO-RUN-E2E-TESTS.md)
- [Rapport de démarrage](./docs/guides/RAPPORT-DEMARRAGE.md)
- [Validation Checklist](./docs/validation/VALIDATION-CHECKLIST.md)

## 🏗️ Structure du Projet

Voir [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) pour l'arborescence complète et détaillée.

## 🧪 Tests

```bash
# Unit tests (Vitest)
npm test

# Tests avec UI
npm run test:ui

# E2E tests (Playwright)
npm run test:e2e
```

Tests prioritaires v1.0 :
- ✅ Créer/charger/sauvegarder partie
- ✅ SGF import/export
- ✅ Offline mode (DevTools → offline)
- ✅ Responsive (mobile viewport)
- ✅ OCR reconnaissance (>70% confiance)

## 📱 PWA & Offline

L'app est **100% offline-first** :

- **Service Worker** : cache assets (JS, CSS, images)
- **IndexedDB** : sauvegarde parties localement
- **WASM models** : KataGo, TensorFlow pré-cachés
- **Pas d'appels réseau** : zéro dépendance

Tester offline :
```
Chrome DevTools → Network → Offline
  → App reste fonctionnelle ✅
```

## 🌍 Langues

Traductions gérées via i18next :

- **FR** : src/locales/fr.json (prioritaire)
- **EN** : src/locales/en.json
- **Sélecteur** : HeaderLanguageSelector (top-right)
- **Auto-détection** : navigator.language fallback to 'fr'

Ajouter traduction :
```typescript
// src/locales/fr.json
{
  "newKey": "Valeur française"
}

// Dans composant
const { t } = useTranslation();
<div>{t('common:newKey')}</div>
```

## 📊 Performance

| Métrique | Target | Notes |
|---|---|---|
| **Bundle** | < 2 MB (gzipped) | React + Redux + utils |
| **First Paint** | < 2s | Vite optimisé |
| **OCR** | < 10s | TensorFlow CPU |
| **KataGo** | < 3s | 20 visits par défaut |
| **Offline** | 100% | IndexedDB + Service Worker |

## 🔄 Roadmap

### v1.0 (Feb 2026) ✅
- ✨ Créer/éditer SGF
- ✨ OCR photos
- ✨ KataGo analyse
- ✨ Offline + PWA

### v1.1 (Mars 2026)
- 🎮 Règles Go (légalité, captures)
- 🎨 Thèmes (clair/sombre)
- 🐛 OCR amélioré

### v2.0 (Q1 2027)
- 🔄 Sync cloud (Google Drive)
- 👥 Multiplayer local
- 🎯 Jeu vs IA

## 🛠️ Développement

### Setup Env

```bash
# Node 18+
node --version  # v18+

# Install deps
npm install

# Start dev server
npm run dev

# Build & preview
npm run build && npm run preview
```

### Commandes Utiles

```bash
# Format code (Prettier)
npm run format

# Lint (ESLint)
npm run lint
npm run lint:fix

# Type check (TypeScript)
npm run type-check

# Build pour production
npm run build
```

## 📝 Code Guidelines

### TypeScript
- Strict mode activé
- Type everything (no implicit `any`)
- JSDoc pour exports publics

### React
- Functional components + hooks seulement
- Props typing avec `interface`
- `React.memo` si needed (avoid over-memoization)

### CSS
- Mobile-first approach
- Responsive breakpoints : xs, sm, md, lg, xl
- WCAG AA accessibility (contrast, focus states)

## 🚀 Déploiement

### GitHub Pages / Netlify (Gratuit)

```bash
# Build
npm run build

# Push to main → GitHub Actions auto-deploys
git add . && git commit -m "feat: new feature" && git push origin main
```

**App accessible** :
- GitHub Pages : https://go-ai-editor.github.io
- Netlify : https://go-ai-editor.netlify.app

## 📧 Support

Docs complètes :
- [SF - Spécifications Fonctionnelles](SF-SPECIFICATIONS-FONCTIONNELLES.md)
- [ST - Spécifications Techniques](ST-SPECIFICATIONS-TECHNIQUES.md)
- [ARCHITECTURE.md](ARCHITECTURE.md) (détails techniques)

## 📄 License

MIT - Free for personal and commercial use

---

**GoAI Editor v1.0** © 2026 - Interactive Go Game Editor with AI Analysis
