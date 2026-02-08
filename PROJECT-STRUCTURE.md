# 🗂️ Structure du Projet GoAI Editor

> Mise à jour : 8 février 2026

## 📁 Arborescence Principale

```
go-ai-editor/
│
├── 📄 README.md                    # Vue d'ensemble du projet
├── 📄 DOCUMENTATION.md             # Guide de navigation de la doc
├── 📄 CHANGELOG.md                 # Historique des versions
├── 📄 BUGS.md                      # Suivi des bugs
├── 📄 package.json                 # Dépendances npm
├── 📄 tsconfig.json                # Configuration TypeScript
├── 📄 vite.config.ts               # Configuration Vite
├── 📄 playwright.config.ts         # Configuration Playwright
│
├── 📂 src/                         # Code source de l'application
│   ├── 📂 components/              # Composants React
│   │   ├── Board.tsx               # Plateau de jeu 19×19
│   │   ├── Board.css
│   │   ├── GameEditor.tsx          # Éditeur de partie
│   │   ├── GameEditor.css
│   │   ├── GameMenu.tsx            # Menu principal
│   │   ├── GameMenu.css
│   │   ├── AnalysisPanel.tsx       # Panneau d'analyse IA
│   │   ├── AnalysisPanel.css
│   │   ├── LanguageSelector.tsx    # Sélecteur FR/EN
│   │   └── LanguageSelector.css
│   │
│   ├── 📂 services/                # Services métier
│   │   ├── GameService.ts          # Logique de jeu Go
│   │   ├── StorageService.ts       # Persistance IndexedDB
│   │   ├── SGFParser.ts            # Parser SGF (à venir)
│   │   ├── KataGoService.ts        # Interface KataGo (à venir)
│   │   └── OCRService.ts           # OCR plateau (à venir)
│   │
│   ├── 📂 store/                   # Redux Toolkit
│   │   ├── index.ts                # Configuration store
│   │   └── slices/
│   │       ├── gameSlice.ts        # État jeu
│   │       ├── uiSlice.ts          # État UI
│   │       ├── settingsSlice.ts    # Paramètres
│   │       └── evaluationsSlice.ts # Cache analyses
│   │
│   ├── 📂 types/                   # Définitions TypeScript
│   │   ├── game.ts                 # Types jeu (Game, Move, etc.)
│   │   ├── sgf.ts                  # Types SGF
│   │   ├── katago.ts               # Types KataGo
│   │   ├── ocr.ts                  # Types OCR
│   │   └── i18n.ts                 # Types i18n
│   │
│   ├── 📂 utils/                   # Utilitaires
│   │   ├── boardUtils.ts           # Conversions coordonnées
│   │   ├── canvasUtils.ts          # Rendu Canvas (7 layers)
│   │   └── i18nConfig.ts           # Configuration i18n
│   │
│   ├── 📂 hooks/                   # Hooks React personnalisés
│   ├── 📂 locales/                 # Traductions
│   │   ├── fr.json                 # Français
│   │   └── en.json                 # Anglais
│   │
│   ├── App.tsx                     # Composant racine
│   ├── App.css
│   ├── main.tsx                    # Point d'entrée
│   └── index.css                   # Styles globaux
│
├── 📂 public/                      # Ressources statiques
│   ├── manifest.json               # Manifest PWA
│   ├── sw.ts                       # Service Worker
│   └── icons/                      # Icônes app
│
├── 📂 tests/                       # Tests
│   ├── 📂 unit/                    # Tests unitaires (Vitest)
│   │   ├── GameService.test.ts
│   │   ├── boardUtils.test.ts
│   │   ├── canvasUtils.test.ts
│   │   └── KataGoService.test.ts
│   │
│   └── 📂 e2e/                     # Tests E2E (Playwright)
│       ├── board.spec.ts           # Tests Board (32 tests)
│       ├── analysis.spec.ts        # Tests Analyse (9 tests)
│       ├── global-setup.ts
│       ├── global-teardown.ts
│       └── README.md
│
├── 📂 docs/                        # 📚 DOCUMENTATION
│   ├── README.md                   # Index documentation
│   ├── INDEX.md                    # Hub de navigation
│   │
│   ├── 📂 specifications/          # Spécifications
│   │   ├── SF-SPECIFICATIONS-FONCTIONNELLES.md
│   │   └── ST-SPECIFICATIONS-TECHNIQUES.md
│   │
│   ├── 📂 architecture/            # Architecture
│   │   ├── ARCHITECTURE.md
│   │   └── ARCHITECTURE-PHASE2A.md
│   │
│   ├── 📂 user-stories/            # User Stories
│   │   ├── US-2-BOARD-SPEC.md
│   │   └── US-2-LIVRAISON.md
│   │
│   ├── 📂 qa-reports/              # Rapports QA
│   │   ├── QA-EXECUTIVE-SUMMARY.md
│   │   ├── QA-FINAL-REPORT.md
│   │   ├── QA-REPORTS.md
│   │   ├── QA-ACTIONS-SUMMARY.md
│   │   ├── QA-DOCUMENTATION-INDEX.md
│   │   └── QA-VALIDATION-ARCHIVE.md
│   │
│   ├── 📂 validation/              # Validations
│   │   ├── VALIDATION-CHECKLIST.md
│   │   ├── VALIDATION-PHASE2A-SUMMARY.md
│   │   ├── PHASE2A-SUMMARY.txt
│   │   ├── COMPLETION-REPORT.md
│   │   ├── FICHIERS-CREES.md
│   │   └── INTEGRATION-CHECKLIST.md
│   │
│   └── 📂 guides/                  # Guides pratiques
│       ├── QUICK-START.md
│       ├── HOW-TO-RUN-E2E-TESTS.md
│       └── RAPPORT-DEMARRAGE.md
│
├── 📂 .github/                     # Configuration GitHub
│   └── copilot-instructions.md    # Instructions GitHub Copilot
│
└── 📂 .agents/                     # Configuration multi-agents
    ├── config.json
    ├── GUIDE.md
    ├── PHASES.md
    ├── DECISIONS.md
    └── ROADMAP.md
```

## 📊 Statistiques du Projet

### Code Source
- **Composants React** : 5 fichiers (~800 lignes)
- **Services** : 2 implémentés, 3 planifiés (~430 lignes)
- **Utilitaires** : 3 fichiers (~660 lignes)
- **Redux slices** : 4 fichiers
- **Types TypeScript** : 5 fichiers

### Tests
- **Tests unitaires** : 4 fichiers (~1,200 lignes, 57+ tests)
- **Tests E2E** : 2 fichiers (~1,300 lignes, 41 tests)

### Documentation
- **Total fichiers** : 30 fichiers Markdown
- **Lignes documentation** : ~8,500 lignes
- **Catégories** : 6 (specs, archi, user-stories, QA, validation, guides)

## 🎯 Chemins Importants

### Pour développer
```bash
src/components/Board.tsx        # Board interactif
src/services/GameService.ts     # Logique métier Go
src/utils/boardUtils.ts          # Conversions coordonnées
src/utils/canvasUtils.ts         # Rendu Canvas
```

### Pour tester
```bash
tests/unit/                      # Tests unitaires
tests/e2e/board.spec.ts          # Tests E2E Board
```

### Pour documenter
```bash
docs/README.md                   # Point d'entrée doc
docs/INDEX.md                    # Hub navigation
DOCUMENTATION.md                 # Guide rapide
```

### Pour comprendre
```bash
README.md                        # Vue d'ensemble
docs/architecture/ARCHITECTURE.md
docs/specifications/SF-SPECIFICATIONS-FONCTIONNELLES.md
```

## 🔗 Fichiers de Configuration

| Fichier | Description |
|---------|-------------|
| `package.json` | Dépendances et scripts npm |
| `tsconfig.json` | Configuration TypeScript (strict mode) |
| `vite.config.ts` | Build Vite + PWA plugin |
| `playwright.config.ts` | Tests E2E multi-navigateurs |
| `.eslintrc.json` | Linting React + TypeScript |
| `.prettierrc.json` | Formatage code |

## 📝 Scripts NPM Disponibles

```bash
npm run dev          # Serveur dev (port 5173)
npm run build        # Build production
npm run preview      # Prévisualiser build
npm test             # Tests unitaires (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
npm run lint         # Linter
npm run type-check   # Vérifier types TypeScript
```

---

**Dernière mise à jour** : 8 février 2026  
**Version** : 1.0.0-alpha
