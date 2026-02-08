# Spécification Technique (ST) - GoAI Editor v1.0

**Date** : 4 février 2026  
**Version** : v1.0 MVP (Phase 3 en cours)  
**Statut** : Phase 2A/2B ✅ | Phase 3 🚧  
**Stack** : React 18 + TypeScript + Vite + IndexedDB + KataGo.js WASM  

---

## 1. ARCHITECTURE GLOBALE

### 1.1 Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (PWA)                            │
│                   React 18 + TypeScript                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          COUCHE PRÉSENTATION (UI/UX)                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │  Board       │  │  GameEditor  │  │ AnalysisUI  │  │ │
│  │  │  (19×19)     │  │  (moves,     │  │ (stats,     │  │ │
│  │  │              │  │   variants)  │  │  top moves) │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │  OCRPanel    │  │  SGFManager  │  │ LanguageSel │  │ │
│  │  │  (photo,     │  │  (import,    │  │ (FR/EN)     │  │ │
│  │  │   preview)   │  │   export)    │  │             │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↑                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          COUCHE MÉTIER (Services)                      │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │  GameService         │ Move validation, coups       │ │ │
│  │  │  SGFParser           │ Parse/serialize SGF          │ │ │
│  │  │  KataGoService       │ Wrapper KataGo.js local      │ │ │
│  │  │  OCRService          │ Wrapper TensorFlow.js        │ │ │
│  │  │  StorageService      │ IndexedDB CRUD              │ │ │
│  │  │  i18nService         │ Traductions FR/EN            │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        COUCHE DONNÉES (State Management)               │ │
│  │  Redux Toolkit  │ Global state (game, UI, settings)    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        COUCHE STOCKAGE & CACHE                         │ │
│  │  ┌────────────────┐  ┌──────────────────┐             │ │
│  │  │  IndexedDB     │  │  LocalStorage    │             │ │
│  │  │  (parties,     │  │  (prefs: lang)   │             │ │
│  │  │   analyses)    │  │                  │             │ │
│  │  └────────────────┘  └──────────────────┘             │ │
│  │                                                        │ │
│  │  Service Worker (Cache API)                           │ │
│  │  - Assets (JS, CSS, images)                           │ │
│  │  - Modèles WASM (KataGo, TensorFlow)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│            WORKERS & LIBS EXTERNES (WASM)                   │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Web Worker      │  │  Web Worker      │                │
│  │  (KataGo)        │  │  (OCR)           │                │
│  │  WASM            │  │  WASM            │                │
│  │  GPU-optional    │  │  TensorFlow.js   │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Pas de backend : 100% PWA côté client
```

---

## 1.2 PHASE 3 : INTÉGRATION KATAGO (🚧 EN COURS)

### Objectifs Phase 3
1. **KataGoService** : Wrapper KataGo.js WASM pour analyse positions
2. **AnalysisPanel** : UI affichage résultats (winrate, policy, top moves, score)
3. **Web Worker** : katagoWorker.ts pour calculs non-bloquants
4. **Cache analyses** : Persistance IndexedDB (evaluations store)
5. **Visualisation** : Preview coups recommandés sur plateau

### Architecture KataGo Integration

```
┌───────────────────────────────────────────────────────────┐
│           UI LAYER (React Components)                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  AnalysisPanel.tsx                                    │  │
│  │  - Bouton "Analyser"                                  │  │
│  │  - Loading state (spinner)                           │  │
│  │  - Affichage winrate (barres progress)               │  │
│  │  - Affichage policy (distribution coups)            │  │
│  │  - Liste top 5 moves (cliquables)                    │  │
│  │  - Badge "Ancienne" si > 7j                          │  │
│  └────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                        │  │
│  │  KataGoService.ts                                     │  │
│  │  - initialize() : Promise<void>                      │  │
│  │  - analyzePosition(boardState, opts) : Evaluation    │  │
│  │  - getTopMoves(boardState, limit) : EvaluatedMove[]  │  │
│  │  - terminateWorker()                                 │  │
│  └────────────────────────────────────────────────────┘  │
│                           ↓ postMessage                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  WEB WORKER                                           │  │
│  │  katagoWorker.ts                                      │  │
│  │  - onmessage: { type: 'analyze', boardState }        │  │
│  │  - KataGo.js.analyze(boardState, config)             │  │
│  │  - postMessage: { type: 'result', evaluation }       │  │
│  └────────────────────────────────────────────────────┘  │
│                           ↓ WASM call                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  WASM LAYER                                           │  │
│  │  KataGo.js (katago.wasm + katago.js)                 │  │
│  │  - Analyse position Go                                │  │
│  │  - Neural network inference                           │  │
│  │  - Output : winrate, score, top moves                 │  │
│  └────────────────────────────────────────────────────┘  │
│                           ↓ result                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  STORAGE LAYER                                        │  │
│  │  StorageService.ts                                    │  │
│  │  - saveEvaluation(evaluation) : Promise<void>        │  │
│  │  - getEvaluation(moveId) : Promise<Evaluation|null>  │  │
│  │  IndexedDB store 'evaluations' (cache)                │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Configuration KataGo Phase 3

```typescript
// Config par défaut KataGo
interface KataGoConfig {
  visits: number;           // 20 (MVP), 100 (standard), 400 (pro)
  maxTime: number;          // 5 secondes max
  threads: number;          // 1 (WASM limitation)
  reportDuringSearch: bool; // false (MVP)
  topMoves: number;         // 5
}

// Output format (implémenté dans src/types/katago.ts)
interface KataGoAnalysisResult {
  id: string;
  timestamp: Date;
  rootInfo: {
    currentPlayer: 'B' | 'W';
    scoreLead: number;       // Points noir - blanc
    winrate: number;         // 0.0 - 1.0 pour noir
    visits: number;
    utility: number;         // Utilité combinée
  };
  moveInfos: KataGoMoveInfo[];  // Top N coups évalués
  policy: number[][];        // Distribution NN 19×19 normalisée (somme = 1.0)
  confidence: number;        // 0.0 - 1.0
  analysisTime: number;      // Durée en ms
}

interface KataGoMoveInfo {
  move: Position;            // {x, y} coordonnées Go
  moveSGF: string;           // Notation "D4", "Q16"
  visits: number;
  winrate: number;
  scoreLead: number;
  prior: number;             // Probabilité a priori NN
  lcb: number;               // Lower confidence bound
  utility: number;
}

// Exemple de payload KataGo (avec policy matrice 19×19)
const example: KataGoAnalysisResult = {
  id: 'eval-uuid-123',
  timestamp: new Date(),
  rootInfo: {
    currentPlayer: 'B',
    scoreLead: 2.3,
    winrate: 0.58,
    visits: 1200,
    utility: 0.58
  },
  moveInfos: [
    { move: {x:3,y:3}, moveSGF: 'D4', visits: 280, winrate: 0.61, scoreLead: 2.9, prior: 0.08, lcb: 0.55, utility: 0.62 },
    { move: {x:15,y:3}, moveSGF: 'Q16', visits: 240, winrate: 0.59, scoreLead: 2.4, prior: 0.06, lcb: 0.52, utility: 0.59 }
  ],
  policy: [ /* matrice 19×19 float, somme = 1.0, 0 sur pierres existantes */ ],
  confidence: 0.85,
  analysisTime: 1200
};
```

### Fichiers à créer Phase 3

```
src/
  services/
    KataGoService.ts        # ✅ Wrapper KataGo (singleton, cache, simulation MVP)
  workers/
    katagoWorker.ts         # 🆕 Web Worker WASM (TODO: post-MVP)
  components/
    AnalysisPanel.tsx       # ✅ UI analyses (winrate, score, top moves)
    AnalysisPanel.css       # ✅ Styles
  store/slices/
    evaluationsSlice.ts     # ✅ Slice Redux analyses
  hooks/
    useAnalysis.ts          # 🆕 Hook analyses (TODO)
  types/
    katago.ts               # ✅ Types complets (policy: number[][], 169 lignes)
wasm/
  katagojs/
    katago.wasm             # 🆕 Binaire WASM (TODO: post-MVP)
    katago.js               # 🆕 Loader JS
    config.json             # 🆕 Config réseau neural
tests/
  unit/
    KataGoService.test.ts   # ✅ 21 tests (policy, cache, singleton, validation)
  e2e/
    analysis.spec.ts        # ✅ Tests E2E analyse workflow
```

## 1.3 ARCHITECTURE CIBLE (v1.1–v2.0)

### Objectifs techniques priorisés (reformulés)
1. **Axe 1 — Moteur d’analyse robuste** : KataGo “production‑grade” avec profils d’analyse, contrôle fin du temps/visites, reprise sur erreur.
2. **Axe 2 — Score & territoire explicites** : ownership map, scoreLead consolidé, rendu visuel pédagogique.
3. **Axe 3 — Coaching & pédagogie** : feedback par coup, explication des erreurs, recommandations contextualisées.
4. **Axe 4 — Exploration des variations** : arbre de variations, navigation et comparaison A/B.
5. **Axe 5 — Compatibilité SGF avancée** : import/export enrichi (variantes, annotations, commentaires, symboles).

### Synthèse Feature → Axe → Version

| Feature | Axe | Version cible |
|---|---|---|
| Profils d’analyse KataGo (rapide/standard/pro) | Axe 1 | v1.1 (Mars 2026) |
| Gestion visites/temps par profil | Axe 1 | v1.1 (Mars 2026) |
| ScoreLead + estimation territoires | Axe 2 | v1.1 (Mars 2026) |
| Heatmap ownership (361 cases) | Axe 2 | v1.1 (Mars 2026) |
| Arbre de variations navigable | Axe 4 | v1.1 (Mars 2026) |
| Comparaison A/B des lignes | Axe 4 | v1.1 (Mars 2026) |
| Import/Export SGF enrichi (variantes/annotations) | Axe 5 | v1.1 (Mars 2026) |
| Cache multi‑positions (IndexedDB) | Axe 1 | v1.2 (Juin 2026) |
| Priorités d’analyse (par coup/variation) | Axe 1 | v1.2 (Juin 2026) |
| Komi dynamique + réglages | Axe 2 | v1.2 (Juin 2026) |
| Indicateur d’incertitude (LCB) | Axe 2 | v1.2 (Juin 2026) |
| Marquage favoris + tags de lignes | Axe 4 | v1.2 (Juin 2026) |
| Export annotations enrichies (symboles) | Axe 5 | v1.2 (Juin 2026) |
| Feedback par coup + explications | Axe 3 | v2.0 (T1 2027) |
| Résumé pédagogique de partie | Axe 3 | v2.0 (T1 2027) |
| Modes d’analyse par niveau | Axe 3 | v2.0 (T1 2027) |

### Glossaire (termes d’analyse)

- **ownership** : estimation d’appartenance des intersections (valeur -1 à 1) indiquant l’influence noir/blanc.
- **scoreLead** : estimation d’avance en points (Noir - Blanc).
- **LCB (Lower Confidence Bound)** : marge basse de confiance sur le gain estimé d’un coup.
- **visits** : nombre de simulations/visites MCTS pour un coup ou une position.
- **winrate** : probabilité estimée de victoire (par couleur).
- **policy** : distribution de probabilité des coups proposée par le réseau de neurones.

### Acronymes

- **MCTS** : Monte Carlo Tree Search.
- **WASM** : WebAssembly.
- **PWA** : Progressive Web App.
- **NN** : Neural Network (réseau de neurones).
- **GPU** : Graphics Processing Unit.
- **SGF** : Smart Game Format.

### Jalons techniques
- **v1.1 (Mars 2026)** : objectifs 1, 2, 4, 5 (MVP analyse avancée)
- **v1.2 (Juin 2026)** : optimisation performance + cache analyses
- **v2.0 (T1 2027)** : objectif 3 (coaching) + modes d’analyse par niveau

### Composants & services cibles

- **AnalysisEngine** (Service) : orchestre KataGo, cache et post‑traitements.
  - `KataGoService` + `KataGoProfiles` (presets)
  - `EvaluationCache` (IndexedDB)
- **ScoringService** : calcule score/territoire/ownership exploitable en UI.
- **PedagogyService** : détecte erreurs, explique, classe la gravité.
- **VariationTreeService** : modèle et navigation de l’arbre de variations.
- **SGFService** : parse/serialize SGF enrichi (annotations, symboles, variantes).
- **ProfileService** : persiste profils d’analyse (localStorage/IndexedDB).

### UI cible

- **AnalysisPanel v2** : winrate + scoreLead + ownership (heatmap) + top moves.
- **VariationTreePanel** : arbre de variations, comparaison A/B.
- **CoachingPanel** : feedback par coup, résumé d’erreurs.
- **ProfileSwitcher** : sélection rapide (Rapide/Standard/Pro).

### Maquette textuelle (AnalysisPanel v2)

```
┌─────────────────────────────────────────────┐
│ Analysis IA                                 │
├─────────────────────────────────────────────┤
│ Profil : [Rapide ▾]   Visites: 20  Temps: 5s│
│ Winrate : Noir 58% | Blanc 42%              │
│ Score : +2.3 (Noir)                         │
│ Ownership : [Heatmap 19×19]                 │
│ Policy (Top 3): D4 0.08 | Q16 0.06 | C3 0.05 │
│ Top coups:                                   │
│  1) D4  win 61%  visits 280  prior 0.08      │
│  2) Q16 win 59%  visits 240  prior 0.06      │
│  3) C3  win 57%  visits 210  prior 0.05      │
│ [Analyser]  [Rafraîchir]  [Voir variations]  │
└─────────────────────────────────────────────┘
```

### Maquette textuelle (VariationTreePanel)

```
┌─────────────────────────────────────────────┐
│ Variations                                  │
├─────────────────────────────────────────────┤
│ 1. D4 (main)                                 │
│ ├─ 2. Q16                                    │
│ │  ├─ 3. D16 (A)                              │
│ │  └─ 3. C3  (B)                              │
│ └─ 2. C3                                     │
│    └─ 3. Q4                                  │
│                                             │
│ [Comparer A/B]   [Favori ★]   [Tag]         │
└─────────────────────────────────────────────┘
```

### Maquette textuelle (CoachingPanel)

```
┌─────────────────────────────────────────────┐
│ Coaching                                    │
├─────────────────────────────────────────────┤
│ Coup #37 (Noir)                              │
│ Niveau : Intermédiaire                       │
│ Gravité : ⚠️ Moyenne                         │
│                                             │
│ Observation :                               │
│ - Le coup D10 réduit votre territoire.      │
│ - Préférez Q10 (+2.1 pts).                  │
│                                             │
│ Conseils :                                  │
│ - Renforcez la base avant d'attaquer.       │
│ - Évitez les coups trop profonds.           │
│                                             │
│ [Voir variation]  [Marquer comme appris]    │
└─────────────────────────────────────────────┘
```

### Modèles de données (extensions)

- `Evaluation` enrichi :
  - `ownershipMap: number[]` (361 cases, -1..1)
  - `scoreLeadPV: number`
  - `territory: { black: number; white: number }`
  - `policyMoves: EvaluatedMove[]`
- `AnalysisProfile` : nom, visits, maxTime, topMoves, label UI.
- `MoveFeedback` : type d’erreur, explication, sévérité.

### Flux cible simplifié

1. **Board** → `AnalysisEngine.analyze(position, profile)`
2. **KataGoWorker** → résultat brut → **ScoringService** (ownership)
3. **PedagogyService** génère feedback → **UI** (Analysis/Coaching)
4. **VariationTreeService** hydrate arbre → navigation/compare
5. **SGFService** exporte avec annotations + variations

---

## 2. STACK TECHNOLOGIQUE

### Frontend
| Composant | Technologie | Version | Rôle |
|---|---|---|---|
| Framework | React | 18.x | UI composants, hooks |
| Langage | TypeScript | 5.x | Typage statique, sécurité |
| Build/Dev | Vite | 5.x | Fast bundling, HMR |
| State | Redux Toolkit | 1.9+ | Global state (game, UI) |
| i18n | i18next + react-i18next | 13+ | FR/EN traductions |
| Plateau | Canvas API | Native | Rendu optimisé 19×19 |
| Comms | Web Workers | Native | KataGo, OCR (async) |

### IA & ML
| Service | Lib | Hosting | Format |
|---|---|---|---|
| KataGo | KataGo.js (WASM wrapper) | Local (pre-loaded) | WASM binary |
| OCR | TensorFlow.js | Local + model cdn cache | WASM/TF |

### Stockage
| Type | Tech | Limit | Usage |
|---|---|---|---|
| Parties | IndexedDB | ~50 MB | Parties (moves, variants, meta) |
| Config | localStorage | ~5-10 MB | Préférences langue, dernier jeu |
| Cache Asset | Service Worker (Cache API) | ~50+ MB | JS, CSS, images, WASM |

### Déploiement & CI/CD
| Service | Usage | Coût |
|---|---|---|
| GitHub Pages / Netlify | Hosting PWA | Gratuit |
| GitHub Actions (optionnel) | Build + deploy auto | Gratuit |
| CDN (jsDelivr ou cdn.jsdelivr.net) | TensorFlow models | Gratuit |

---

## 3. MODÈLES DE DONNÉES & SCHÉMA

### 3.1 IndexedDB Schéma

```sql
-- Database: 'GoAIEditor'
-- Version: 1

-- Store 1: 'games'
KeyPath: 'id' (UUID)
Indexes:
  - 'createdAt' (range queries)
  - 'updatedAt' (sorting)

-- Store 2: 'evaluations'
KeyPath: 'id' (UUID)
Indexes:
  - 'gameId' (FK → games)
  - 'moveId' (FK → moves)

-- Store 3: 'ocrResults'
KeyPath: 'id' (UUID)
Indexes:
  - 'createdAt'
```

### 3.2 Modèles TypeScript

```typescript
// src/types/game.ts
export type Color = 'B' | 'W';
export type Symbol = 'triangle' | 'square' | 'circle' | null;

export interface Game {
  id: string; // UUID
  title: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Joueurs
  blackPlayer: string;
  whitePlayer: string;
  
  // Plateau
  boardSize: 19; // 19 | 9 | 13 futur
  komi: number; // 6.5
  handicap: number;
  
  // Arbre
  rootMoves: Move[];
  variants: Variant[];
  
  // SGF
  event: string | null;
  date: string | null;
  result: string | null; // "B+5.5" | "W+3"
  comment: string | null;
  
  // Analyses (cache)
  evaluations: Evaluation[];
}

export interface Move {
  id: string; // UUID
  moveNumber: number; // 1, 2, 3...
  color: Color;
  x: number; // 0-18
  y: number; // 0-18
  
  // Annotations
  comment: string | null;
  symbols: Symbol;
  
  // Variantes
  variants: Variant[];
  parentMoveId: string | null;
  
  // Timestamps
  createdAt: Date;
}

export interface Variant {
  id: string;
  moveId: string; // Coup d'où branche
  moves: Move[];
  name: string | null;
}

export interface Evaluation {
  id: string;
  gameId: string;
  moveId: string;
  timestamp: Date;
  
  winrate: {
    black: number; // 0-1
    white: number;
  };
  scoreLeadPV: number; // Points estimés
  
  topMoves: EvaluatedMove[];
  confidence: number; // 0-1
}

export interface EvaluatedMove {
  move: Position;
  visits: number;
  winrate: number;
  lcb: number;
  prior: number;
}

export type Position = { x: number; y: number };

// src/types/sgf.ts
export interface SGFNode {
  properties: Map<string, string[]>;
  children: SGFNode[];
}

export interface SGFGame {
  root: SGFNode;
  variations: SGFGame[];
}

// src/types/ocr.ts
export interface OCRResult {
  id: string;
  imageId: string;
  processedAt: Date;
  
  // Map x:y → color
  stones: Record<string, 'empty' | 'black' | 'white'>;
  confidence: number;
  errors: string[];
}

// src/types/i18n.ts
export type Language = 'fr' | 'en';
export interface Translations {
  [key: string]: string | Record<string, any>;
}
```

### 3.3 Redux Store Shape

```typescript
// src/store/index.ts
export interface RootState {
  game: GameState;
  ui: UIState;
  settings: SettingsState;
  evaluations: EvaluationsState;
}

export interface GameState {
  current: Game | null;
  games: Game[]; // Liste sauvegardées
  currentMove: number; // Index
  loading: boolean;
  error: string | null;
}

export interface UIState {
  showAnalysis: boolean;
  selectedVariant: string | null;
  boardSize: number;
  highlighted: Position | null;
}

export interface SettingsState {
  language: Language;
  theme: 'light' | 'dark';
  autoSave: boolean;
}

export interface EvaluationsState {
  results: Map<string, Evaluation>;
  loading: boolean;
}
```

---

## 4. ARCHITECTURE MODULAIRE (FICHIERS)

### Structure Dossiers

```
go-ai-editor/
├── src/
│   ├── components/
│   │   ├── Board.tsx          # Plateau 19×19 (Canvas)
│   │   ├── GameEditor.tsx     # Éditeur principal
│   │   ├── AnalysisPanel.tsx  # Résultats KataGo
│   │   ├── VariantTree.tsx    # Arborescence
│   │   ├── OCRPanel.tsx       # Photo → plateau
│   │   ├── SGFManager.tsx     # Import/export
│   │   ├── LanguageSelector.tsx # FR/EN
│   │   └── [autres composants...]
│   │
│   ├── services/
│   │   ├── GameService.ts      # Logique coups
│   │   ├── SGFParser.ts        # Parse/serialize
│   │   ├── KataGoService.ts    # Wrapper KataGo
│   │   ├── OCRService.ts       # Wrapper TensorFlow
│   │   ├── StorageService.ts   # IndexedDB
│   │   ├── i18nService.ts      # Traductions
│   │   └── [autres services...]
│   │
│   ├── workers/
│   │   ├── katagoWorker.ts     # Web Worker KataGo
│   │   ├── ocrWorker.ts        # Web Worker OCR
│   │
│   ├── store/
│   │   ├── slices/
│   │   │   ├── gameSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   ├── settingsSlice.ts
│   │   │   ├── evaluationsSlice.ts
│   │   ├── index.ts
│   │
│   ├── types/
│   │   ├── game.ts
│   │   ├── sgf.ts
│   │   ├── ocr.ts
│   │   ├── i18n.ts
│   │
│   ├── utils/
│   │   ├── boardUtils.ts       # Calc coord, validation
│   │   ├── sgfUtils.ts         # Helpers SGF
│   │   ├── canvasUtils.ts      # Rendu plateau
│   │   ├── uuidUtils.ts
│   │   └── [autres utilitaires...]
│   │
│   ├── locales/
│   │   ├── fr.json             # Traductions FR
│   │   ├── en.json             # Traductions EN
│   │
│   ├── hooks/
│   │   ├── useGame.ts          # Redux game
│   │   ├── useAnalysis.ts      # State analysis
│   │   ├── useOCR.ts
│   │   └── [custom hooks...]
│   │
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│
├── public/
│   ├── sw.ts                   # Service Worker
│   ├── manifest.json           # PWA manifest
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │
├── wasm/
│   ├── katagojs/               # KataGo.js (pre-built)
│   │   ├── katago.wasm
│   │   ├── katago.js
│   ├── models/                 # TensorFlow models (cached)
│   │
├── tests/
│   ├── unit/
│   │   ├── GameService.test.ts
│   │   ├── SGFParser.test.ts
│   │   ├── BoardUtils.test.ts
│   ├── e2e/
│   │   ├── create-game.spec.ts
│   │   ├── sgf-import.spec.ts
│   │   ├── offline-mode.spec.ts
│   │
├── vite.config.ts              # Config build
├── tsconfig.json               # TypeScript
├── package.json                # Dependencies
├── README.md                   # Setup guide
└── ARCHITECTURE.md             # Doc technique
```

---

## 5. SERVICES CLÉS

### 5.1 GameService
```typescript
export class GameService {
  // Création/chargement
  createGame(title: string, blackPlayer: string, whitePlayer: string): Game;
  loadGame(id: string): Promise<Game>;
  listGames(): Promise<Game[]>;
  
  // Coups
  addMove(game: Game, move: Move): Game;
  undoMove(game: Game): Game;
  createVariant(game: Game, moveId: string): Variant;
  
  // Navigation
  navigateToMove(game: Game, moveNumber: number): Move | null;
  
  // Validation
  isLegalMove(game: Game, move: Move): boolean;
  getBoardState(game: Game, moveIndex: number): BoardState;
}
```

### 5.2 SGFParser
```typescript
export class SGFParser {
  parse(sgfString: string): Game;
  serialize(game: Game): string;
  validate(sgfString: string): boolean;
  
  // Propriétés SGF
  parseProperty(key: string, values: string[]): any;
  serializeProperty(key: string, value: any): string;
}
```

### 5.3 KataGoService
```typescript
export class KataGoService {
  async initialize(): Promise<void>;
  async analyzePosition(
    boardState: BoardState,
    options: AnalysisOptions
  ): Promise<Evaluation>;
  
  async getTopMoves(
    boardState: BoardState,
    limit: number
  ): Promise<EvaluatedMove[]>;
}
```

### 5.4 OCRService
```typescript
export class OCRService {
  async initialize(): Promise<void>;
  async recognizeBoard(image: Blob): Promise<OCRResult>;
  async preprocessImage(image: Blob): Promise<Blob>;
}
```

### 5.5 StorageService
```typescript
export class StorageService {
  // CRUD Games
  async saveGame(game: Game): Promise<string>;
  async loadGame(id: string): Promise<Game>;
  async deleteGame(id: string): Promise<void>;
  async listGames(): Promise<Game[]>;
  
  // Evaluations
  async saveEvaluation(eval: Evaluation): Promise<void>;
  async getEvaluation(moveId: string): Promise<Evaluation | null>;
  
  // OCR Results
  async saveOCRResult(result: OCRResult): Promise<void>;
  async getOCRResult(id: string): Promise<OCRResult | null>;
  
  // Migrations
  async migrateDB(currentVersion: number): Promise<void>;
}
```

### 5.6 i18nService
```typescript
export class i18nService {
  initialize(language: Language): Promise<void>;
  setLanguage(lang: Language): void;
  translate(key: string, params?: Record<string, any>): string;
  getLanguage(): Language;
}
```

---

## 6. COMPOSANTS PRINCIPAUX

### 6.1 Board Component
```typescript
export interface BoardProps {
  boardSize: number; // 19
  moves: Move[];
  onMoveClick: (x: number, y: number) => void;
  currentMoveIndex: number;
  highlighted?: Position;
}

export const Board: React.FC<BoardProps> = ({...}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    renderBoard(canvasRef.current, boardSize, moves, currentMoveIndex);
  }, [moves, currentMoveIndex]);
  
  const handleClick = (e: React.MouseEvent) => {
    const pos = pixelToCoord(e, canvasRef.current);
    onMoveClick(pos.x, pos.y);
  };
  
  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ border: '2px solid #333' }}
    />
  );
};
```

### 6.2 GameEditor Component
```typescript
export const GameEditor: React.FC<{ gameId: string }> = ({ gameId }) => {
  const dispatch = useDispatch();
  const game = useSelector(state => state.game.current);
  
  useEffect(() => {
    // Load game
    dispatch(loadGame(gameId));
  }, [gameId, dispatch]);
  
  const handleAddMove = (x: number, y: number) => {
    const move = new Move(x, y, currentColor);
    dispatch(addMove(move));
    // Auto-save
    saveGameDebounced(game);
  };
  
  return (
    <div className="editor">
      <Board {...boardProps} onMoveClick={handleAddMove} />
      <AnalysisPanel game={game} />
      <VariantTree game={game} />
    </div>
  );
};
```

### 6.3 AnalysisPanel Component
```typescript
export const AnalysisPanel: React.FC<{ game: Game }> = ({ game }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleAnalyze = async () => {
    setLoading(true);
    const eval = await KataGoService.analyze(boardState);
    setEvaluation(eval);
    setLoading(false);
  };
  
  if (!evaluation) return <button onClick={handleAnalyze}>Analyser</button>;
  
  return (
    <div className="analysis">
      <div>Noir: {(evaluation.winrate.black * 100).toFixed(1)}%</div>
      <div>Blanc: {(evaluation.winrate.white * 100).toFixed(1)}%</div>
      <div>Écart: {evaluation.scoreLeadPV.toFixed(1)} pts</div>
      <div>Top coups:</div>
      {evaluation.topMoves.map(m => (
        <div key={`${m.move.x}-${m.move.y}`}>
          {m.move.x}-{m.move.y}: {(m.winrate * 100).toFixed(1)}%
        </div>
      ))}
    </div>
  );
};
```

---

## 7. FLUX DE DONNÉES (Redux)

### Actions Clés

```typescript
// gameSlice.ts
export const gameSlice = createSlice({
  name: 'game',
  initialState: {
    current: null as Game | null,
    games: [] as Game[],
    currentMove: 0,
  },
  reducers: {
    addMove(state, action: PayloadAction<Move>) {
      if (state.current) {
        state.current.rootMoves.push(action.payload);
        state.current.updatedAt = new Date();
      }
    },
    undoMove(state) {
      if (state.current && state.current.rootMoves.length > 0) {
        state.current.rootMoves.pop();
      }
    },
    setCurrentGame(state, action: PayloadAction<Game>) {
      state.current = action.payload;
    },
    // ...
  },
});

// evaluationsSlice.ts
export const evaluationsSlice = createSlice({
  name: 'evaluations',
  initialState: {
    results: new Map<string, Evaluation>(),
    loading: false,
  },
  reducers: {
    setEvaluation(state, action: PayloadAction<Evaluation>) {
      state.results.set(action.payload.moveId, action.payload);
    },
    // ...
  },
});
```

---

## 8. INTÉGRATIONS EXTERNES

### 8.1 KataGo.js (WASM)
- **Source** : https://github.com/lightvector/KataGo/releases (pre-built WASM)
- **Stockage** : `/wasm/katagojs/` (local, pré-chargé)
- **Communication** : Web Worker (katagoWorker.ts)
- **Temps** : ~1-3 secondes par analyse (20 visits par défaut)
- **Cache** : Service Worker + IndexedDB

### 8.2 TensorFlow.js (OCR)
- **Source** : https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4
- **Modèle OCR** : Tesseract.js-OCR.js ou @tensorflow-models/posenet (stones)
- **Stockage** : Pré-cachés Service Worker
- **Temps** : ~5-10 secondes par image (compromis CPU)
- **Confiance** : seuil 70% pour affichage auto

### 8.3 i18next (Traductions)
- **Config** : `src/locales/fr.json`, `src/locales/en.json`
- **Namespaces** : 'common', 'game', 'analysis', 'ocr'
- **Détection** : navigator.language fallback to 'fr'
- **Storage** : localStorage (clé 'i18nextLng')

---

## 9. PERFORMANCE TARGETS

| Métrique | Target | Notes |
|---|---|---|
| **Bundle size** | < 2 MB (gzipped) | React + Redux + utils |
| **WASM/Models** | < 50 MB | Cachés Service Worker |
| **First paint** | < 2 secondes | Vite bundle optimisé |
| **Board render** | 60 FPS | Canvas natif |
| **OCR image** | < 10 secondes | CPU-bound (TensorFlow) |
| **KataGo analyse** | < 3 secondes | 20 visits par défaut |
| **IndexedDB query** | < 100 ms | Petit volume MVP |
| **Save game** | < 500 ms | Debounced |

---

## 10. SÉCURITÉ & VALIDATION

### Input Validation
- SGF Parser : vérifie format RFC, échappe XSS
- OCR : valide mime-type image (JPG, PNG seulement)
- Coords : vérification x, y ∈ [0, 18]
- i18n keys : whitelist traductions chargées

### XSS Prevention
- React escape par défaut (pas de dangerouslySetInnerHTML)
- DOMPurify pour annotations utilisateur si needed
- CSP headers (Netlify) : restrict scripts locaux seulement

### CORS
- Zéro CORS (100% local) ou CDN whitelisted (jsDelivr TF models)
- Service Worker cache tout → offline full

---

## 11. STRATÉGIE DE TEST

### Unit Tests (Vitest + React Testing Library)
```typescript
// tests/unit/SGFParser.test.ts
describe('SGFParser', () => {
  it('parses simple game', () => {
    const sgf = '(;GM[1]FF[4]SZ[19];B[dd];W[pp])';
    const game = SGFParser.parse(sgf);
    expect(game.rootMoves).toHaveLength(2);
  });
  
  it('handles variants', () => {
    const sgf = '(;B[dd](;W[pp];B[qd])(;W[oo]))';
    const game = SGFParser.parse(sgf);
    expect(game.variants).toHaveLength(2);
  });
});

// tests/unit/BoardUtils.test.ts
describe('BoardUtils', () => {
  it('detects legal moves', () => {
    const board = createEmptyBoard();
    expect(isLegal(board, 3, 3)).toBe(true);
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/create-game.spec.ts
test('create and save new game', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button:has-text("Nouvelle Partie")');
  await page.fill('input[name="title"]', 'Test Game');
  await page.click('button:has-text("Créer")');
  
  // Board doit être visible
  const canvas = await page.locator('canvas');
  expect(await canvas.isVisible()).toBe(true);
  
  // Click sur plateau
  await canvas.click({ position: { x: 100, y: 100 } });
  // Coup doit être visible
});

// tests/e2e/offline-mode.spec.ts
test('app works offline', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  
  // Simuler offline
  await context.setOffline(true);
  
  // Créer partie, coups, etc.
  // Vérifier IndexedDB persiste
  // Vérifier UI responsive
});

// tests/e2e/ocr-flow.spec.ts
test('upload photo and recognize board', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button:has-text("OCR")');
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/board.jpg');
  
  // OCR processing
  await page.waitForSelector('.ocr-result');
  const stones = await page.locator('.stone').count();
  expect(stones).toBeGreaterThan(0);
});
```

---

## 12. DEPLOYMENT & CI/CD

### Plateforme
- **GitHub Pages** ou **Netlify** (gratuit)
- **Domain** : go-ai-editor.github.io / go-ai-editor.netlify.app

### Build
```bash
npm run build
# → dist/ (Vite optimized)
```

### GitHub Actions (optionnel)
```yaml
name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 13. NORMES DE CODAGE (MCP Context7)

### TypeScript
- Strict mode : `noImplicitAny`, `strictNullChecks`
- Target : ES2020+
- Naming : camelCase (variables/functions), PascalCase (types/classes)
- Docstrings : JSDoc pour exports publics

### React
- Functional components + hooks (pas class components)
- Props typing : `interface PropsName extends React.PropsWithChildren`
- Memoization : `React.memo` si needed (avoid over-memoization)
- Custom hooks : préfixe `use`, logique réutilisable

### CSS
- CSS Modules ou Tailwind (choix à confirmer)
- Mobile-first breakpoints (xs, sm, md, lg, xl)
- Accessibility : focus states, contrast ≥ 4.5:1, semantic HTML

### Performance
- Code splitting : lazy load componentsOCR, analyses
- Tree-shaking : ES6 modules, export named
- Image optimization : WebP fallback, responsive srcset
- WASM loading : lazy avec useEffect, caching

### A11y
- ARIA labels : role, aria-label, aria-describedby
- Keyboard nav : tabindex, focus management
- Color contrast : WCAG AA minimum
- Screen reader testing (NVDA/JAWS)

---

## 14. CONTRAINTES & LIMITATIONS

| Contrainte | Impact | Mitigation |
|---|---|---|
| **WASM overhead** | Bundle +20-30 MB | Service Worker cache + lazy load |
| **IndexedDB limits** | ~50 MB quota | Compression, cleanup old games |
| **Mobile GPU** | OCR/KataGo slow | Reduce model size, compromise quality |
| **Network needed** (CDN models) | Sync première fois | Pre-cache dans SW, fallback offline |
| **Ko/Capture rules** | Pas validée | Édition manuelle ok, v1.1 feature |

---

## 15. CONFORMITÉ MCP CONTEXT7 & BEST PRACTICES

### Appliqué dans ST v1.0
- ✅ TypeScript strict + ESLint config
- ✅ React 18 hooks patterns
- ✅ Vite 5 + SWC compiler
- ✅ CSS Modules + responsive design
- ✅ Web Workers + async/await
- ✅ IndexedDB latest API
- ✅ i18next structured (namespaces)
- ✅ Playwright E2E automation
- ✅ WCAG 2.1 AA a11y targets
- ✅ PWA manifest + Service Worker

---

## 16. HISTORIQUE & CHANGELOG

**v1.0** (2026-02-03)
- 🎉 ST initiale, architecture complète
- 📊 Modèles TypeScript détaillés
- 🔧 Stack React + Redux + Vite
- 📦 Intégrations WASM, OCR, KataGo
- 🧪 Plan tests unitaires + E2E
- 🚀 Deploy Netlify/GitHub Pages

---

**Fin ST v1.0**
