# ARCHITECTURE.md - GoAI Editor

## Vue d'Ensemble Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 GoAI Editor v1.0                            │
│              Progressive Web App (PWA)                      │
└─────────────────────────────────────────────────────────────┘

┌─ FRONTEND LAYER ──────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          React 18 + TypeScript Components           │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  App.tsx (Root)                              │   │  │
│  │  │  ├─ GameMenu (affichage parties)             │   │  │
│  │  │  └─ GameEditor (édition plateau)             │   │  │
│  │  │     ├─ Board (Canvas 19×19)                  │   │  │
│  │  │     ├─ AnalysisPanel (résultats KataGo)     │   │  │
│  │  │     ├─ VariantTree (arborescence)            │   │  │
│  │  │     ├─ OCRPanel (reconnaissance)             │   │  │
│  │  │     └─ SGFManager (import/export)            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│           ↑              ↑                 ↑                │
│           │              │                 │                │
│  ┌────────┴──────────────┴─────────────────┴────────────┐ │
│  │  Redux Toolkit Store (State Management)              │ │
│  │  ├─ game: { current, games, moves, loading }        │ │
│  │  ├─ ui: { showAnalysis, highlighted, sidebar }      │ │
│  │  ├─ settings: { language, theme, autoSave }         │ │
│  │  └─ evaluations: { results, loading }               │ │
│  └────────┬──────────────┬─────────────────┬────────────┘ │
│           │              │                 │                │
│  ┌────────┴──────────────┴─────────────────┴────────────┐ │
│  │           Services (Business Logic)                   │ │
│  │  ├─ GameService (coups, variantes)                   │ │
│  │  ├─ SGFParser (parse/sérialize)                      │ │
│  │  ├─ KataGoService (wrapper WASM)                     │ │
│  │  ├─ OCRService (wrapper TensorFlow)                  │ │
│  │  ├─ StorageService (IndexedDB CRUD)                 │ │
│  │  └─ i18nService (traductions FR/EN)                  │ │
│  └────────┬──────────────┬─────────────────┬────────────┘ │
│           │              │                 │                │
└───────────┼──────────────┼─────────────────┼────────────────┘
            │              │                 │
┌───────────┼──────────────┼─────────────────┼────────────────┐
│ STORAGE & CACHE LAYER    │                 │                │
│                          │                 │                │
│  ┌────────────────────┐  │  ┌──────────┐   │  ┌──────────┐ │
│  │   IndexedDB        │  │  │Local     │   │  │Web       │ │
│  │   (Parties,        │  │  │Storage   │   │  │Workers   │ │
│  │    Analyses)       │  │  │(prefs)   │   │  │(async)   │ │
│  └────────────────────┘  │  └──────────┘   │  └──────────┘ │
│                          │                 │                │
│  ┌────────────────────────────────────────────────────┐    │
│  │    Service Worker (Cache API)                      │    │
│  │    - Assets (JS, CSS, images)                      │    │
│  │    - WASM (KataGo, TensorFlow models)              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
            │                           │
┌───────────┴───────────────────────────┴──────────────────┐
│        WASM & ML LIBRARIES (Web Workers)                 │
│                                                           │
│  ┌──────────────────┐              ┌──────────────────┐ │
│  │  KataGo.js       │              │  TensorFlow.js   │ │
│  │  (WASM)          │              │  (OCR models)    │ │
│  │                  │              │                  │ │
│  │  - 20 visits     │              │  - Stone detect  │ │
│  │  - Winrate       │              │  - Confidence    │ │
│  │  - Top moves     │              │  - Positioning   │ │
│  └──────────────────┘              └──────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘

NO BACKEND - 100% Client-side Progressive Web App
```

---

## Composants Clés

### 1. **App.tsx** (Root Component)
- Point d'entrée principal
- Gère navigation entre Menu et Éditeur
- Fournit Redux + i18n contexts

```typescript
<Provider store={store}>
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
</Provider>
```

### 2. **GameMenu.tsx**
- Affiche liste parties (IndexedDB)
- Form création nouvelle partie
- Actions supprimer/charger

**State** : Redux `game.games`  
**Actions** : `setCurrentGame`, `addGameToList`, `deleteGameFromList`

### 3. **GameEditor.tsx**
- Composant principal édition
- Layout : Plateau (gauche) + Panneaux (droite)
- Navigation coups (prev/next)
- Appels services SGF, KataGo, OCR

**State** : Redux `game.current`, `ui.*`

### 4. **Board.tsx** (Plateau Interactif)
- Canvas API 19×19
- Rendu stones (noir/blanc)
- Numéros coups
- Highlight position actuelle
- Click handler → dispatch `addMove`

**Props** : `boardSize`, `moves`, `currentMoveIndex`, `onMoveClick`

### 5. **AnalysisPanel.tsx**
- Affiche résultats KataGo
- Win rate (Noir/Blanc)
- Top 5 coups proposés
- Bouton "Analyser Position"

**State** : Redux `evaluations.results`  
**Actions** : dispatch KataGo async

### 6. **LanguageSelector.tsx**
- Boutons FR/EN (top-right header)
- Appelle i18n.changeLanguage()
- Sauvegarde localStorage

---

## Redux Store Structure

### gameSlice
```typescript
{
  current: Game | null,          // Partie actuelle en édition
  games: Game[],                 // Liste parties sauvegardées
  currentMoveIndex: number,      // Index coup actuel
  loading: boolean,
  error: string | null,
}
```

**Actions principales** :
- `setCurrentGame(game)` - Charger partie
- `addMove(move)` - Ajouter coup
- `setGames(games)` - Charger liste parties

### uiSlice
```typescript
{
  showAnalysis: boolean,         // Afficher panel analyse
  selectedVariant: string | null,
  highlighted: Position | null,  // Case surlignée
  sidebarOpen: boolean,
  analysisLoading: boolean,
}
```

### settingsSlice
```typescript
{
  language: 'fr' | 'en',
  theme: 'light' | 'dark',
  autoSave: boolean,
  soundEnabled: boolean,
}
```

### evaluationsSlice
```typescript
{
  results: Record<string, Evaluation>,
  loading: boolean,
  error: string | null,
}
```

---

## Services

### GameService
```typescript
createGame(title, blackPlayer, whitePlayer): Game
addMove(game, move): Game
undoMove(game): Game
createVariant(game, moveId): Variant
isLegalMove(game, move): boolean
getBoardState(game, moveIndex): BoardState
```

**Logique métier** :
- Validation coups
- Arbre mouvements (root + variantes)
- Navigation historique

### SGFParser
```typescript
parse(sgfString): Game
serialize(game): string
validate(sgfString): boolean
```

**Features** :
- Récursive SGF parsing (variantes imbriquées)
- Propriétés standard (BR, WR, RE, C, ...)
- Format RFC compatible

### KataGoService
```typescript
initialize(): Promise<void>
analyzePosition(boardState): Promise<Evaluation>
getTopMoves(boardState, limit): Promise<EvaluatedMove[]>
```

**Offloaded to Web Worker** :
- Async WASM execution
- Non-blocking UI
- Cache résultats IndexedDB

### OCRService
```typescript
initialize(): Promise<void>
recognizeBoard(image): Promise<OCRResult>
preprocessImage(image): Promise<Blob>
```

**Features** :
- TensorFlow.js stone detection
- Confidence filtering (>70%)
- Pixel → coord mapping

### StorageService
```typescript
initDB(): Promise<void>
saveGame(game): Promise<string>
loadGame(id): Promise<Game>
listGames(): Promise<Game[]>
deleteGame(id): Promise<void>
```

**IndexedDB Stores** :
- `games` (keyPath: id)
- `evaluations` (keyPath: id)
- `ocrResults` (keyPath: id)

---

## Data Models

### Game
```typescript
{
  id: UUID,
  title: string,
  createdAt: Date,
  updatedAt: Date,
  blackPlayer: string,
  whitePlayer: string,
  boardSize: 19,
  komi: 6.5,
  handicap: 0,
  rootMoves: Move[],
  variants: Variant[],
  evaluations: Evaluation[],
}
```

### Move
```typescript
{
  id: UUID,
  moveNumber: number,      // 1, 2, 3...
  color: 'B' | 'W',
  x: 0-18,
  y: 0-18,
  comment: string | null,
  symbols: 'triangle' | 'square' | 'circle' | null,
  variants: Variant[],
  parentMoveId: UUID | null,
}
```

### Evaluation
```typescript
{
  id: UUID,
  moveId: UUID,
  winrate: { black: 0-1, white: 0-1 },
  scoreLeadPV: number,           // Points écart
  topMoves: EvaluatedMove[],
  confidence: 0-1,
}
```

---

## Flux de Données Typique

### Workflow : Créer Partie → Ajouter Coups → Analyser

```
1. Utilisateur clique "Nouvelle Partie"
   ↓
2. GameMenu form submit
   → GameService.createGame()
   → StorageService.saveGame(game)
   → dispatch setCurrentGame(game)
   → Redux state update
   ↓
3. GameEditor monte, reçoit game du Redux
   ↓
4. Utilisateur clique plateau (x, y)
   → dispatch addMove(new Move)
   → React re-render Board
   → Auto-save (debounced) → IndexedDB
   ↓
5. Utilisateur clique "Analyser"
   → KataGoService.analyzePosition (Web Worker)
   → dispatch setEvaluation(result)
   → AnalysisPanel affiche résultats
   ↓
6. User quitte éditeur
   → game.updatedAt = now()
   → Auto-save partie
```

---

## Performance Optimisations

### 1. Code Splitting (Vite)
```typescript
// routes lazy-loaded
const OCRPanel = lazy(() => import('./OCRPanel'));
const AnalysisPanel = lazy(() => import('./AnalysisPanel'));
```

### 2. Memoization (React)
```typescript
// Composants coûteux
const Board = React.memo(({ moves, onMoveClick }) => {...});
```

### 3. Web Workers
```typescript
// KataGo WASM en Web Worker
const worker = new Worker(new URL('./workers/katagoWorker.ts', import.meta.url), { type: 'module' });
```

### 4. Debounced Auto-Save
```typescript
const debouncedSave = debounce(() => StorageService.saveGame(game), 500);
```

### 5. IndexedDB Indexing
```typescript
gameStore.createIndex('updatedAt', 'updatedAt');  // Tri rapide
```

---

## Testing Strategy

### Unit Tests (Vitest + @testing-library/react)

```typescript
// test: SGFParser
describe('SGFParser', () => {
  it('parses simple game', () => {
    const sgf = '(;GM[1]FF[4]SZ[19];B[dd];W[pp])';
    const game = SGFParser.parse(sgf);
    expect(game.rootMoves).toHaveLength(2);
  });

  it('handles variants', () => {
    const sgf = '(;B[dd](;W[pp])(;W[oo]))';
    const game = SGFParser.parse(sgf);
    expect(game.variants).toHaveLength(2);
  });
});
```

### E2E Tests (Playwright)

```typescript
// test: full workflow offline
test('create game offline → play → export → reload', async ({ page, context }) => {
  // Go offline
  await context.setOffline(true);

  // Créer partie
  await page.click('button:has-text("Nouvelle Partie")');
  await page.fill('input[name="title"]', 'Offline Test');
  await page.click('button:has-text("Créer")');

  // Ajouter coups
  const canvas = await page.locator('canvas');
  await canvas.click({ position: { x: 100, y: 100 } });
  await canvas.click({ position: { x: 150, y: 150 } });

  // Vérifier sauvegarde
  expect(await page.locator('.move-item')).toHaveCount(2);

  // Recharger
  await page.reload();

  // Partie persiste
  expect(await page.locator('.move-item')).toHaveCount(2);
});
```

---

## Déploiement

### GitHub Pages / Netlify

```bash
# Build optimisé
npm run build

# Git push
git add . && git commit -m "v1.0" && git push origin main

# Auto-deployed via GitHub Actions / Netlify
```

**Resultat** :
- App accessible : https://go-ai-editor.github.io
- HTTPS gratuit
- CDN mondial
- Auto-updates PWA

---

## Normes de Codage

### TypeScript
✅ Strict mode  
✅ No implicit `any`  
✅ JSDoc exports  

### React
✅ Functional components + hooks  
✅ Props typing  
✅ `React.memo` sparingly  

### CSS
✅ Mobile-first  
✅ Responsive breakpoints  
✅ WCAG AA accessibility  

### Git
```
feat: Add Board component
fix: OCR confidence threshold
docs: Update architecture.md
test: Add GameService tests
```

---

## Roadmap d'Implémentation

- [x] v1.0 MVP : Scaffold + composants base
- [ ] v1.0 Phase 2 : Board interactif, SGF parser
- [ ] v1.0 Phase 3 : KataGo, OCR, IndexedDB
- [ ] v1.1 : Règles Go, UI polish
- [ ] v2.0 : Sync cloud, multiplayer

---

**Document créé** : 3 février 2026  
**Statut** : Architecture v1.0 MVP  
**Stack** : React 18 + TypeScript + Vite + Redux + i18n
