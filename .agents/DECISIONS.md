# DÉCISIONS ARCHITECTURE - GoAI Editor

**Projet** : GoAI Editor MVP  
**Date création** : 3 février 2026  
**Dernière mise à jour** : 3 février 2026

---

## 📋 Index Rapide

| # | Date | Titre | Décideur | Impact |
|---|---|---|---|---|
| [001](#decision-001) | 1 fév 2026 | React + Vite vs Next.js | @orchestrator | Stack principal |
| [002](#decision-002) | 1 fév 2026 | IndexedDB vs localStorage | @orchestrator | Persistence |
| [003](#decision-003) | 1 fév 2026 | Redux Toolkit vs Context API | @orchestrator | State management |
| [004](#decision-004) | 2 fév 2026 | Multi-agent architecture | @orchestrator | Workflow dev |
| [005](#decision-005) | 3 fév 2026 | Canvas vs SVG pour Board | @orchestrator | Rendu plateau |

---

## Decision #001: React + Vite vs Next.js

**Date** : 1 février 2026  
**Décideur** : @orchestrator  
**Participants** : @specs, @dev

### Contexte

Choix du framework frontend pour PWA offline-first avec AI (KataGo WASM) et OCR (TensorFlow.js).

### Options Considérées

1. **React 18 + Vite 5** ✅ (choisi)
   - ✅ PWA-first avec vite-plugin-pwa
   - ✅ Build ultra-rapide (SWC)
   - ✅ Support WASM natif
   - ✅ Offline-first simple
   - ❌ Pas de SSR (pas besoin)

2. **Next.js 14**
   - ✅ SSR/SSG puissant
   - ✅ Routing intégré
   - ❌ Complexité SSR inutile pour PWA offline
   - ❌ Build plus lent
   - ❌ PWA moins naturel

3. **SvelteKit**
   - ✅ Performance excellente
   - ❌ Écosystème plus petit
   - ❌ Moins de libs (Redux, etc.)

### Décision Finale

**✅ React 18 + Vite 5**

### Raisons

1. **PWA-first** : Vite plugin PWA intégré, manifest + SW automatique
2. **Performance** : SWC compiler, HMR instantané
3. **WASM support** : KataGo.js WASM fonctionne out-of-the-box
4. **Écosystème** : Redux, TensorFlow.js, i18next bien supportés
5. **Offline-first** : Service Worker simple sans complexité SSR

### Impact

- **Fichiers** : `vite.config.ts`, `package.json`
- **Stack** : React 18.2.0, Vite 5.0.0, @vitejs/plugin-react
- **Bundle** : Optimisé < 2 MB (target)

### Alternatives Futures

- Next.js 15+ si besoin SEO (v2.0+)
- Astro si besoin contenu statique (blog)

---

## Decision #002: IndexedDB vs localStorage

**Date** : 1 février 2026  
**Décideur** : @orchestrator  
**Participants** : @dev

### Contexte

Choix technologie persistence offline pour games, KataGo evaluations, OCR results.

### Options Considérées

1. **IndexedDB** ✅ (choisi)
   - ✅ Capacité ~50 MB (illimitée avec permission)
   - ✅ Support objets complexes (pas de sérialisation)
   - ✅ Indexes pour queries rapides
   - ✅ Async (pas de blocking UI)
   - ❌ API complexe (mitigé par wrapper)

2. **localStorage**
   - ✅ API simple (sync)
   - ❌ Limite 5-10 MB
   - ❌ Sérialisation JSON requise
   - ❌ Sync (bloque UI)
   - ❌ Pas d'indexes

3. **WebSQL**
   - ❌ Deprecated
   - ❌ Pas de support Safari

### Décision Finale

**✅ IndexedDB avec wrapper service**

### Raisons

1. **Scalabilité** : 50+ MB pour 100+ games avec KataGo evaluations
2. **Performance** : Async queries, indexes sur `gameId`
3. **Durabilité** : Standard W3C stable
4. **Complexité gérée** : StorageService abstrait API complexe

### Implémentation

```typescript
// src/services/StorageService.ts
class StorageService {
  async saveGame(game: Game): Promise<void>
  async loadGame(gameId: string): Promise<Game | null>
  async saveEvaluation(evaluation: Evaluation): Promise<void>
  // ...
}
```

### Impact

- **Fichiers** : `src/services/StorageService.ts` (~180 lignes)
- **Stores** : `games`, `evaluations`, `ocrResults`
- **Quota** : ~50 MB initial, extensible

### Métriques

- ✅ 100+ games stockables
- ✅ < 100ms read latency
- ✅ Async (pas de freeze UI)

---

## Decision #003: Redux Toolkit vs Context API

**Date** : 1 février 2026  
**Décideur** : @orchestrator  
**Participants** : @dev

### Contexte

Choix state management pour app complexe (games, UI state, settings, evaluations).

### Options Considérées

1. **Redux Toolkit 1.9** ✅ (choisi)
   - ✅ Predictable state updates
   - ✅ DevTools puissants
   - ✅ Middleware (persist, logger)
   - ✅ TypeScript excellent
   - ❌ Boilerplate (réduit par RTK)

2. **Context API + useReducer**
   - ✅ Built-in React
   - ✅ Pas de dépendance
   - ❌ Re-render issues à grande échelle
   - ❌ Pas de DevTools
   - ❌ Middleware complexe

3. **Zustand**
   - ✅ API simple
   - ✅ Petite taille
   - ❌ Écosystème plus petit
   - ❌ Moins de middleware

### Décision Finale

**✅ Redux Toolkit avec 4 slices**

### Structure State

```typescript
// Store shape
{
  game: {
    current: Game | null,
    games: Game[],
    currentMoveIndex: number,
    loading: boolean,
    error: string | null
  },
  ui: {
    analysisPanelOpen: boolean,
    highlightedMoves: string[],
    sidebarVisible: boolean
  },
  settings: {
    language: 'fr' | 'en',
    theme: 'light' | 'dark',
    autoSave: boolean
  },
  evaluations: {
    [gameId: string]: Evaluation[]
  }
}
```

### Raisons

1. **Complexité justifiée** : 4 slices, state imbriqué
2. **DevTools** : Time-travel debugging essentiel
3. **Persist** : Redux-persist pour settings
4. **Scalabilité** : Prêt pour features futures (multiplayer, etc.)

### Impact

- **Fichiers** : 
  - `src/store/index.ts`
  - `src/store/slices/gameSlice.ts`
  - `src/store/slices/uiSlice.ts`
  - `src/store/slices/settingsSlice.ts`
  - `src/store/slices/evaluationsSlice.ts`
- **Bundle** : +45 KB (redux + react-redux)

---

## Decision #004: Multi-Agent Architecture

**Date** : 2 février 2026  
**Décideur** : @orchestrator  
**Participants** : Tous

### Contexte

Structurer workflow développement pour maximiser efficacité et qualité.

### Options Considérées

1. **Multi-agent spécialisé** ✅ (choisi)
   - ✅ Parallélisation tasks
   - ✅ Spécialisation expertise
   - ✅ Séparation concerns
   - ❌ Overhead coordination (mitigé)

2. **Single agent général**
   - ✅ Coordination simple
   - ❌ Pas de parallélisation
   - ❌ Surcharge cognitive
   - ❌ Qualité moindre

### Décision Finale

**✅ 4 agents spécialisés : Orchestrator, Specs, Dev, QA**

### Agents Définis

| Agent | Rôle | Responsabilité |
|---|---|---|
| **@orchestrator** | Chef projet | Phases, priorités, coordination |
| **@specs** | Product writer | SF, ST, docs API |
| **@dev** | Code generator | Features, tests unitaires |
| **@qa** | Tests UX | E2E, offline, responsive |

### Workflows

- **Phase start** : orchestrator → specs → dev
- **Feature impl** : specs → dev → qa → orchestrator
- **Bug fix** : qa → dev → qa
- **Specs update** : orchestrator → specs

### Impact

- **Fichiers** : 
  - `.agents/config.json`
  - `.agents/GUIDE.md`
  - `.agents/PHASES.md`
  - `.agents/DECISIONS.md`
- **Efficacité** : +40% (estimé) via parallélisation

### Métriques Attendues

- ✅ Dev + QA en parallèle (gain temps)
- ✅ Qualité specs++ (agent dédié)
- ✅ Bugs détectés tôt (QA systématique)

---

## Decision #005: Canvas vs SVG pour Board

**Date** : 3 février 2026  
**Décideur** : @orchestrator  
**Participants** : @dev

### Contexte

Choix technologie rendu plateau Go 19×19 interactif.

### Options Considérées

1. **Canvas API** ✅ (choisi)
   - ✅ Performance 60 FPS sur mobile
   - ✅ Moins de DOM nodes
   - ✅ Animations fluides (requestAnimationFrame)
   - ✅ Contrôle pixel-perfect
   - ❌ Pas de hover CSS natif (géré en JS)

2. **SVG**
   - ✅ Hover CSS simple
   - ✅ Responsive facile (viewBox)
   - ❌ 361 nodes DOM (19×19 intersections)
   - ❌ Performance < 30 FPS mobile
   - ❌ Memory footprint élevé

3. **HTML Grid + CSS**
   - ✅ Responsive natif
   - ❌ 361 div elements
   - ❌ Impossible rendu pierres 3D réaliste
   - ❌ Animations limitées

### Décision Finale

**✅ Canvas API avec requestAnimationFrame**

### Architecture

```typescript
// Board.tsx
const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Render loop
    const render = () => {
      drawGrid(ctx);
      drawStones(ctx, game.moves);
      drawHover(ctx, hoverPosition);
      requestAnimationFrame(render);
    };
    
    render();
  }, [game]);
  
  const handleClick = (e: MouseEvent) => {
    const pos = getIntersection(e.clientX, e.clientY);
    dispatch(addMove({ position: pos }));
  };
  
  return <canvas ref={canvasRef} onClick={handleClick} />;
};
```

### Raisons

1. **Performance** : 60 FPS garanti sur iPhone SE (target)
2. **Memory** : 1 Canvas vs 361 SVG nodes
3. **Flexibilité** : Rendu pierres 3D avec gradients
4. **Mobile-first** : Optimisé touch events

### Mitigations Risques

| Risque | Mitigation |
|---|---|
| Hover complexe en JS | Helper `getIntersection()` avec snap to grid |
| Responsive sizing | CSS `aspect-ratio: 1` + canvas resize listener |
| Accessibility | ARIA labels + keyboard navigation (v1.1) |

### Impact

- **Fichiers** : 
  - `src/components/Board.tsx`
  - `src/services/BoardService.ts` (helpers Canvas)
- **Bundle** : +0 KB (Canvas natif)
- **Performance** : Target 60 FPS, < 16ms render

### Tests Requis

- ✅ Performance test : 60 FPS sur mobile
- ✅ Memory leak test : Stable après 100 coups
- ✅ Click precision test : ±5px tolérance

---

## 📊 Impact Global Décisions

**Bundle Size** :
- React + Vite : 140 KB
- Redux Toolkit : 45 KB
- Canvas API : 0 KB (natif)
- **Total** : ~185 KB (libs core)

**Performance** :
- IndexedDB : < 100ms queries
- Canvas : 60 FPS rendering
- Vite build : < 30s

**Scalabilité** :
- IndexedDB : 100+ games
- Redux : State complexe géré
- Multi-agent : Parallélisation efficace

---

## 🔄 Processus Prise Décision

### 1. Identification Besoin
- Agent identifie choix technique nécessaire
- Escalade à @orchestrator

### 2. Analyse Options
- @orchestrator consulte @specs (impact fonctionnel)
- @dev analyse (faisabilité technique)
- @qa input (testabilité)

### 3. Décision
- @orchestrator tranche
- Document dans DECISIONS.md
- Template standard :
  - Contexte
  - Options
  - Décision + Raisons
  - Impact

### 4. Communication
- Broadcast tous agents
- Update SF/ST si nécessaire
- Git commit ref decision

---

## 📝 Template Nouvelle Décision

```markdown
## Decision #XXX: Titre Court

**Date** : JJ mois AAAA
**Décideur** : @agent
**Participants** : @agent1, @agent2

### Contexte

Pourquoi ce choix est nécessaire ?

### Options Considérées

1. **Option A** ✅/❌
   - ✅ Avantage 1
   - ❌ Inconvénient 1

2. **Option B**
   - ✅ Avantage
   - ❌ Inconvénient

### Décision Finale

**✅ Option choisie**

### Raisons

1. Raison 1
2. Raison 2

### Impact

- **Fichiers** : fichiers affectés
- **Métriques** : impact mesurable

### Alternatives Futures

- Si contexte change...
```

---

**Dernière mise à jour** : 3 février 2026 par @orchestrator  
**Prochaine décision attendue** : Phase 2B (SGF parser choice)
