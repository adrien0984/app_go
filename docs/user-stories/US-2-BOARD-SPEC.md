# US-2 : Board Interactif 19×19 - Spécification Détaillée

**Projet** : GoAI Editor MVP  
**Phase** : Phase 2A - Board Interactif  
**Version** : v1.0  
**Date** : 3 février 2026  
**Auteur** : @specs  
**Stack** : React 18 + TypeScript 5 + Canvas API + Redux Toolkit  

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Description Fonctionnelle](#2-description-fonctionnelle)
3. [Critères d'Acceptation Techniques](#3-critères-dacceptation-techniques)
4. [Spécifications Canvas](#4-spécifications-canvas)
5. [Spécifications GameService](#5-spécifications-gameservice)
6. [Types TypeScript](#6-types-typescript)
7. [Tests Unitaires](#7-tests-unitaires)
8. [Tests E2E](#8-tests-e2e)
9. [Performance Targets](#9-performance-targets)
10. [Edge Cases](#10-edge-cases)
11. [Code Snippets Attendus](#11-code-snippets-attendus)
12. [Checklist Implémentation](#12-checklist-implémentation)

---

## 1. Vue d'Ensemble

### 1.1 User Story

**En tant que** joueur de Go,  
**Je veux** cliquer sur le plateau 19×19 pour placer des coups,  
**Afin que** je puisse créer et éditer des parties avec alternance automatique Noir/Blanc.

### 1.2 Objectifs Business

- ✅ Plateau interactif réactif et fluide (60 FPS)
- ✅ Placement de coups en un clic avec validation des règles
- ✅ Affichage numéros de coups en séquence
- ✅ Support mobile (touch) et desktop (mouse)
- ✅ Undo/Redo complet avec historique

### 1.3 Architecture Décidée

**Décision #005** : Canvas API choisi pour performance 60 FPS sur mobile.

**Raisons** :
- 1 Canvas vs 361 SVG/HTML nodes
- Rendu optimisé avec requestAnimationFrame
- Contrôle pixel-perfect pour gradients pierres 3D
- Memory footprint minimal

**Composants clés** :
- `Board.tsx` : Composant React Canvas
- `GameService.ts` : Logique métier (validation, état plateau)
- `gameSlice.ts` : Redux state management
- `boardUtils.ts` : Helpers coordonnées Canvas ↔ Go

---

## 2. Description Fonctionnelle

### 2.1 Comportement Utilisateur

#### 2.1.1 Placement de Coup

1. **Hover** : Survol intersection → aperçu pierre fantôme (opacity 0.5)
2. **Click** : Clic intersection vide → pierre placée avec couleur alternée
3. **Feedback** : Numéro coup affiché sur pierre
4. **Auto-save** : Sauvegarde IndexedDB après 500ms (debounce)

#### 2.1.2 Alternance Couleur

- Premier coup : Noir (B)
- Coups suivants : alternance automatique B → W → B → W...
- Règle : `nextColor = lastMove.color === 'B' ? 'W' : 'B'`

#### 2.1.3 Navigation dans l'Historique

- **Bouton ◀ Précédent** : Revient au coup N-1 (affiche état plateau)
- **Bouton ▶ Suivant** : Avance au coup N+1
- **Numéro coup actuel** : Indiqué dans UI (ex: "Coup 42 / 135")
- **État plateau** : Recalculé en fonction de `currentMoveIndex`

#### 2.1.4 Annulation (Undo)

- **Raccourci** : Ctrl+Z (Cmd+Z macOS)
- **Bouton** : Icône ↶ dans toolbar
- **Comportement** : Supprime dernier coup de `game.rootMoves[]`
- **Limite** : Undo jusqu'au coup #1 (plateau vide)

### 2.2 Affichage Plateau

#### 2.2.1 Goban 19×19

- Grille 19×19 lignes (361 intersections)
- Couleur fond : Beige/bois (#D4A574)
- Lignes grille : Noir (#000000), épaisseur 1px
- Hoshi (points étoiles) : 9 points (D4, D10, D16, K4, K10, K16, Q4, Q10, Q16)

#### 2.2.2 Pierres

- **Noir** : Cercle rempli #000000 avec dégradé radial (effet 3D)
- **Blanc** : Cercle rempli #FFFFFF avec bordure #CCCCCC et dégradé
- **Rayon** : 40% de la cellule (ex: cellule 30px → rayon 12px)
- **Numéro** : Police 12px, centré, couleur inversée (blanc sur noir, noir sur blanc)

#### 2.2.3 Hover/Highlight

- **Hover intersection** : Cercle pointillé transparent (opacity 0.3)
- **Dernier coup joué** : Cercle rouge autour pierre (strokeStyle #FF0000, lineWidth 2px)
- **Coup actuel en navigation** : Fond jaune sur pierre (fillStyle rgba(255, 255, 0, 0.3))

---

## 3. Critères d'Acceptation Techniques

### CA-01 : Rendu Canvas 19×19

✅ **GIVEN** un plateau vide  
✅ **WHEN** le composant Board.tsx monte  
✅ **THEN** un Canvas 19×19 est affiché avec grille complète et hoshi

**Validation** :
- Canvas dimensions calculées : min 360px (mobile), max 800px (desktop)
- Aspect ratio 1:1 maintenu (CSS `aspect-ratio: 1`)
- 19 lignes verticales + 19 lignes horizontales visibles
- 9 hoshi marqués (cercles remplis 4px rayon)

---

### CA-02 : Click Précis sur Intersection

✅ **GIVEN** un plateau vide  
✅ **WHEN** utilisateur clique à (clientX: 150px, clientY: 200px)  
✅ **THEN** coordonnées Go (x, y) calculées avec snap-to-grid ±5px tolérance

**Validation** :
- Fonction `pixelToGoCoord(e: MouseEvent, canvas: Canvas): Position`
- Retour `{ x: number [0-18], y: number [0-18] }`
- Clic hors plateau (marges) → ignoré
- Test : clic centre intersection (150, 200) → (7, 9) par exemple

---

### CA-03 : Alternance Automatique Noir/Blanc

✅ **GIVEN** un plateau avec coups [B(3,3), W(15,15), B(10,10)]  
✅ **WHEN** utilisateur clique (5,5)  
✅ **THEN** coup W(5,5) ajouté (couleur alternée)

**Validation** :
- `GameService.getNextColor(game: Game): Color`
- Logique : `game.rootMoves.length % 2 === 0 ? 'B' : 'W'`
- Persisté en Redux `game.current.rootMoves[]`

---

### CA-04 : Affichage Numéros de Coups

✅ **GIVEN** un plateau avec 10 coups  
✅ **WHEN** le plateau est rendu  
✅ **THEN** chaque pierre affiche son numéro (1, 2, 3... 10)

**Validation** :
- Numéro = `move.moveNumber`
- Police : 12px "Arial", centré sur pierre
- Couleur : inverse de la pierre (blanc sur noir, noir sur blanc)
- Anti-aliasing activé (`ctx.textBaseline = 'middle'`)

---

### CA-05 : Hover Feedback Temps Réel

✅ **GIVEN** un plateau actif  
✅ **WHEN** utilisateur survole intersection (12, 8)  
✅ **THEN** pierre fantôme affichée (opacity 0.5, couleur prochaine)

**Validation** :
- Event `onMouseMove` sur Canvas
- `hoverPosition` stocké en state local React
- Rendu conditionnel : `if (hoverPosition && !isOccupied(hoverPosition))`
- Refresh 60 FPS via `requestAnimationFrame`

---

### CA-06 : Validation Coup Légal

✅ **GIVEN** un plateau avec pierre en (10,10)  
✅ **WHEN** utilisateur clique (10,10)  
✅ **THEN** coup rejeté avec message "Intersection occupée"

**Validation** :
- `GameService.isValidMove(game, position): boolean`
- Checks :
  1. `x, y ∈ [0, 18]`
  2. Intersection vide : `boardState[x][y] === null`
  3. Pas de suicide simple (MVP : pas de validation ko/suicide)
- Toast/notification si coup invalide

---

### CA-07 : Undo Dernier Coup (Ctrl+Z)

✅ **GIVEN** un plateau avec 5 coups  
✅ **WHEN** utilisateur appuie Ctrl+Z  
✅ **THEN** coup #5 supprimé, plateau affiche 4 coups

**Validation** :
- Redux action `gameSlice.undoMove()`
- Supprime `game.rootMoves.pop()`
- Canvas re-rendu automatiquement (useEffect dependency)
- Limite : ne supprime pas coup #1 si c'est le dernier

---

### CA-08 : Navigation Coups (Prev/Next)

✅ **GIVEN** un plateau avec 20 coups, index actuel = 10  
✅ **WHEN** utilisateur clique "Suivant"  
✅ **THEN** plateau affiche état au coup 11

**Validation** :
- Redux state `game.currentMoveIndex`
- Actions : `setCurrentMoveIndex(index + 1)`, `setCurrentMoveIndex(index - 1)`
- Recalcule `boardState` via `GameService.getBoardState(game, index)`
- Boutons désactivés si index = 0 (prev) ou index = totalMoves (next)

---

### CA-09 : Highlight Dernier Coup

✅ **GIVEN** un plateau avec dernier coup en (15,3)  
✅ **WHEN** le plateau est rendu  
✅ **THEN** cercle rouge (stroke) autour pierre (15,3)

**Validation** :
- Logique : `lastMove = game.rootMoves[game.rootMoves.length - 1]`
- Canvas : `ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 2; ctx.stroke()`
- Highlight désactivé si navigation historique (currentIndex < totalMoves)

---

### CA-10 : Responsive Mobile/Desktop

✅ **GIVEN** un viewport 360px (mobile)  
✅ **WHEN** le composant Board monte  
✅ **THEN** Canvas redimensionné à 340px (padding 10px)

**Validation** :
- CSS : `max-width: 100%; aspect-ratio: 1;`
- Canvas `width` et `height` ajustés via `useEffect` + ResizeObserver
- Taille cellule recalculée : `cellSize = canvasWidth / 19`
- Touch events supportés : `onTouchStart` → converti en coordonnées Go

---

### CA-11 : Auto-save IndexedDB

✅ **GIVEN** un utilisateur place un coup  
✅ **WHEN** 500ms s'écoulent sans nouveau coup  
✅ **THEN** partie sauvegardée dans IndexedDB

**Validation** :
- Debounce 500ms : `useDebounce(game.current, 500)`
- Appel `StorageService.saveGame(game)`
- IndexedDB store `games` mis à jour
- `game.updatedAt` timestamp mis à jour

---

### CA-12 : Support Keyboard (Accessibility)

✅ **GIVEN** un utilisateur utilisant clavier  
✅ **WHEN** tabulation focus sur Canvas  
✅ **THEN** flèches directionnelles déplacent curseur virtuel

**Validation** :
- Event `onKeyDown` : ArrowUp, ArrowDown, ArrowLeft, ArrowRight
- State `keyboardCursor: Position | null`
- Enter → place coup à `keyboardCursor`
- Highlight curseur : carré jaune pointillé

---

### CA-13 : Rendu 60 FPS Garanti

✅ **GIVEN** un plateau avec 150 coups  
✅ **WHEN** utilisateur survole plateau (hover continu)  
✅ **THEN** framerate ≥ 60 FPS mesuré

**Validation** :
- Performance API : `performance.now()` delta < 16ms
- Optimisation : Canvas buffering (double buffering si nécessaire)
- Profiling Chrome DevTools : "Rendering" tab → FPS counter

---

### CA-14 : Memory Leak Free

✅ **GIVEN** 100 coups placés/annulés en boucle  
✅ **WHEN** Chrome DevTools Memory Profiler actif  
✅ **THEN** heap size stable (pas de croissance continue)

**Validation** :
- Cleanup `useEffect` : `return () => { ... }`
- Listeners retirés : `canvas.removeEventListener(...)`
- RequestAnimationFrame cancellé : `cancelAnimationFrame(rafId)`

---

### CA-15 : État Plateau Calculé Correctement

✅ **GIVEN** coups [B(3,3), W(15,15), B(3,4)]  
✅ **WHEN** `GameService.getBoardState(game, 2)` appelé  
✅ **THEN** retourne `board[3][3] = 'B', board[15][15] = 'W', autres = null`

**Validation** :
- Fonction pure : `getBoardState(game: Game, moveIndex: number): BoardState`
- Applique coups 0...moveIndex sequentiellement
- Retour : `BoardState { board: Color[][], moveCount, lastMove }`

---

### CA-16 : Gestion Touches Tactiles (Mobile)

✅ **GIVEN** utilisateur sur smartphone  
✅ **WHEN** touch sur intersection  
✅ **THEN** coup placé avec précision ±5px

**Validation** :
- Event `onTouchStart` converti : `e.touches[0].clientX/Y`
- Même logique `pixelToGoCoord()` que mouse
- Touch target min 44px (WCAG AA)
- Pas de conflit scroll/zoom : `touch-action: none` sur Canvas

---

### CA-17 : Affichage État Vide Initial

✅ **GIVEN** nouvelle partie créée  
✅ **WHEN** plateau rendu  
✅ **THEN** grille vide sans pierres, message "Cliquez pour placer coup Noir"

**Validation** :
- `game.rootMoves.length === 0`
- UI affiche indication couleur active : "Tour : Noir (coup 1)"
- Hover montre pierre noire fantôme

---

### CA-18 : Compatibilité Navigateurs

✅ **GIVEN** navigateurs Chrome, Firefox, Safari, Edge  
✅ **WHEN** application chargée  
✅ **THEN** Canvas fonctionne identiquement

**Validation** :
- Canvas API 2D : standard W3C (100% support)
- Test matrix :
  - Chrome 120+ ✅
  - Firefox 121+ ✅
  - Safari 17+ ✅
  - Edge 120+ ✅
- Fallback : message si Canvas non supporté (extrêmement rare)

---

## 4. Spécifications Canvas

### 4.1 Dimensions et Responsive

#### 4.1.1 Calcul Taille Canvas

```typescript
const calculateCanvasSize = (containerWidth: number): number => {
  const MIN_SIZE = 360; // Mobile minimum
  const MAX_SIZE = 800; // Desktop maximum
  const PADDING = 20;
  
  const size = Math.min(
    MAX_SIZE,
    Math.max(MIN_SIZE, containerWidth - PADDING)
  );
  
  return size;
};
```

#### 4.1.2 Taille Cellule Dynamique

```typescript
const cellSize = canvasSize / 19;
const stoneRadius = cellSize * 0.4;
const hoshiRadius = 4;
```

**Exemples** :
- Canvas 380px → cellSize = 20px → stoneRadius = 8px
- Canvas 760px → cellSize = 40px → stoneRadius = 16px

### 4.2 Rendering Pipeline

#### 4.2.1 Layers de Rendu

1. **Layer 1 - Background** : Fond beige bois
2. **Layer 2 - Grid** : Lignes 19×19 + bordure
3. **Layer 3 - Hoshi** : 9 points étoiles
4. **Layer 4 - Stones** : Pierres avec dégradés
5. **Layer 5 - Numbers** : Numéros coups
6. **Layer 6 - Highlights** : Dernière pierre, hover
7. **Layer 7 - Cursor** : Curseur clavier (optionnel)

#### 4.2.2 RequestAnimationFrame Loop

```typescript
useEffect(() => {
  let rafId: number;
  
  const render = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // Render layers
    drawBackground(ctx);
    drawGrid(ctx);
    drawHoshi(ctx);
    drawStones(ctx, moves.slice(0, currentMoveIndex + 1));
    drawMoveNumbers(ctx, moves.slice(0, currentMoveIndex + 1));
    drawHighlights(ctx);
    drawHover(ctx, hoverPosition);
    
    rafId = requestAnimationFrame(render);
  };
  
  render();
  
  return () => cancelAnimationFrame(rafId);
}, [moves, currentMoveIndex, hoverPosition]);
```

**Performance** :
- Render budget : < 16ms par frame (60 FPS)
- Optimisation : skip render si state unchanged (useMemo)

### 4.3 Fonctions de Rendu

#### 4.3.1 drawBackground

```typescript
const drawBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#D4A574'; // Beige bois
  ctx.fillRect(0, 0, canvasSize, canvasSize);
};
```

#### 4.3.2 drawGrid

```typescript
const drawGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  
  const offset = cellSize;
  const boardSize = cellSize * 18;
  
  // Vertical lines
  for (let i = 0; i < 19; i++) {
    const x = offset + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, offset);
    ctx.lineTo(x, offset + boardSize);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let i = 0; i < 19; i++) {
    const y = offset + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(offset, y);
    ctx.lineTo(offset + boardSize, y);
    ctx.stroke();
  }
};
```

#### 4.3.3 drawHoshi

```typescript
const HOSHI_POSITIONS = [
  [3, 3], [3, 9], [3, 15],
  [9, 3], [9, 9], [9, 15],
  [15, 3], [15, 9], [15, 15]
];

const drawHoshi = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#000000';
  
  HOSHI_POSITIONS.forEach(([x, y]) => {
    const px = cellSize + x * cellSize;
    const py = cellSize + y * cellSize;
    
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  });
};
```

#### 4.3.4 drawStones

```typescript
const drawStones = (
  ctx: CanvasRenderingContext2D,
  moves: Move[]
) => {
  moves.forEach(move => {
    const px = cellSize + move.x * cellSize;
    const py = cellSize + move.y * cellSize;
    
    // Gradient 3D effect
    const gradient = ctx.createRadialGradient(
      px - stoneRadius * 0.3,
      py - stoneRadius * 0.3,
      0,
      px,
      py,
      stoneRadius
    );
    
    if (move.color === 'B') {
      gradient.addColorStop(0, '#444444');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
    } else {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, '#CCCCCC');
      ctx.fillStyle = gradient;
      
      // White stone border
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 1;
    }
    
    ctx.beginPath();
    ctx.arc(px, py, stoneRadius, 0, Math.PI * 2);
    ctx.fill();
    
    if (move.color === 'W') {
      ctx.stroke();
    }
  });
};
```

#### 4.3.5 drawMoveNumbers

```typescript
const drawMoveNumbers = (
  ctx: CanvasRenderingContext2D,
  moves: Move[]
) => {
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  moves.forEach(move => {
    const px = cellSize + move.x * cellSize;
    const py = cellSize + move.y * cellSize;
    
    // Inverse color for readability
    ctx.fillStyle = move.color === 'B' ? '#FFFFFF' : '#000000';
    ctx.fillText(move.moveNumber.toString(), px, py);
  });
};
```

#### 4.3.6 drawHighlights

```typescript
const drawHighlights = (ctx: CanvasRenderingContext2D) => {
  if (lastMove) {
    const px = cellSize + lastMove.x * cellSize;
    const py = cellSize + lastMove.y * cellSize;
    
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, stoneRadius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
};
```

### 4.4 Conversion Coordonnées

#### 4.4.1 Pixel → Go Coordinates

```typescript
const pixelToGoCoord = (
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): Position | null => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Get client coordinates
  let clientX: number, clientY: number;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  
  // Canvas coordinates
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  
  // Go coordinates with snap-to-grid
  const x = Math.round((canvasX - cellSize) / cellSize);
  const y = Math.round((canvasY - cellSize) / cellSize);
  
  // Validate bounds
  if (x < 0 || x > 18 || y < 0 || y > 18) {
    return null;
  }
  
  return { x, y };
};
```

#### 4.4.2 Go → Pixel Coordinates

```typescript
const goCoordToPixel = (position: Position): { px: number; py: number } => {
  const px = cellSize + position.x * cellSize;
  const py = cellSize + position.y * cellSize;
  return { px, py };
};
```

---

## 5. Spécifications GameService

### 5.1 API Publique

```typescript
export class GameService {
  /**
   * Crée un nouveau jeu vide
   */
  static createGame(
    title: string,
    blackPlayer: string,
    whitePlayer: string,
    komi: number = 6.5
  ): Game;
  
  /**
   * Calcule l'état du plateau à un index de coup donné
   */
  static getBoardState(
    game: Game,
    moveIndex: number
  ): BoardState;
  
  /**
   * Valide si un coup est légal
   */
  static isValidMove(
    game: Game,
    position: Position
  ): boolean;
  
  /**
   * Ajoute un coup au jeu
   */
  static addMove(
    game: Game,
    position: Position
  ): Game;
  
  /**
   * Supprime le dernier coup
   */
  static undoMove(game: Game): Game;
  
  /**
   * Obtient la prochaine couleur à jouer
   */
  static getNextColor(game: Game): Color;
  
  /**
   * Vérifie si une intersection est occupée
   */
  static isOccupied(
    boardState: BoardState,
    position: Position
  ): boolean;
}
```

### 5.2 Implémentation Détaillée

#### 5.2.1 createGame

```typescript
static createGame(
  title: string,
  blackPlayer: string,
  whitePlayer: string,
  komi: number = 6.5
): Game {
  return {
    id: uuidv4(),
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    blackPlayer,
    whitePlayer,
    boardSize: 19,
    komi,
    handicap: 0,
    rootMoves: [],
    variants: [],
    event: null,
    date: null,
    result: null,
    comment: null,
    evaluations: []
  };
}
```

#### 5.2.2 getBoardState

```typescript
static getBoardState(
  game: Game,
  moveIndex: number
): BoardState {
  // Initialize empty board
  const board: (Color | null)[][] = Array(19)
    .fill(null)
    .map(() => Array(19).fill(null));
  
  // Apply moves up to moveIndex
  const moves = game.rootMoves.slice(0, moveIndex + 1);
  moves.forEach(move => {
    board[move.x][move.y] = move.color;
  });
  
  return {
    board,
    moveCount: moves.length,
    lastMove: moves.length > 0 ? moves[moves.length - 1] : null
  };
}
```

#### 5.2.3 isValidMove

```typescript
static isValidMove(
  game: Game,
  position: Position
): boolean {
  // Check bounds
  if (position.x < 0 || position.x > 18 || 
      position.y < 0 || position.y > 18) {
    return false;
  }
  
  // Check if occupied
  const boardState = this.getBoardState(
    game, 
    game.rootMoves.length - 1
  );
  
  if (boardState.board[position.x][position.y] !== null) {
    return false;
  }
  
  // MVP: Skip ko/suicide validation (Phase 2B)
  return true;
}
```

#### 5.2.4 addMove

```typescript
static addMove(
  game: Game,
  position: Position
): Game {
  const nextColor = this.getNextColor(game);
  const moveNumber = game.rootMoves.length + 1;
  
  const move: Move = {
    id: uuidv4(),
    moveNumber,
    color: nextColor,
    x: position.x,
    y: position.y,
    comment: null,
    symbols: null,
    variants: [],
    parentMoveId: null,
    createdAt: new Date()
  };
  
  return {
    ...game,
    rootMoves: [...game.rootMoves, move],
    updatedAt: new Date()
  };
}
```

#### 5.2.5 undoMove

```typescript
static undoMove(game: Game): Game {
  if (game.rootMoves.length === 0) {
    return game;
  }
  
  return {
    ...game,
    rootMoves: game.rootMoves.slice(0, -1),
    updatedAt: new Date()
  };
}
```

#### 5.2.6 getNextColor

```typescript
static getNextColor(game: Game): Color {
  return game.rootMoves.length % 2 === 0 ? 'B' : 'W';
}
```

#### 5.2.7 isOccupied

```typescript
static isOccupied(
  boardState: BoardState,
  position: Position
): boolean {
  return boardState.board[position.x][position.y] !== null;
}
```

---

## 6. Types TypeScript

### 6.1 Types Core (game.ts)

```typescript
export type Color = 'B' | 'W';
export type BoardSize = 19 | 13 | 9;

export interface Position {
  x: number; // 0-18
  y: number; // 0-18
}

export interface Move {
  id: string;
  moveNumber: number;
  color: Color;
  x: number;
  y: number;
  comment: string | null;
  symbols: Symbol;
  variants: Variant[];
  parentMoveId: string | null;
  createdAt: Date;
}

export interface BoardState {
  board: (Color | null)[][];
  moveCount: number;
  lastMove: Move | null;
}

export interface Game {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  
  blackPlayer: string;
  whitePlayer: string;
  
  boardSize: BoardSize;
  komi: number;
  handicap: number;
  
  rootMoves: Move[];
  variants: Variant[];
  
  event: string | null;
  date: string | null;
  result: string | null;
  comment: string | null;
  
  evaluations: Evaluation[];
}
```

### 6.2 Types Canvas/Board

```typescript
export interface CanvasCoordinates {
  px: number; // Pixel X
  py: number; // Pixel Y
}

export interface BoardDimensions {
  canvasSize: number;
  cellSize: number;
  stoneRadius: number;
  offset: number;
}

export interface RenderOptions {
  showMoveNumbers: boolean;
  showLastMoveHighlight: boolean;
  enableHover: boolean;
  theme: 'wood' | 'simple';
}
```

### 6.3 Types Redux State

```typescript
export interface GameState {
  current: Game | null;
  games: Game[];
  currentMoveIndex: number;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  boardDimensions: BoardDimensions | null;
  hoverPosition: Position | null;
  keyboardCursor: Position | null;
  showAnalysisPanel: boolean;
}
```

---

## 7. Tests Unitaires

### 7.1 GameService Tests

**Fichier** : `tests/unit/GameService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GameService } from '@/services/GameService';

describe('GameService', () => {
  describe('createGame', () => {
    it('should create a game with correct initial state', () => {
      const game = GameService.createGame(
        'Test Game',
        'Alice',
        'Bob'
      );
      
      expect(game.title).toBe('Test Game');
      expect(game.blackPlayer).toBe('Alice');
      expect(game.whitePlayer).toBe('Bob');
      expect(game.boardSize).toBe(19);
      expect(game.komi).toBe(6.5);
      expect(game.rootMoves).toEqual([]);
    });
  });
  
  describe('getBoardState', () => {
    it('should return empty board for new game', () => {
      const game = GameService.createGame('Test', 'A', 'B');
      const state = GameService.getBoardState(game, -1);
      
      expect(state.board.every(row => 
        row.every(cell => cell === null)
      )).toBe(true);
      expect(state.moveCount).toBe(0);
    });
    
    it('should return board with stones up to moveIndex', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      game = GameService.addMove(game, { x: 3, y: 3 });
      game = GameService.addMove(game, { x: 15, y: 15 });
      
      const state = GameService.getBoardState(game, 1);
      
      expect(state.board[3][3]).toBe('B');
      expect(state.board[15][15]).toBe('W');
      expect(state.moveCount).toBe(2);
    });
  });
  
  describe('isValidMove', () => {
    it('should reject out of bounds coordinates', () => {
      const game = GameService.createGame('Test', 'A', 'B');
      
      expect(GameService.isValidMove(game, { x: -1, y: 5 })).toBe(false);
      expect(GameService.isValidMove(game, { x: 5, y: 19 })).toBe(false);
      expect(GameService.isValidMove(game, { x: 20, y: 5 })).toBe(false);
    });
    
    it('should reject occupied intersections', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      game = GameService.addMove(game, { x: 10, y: 10 });
      
      expect(GameService.isValidMove(game, { x: 10, y: 10 })).toBe(false);
    });
    
    it('should accept valid empty intersection', () => {
      const game = GameService.createGame('Test', 'A', 'B');
      
      expect(GameService.isValidMove(game, { x: 5, y: 5 })).toBe(true);
    });
  });
  
  describe('getNextColor', () => {
    it('should return B for first move', () => {
      const game = GameService.createGame('Test', 'A', 'B');
      expect(GameService.getNextColor(game)).toBe('B');
    });
    
    it('should alternate colors correctly', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      
      game = GameService.addMove(game, { x: 0, y: 0 });
      expect(GameService.getNextColor(game)).toBe('W');
      
      game = GameService.addMove(game, { x: 1, y: 1 });
      expect(GameService.getNextColor(game)).toBe('B');
    });
  });
  
  describe('addMove', () => {
    it('should add move with correct properties', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      game = GameService.addMove(game, { x: 5, y: 10 });
      
      expect(game.rootMoves.length).toBe(1);
      expect(game.rootMoves[0].x).toBe(5);
      expect(game.rootMoves[0].y).toBe(10);
      expect(game.rootMoves[0].color).toBe('B');
      expect(game.rootMoves[0].moveNumber).toBe(1);
    });
    
    it('should increment move numbers', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });
      game = GameService.addMove(game, { x: 2, y: 2 });
      
      expect(game.rootMoves[0].moveNumber).toBe(1);
      expect(game.rootMoves[1].moveNumber).toBe(2);
      expect(game.rootMoves[2].moveNumber).toBe(3);
    });
  });
  
  describe('undoMove', () => {
    it('should remove last move', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      game = GameService.addMove(game, { x: 0, y: 0 });
      game = GameService.addMove(game, { x: 1, y: 1 });
      
      game = GameService.undoMove(game);
      
      expect(game.rootMoves.length).toBe(1);
      expect(game.rootMoves[0].x).toBe(0);
    });
    
    it('should handle undo on empty game', () => {
      let game = GameService.createGame('Test', 'A', 'B');
      game = GameService.undoMove(game);
      
      expect(game.rootMoves.length).toBe(0);
    });
  });
});
```

### 7.2 Board Utils Tests

**Fichier** : `tests/unit/boardUtils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { pixelToGoCoord, goCoordToPixel } from '@/utils/boardUtils';

describe('boardUtils', () => {
  describe('pixelToGoCoord', () => {
    it('should convert pixel to Go coordinates', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 380;
      
      const mockEvent = {
        clientX: 100,
        clientY: 100,
        target: canvas
      } as any;
      
      const coord = pixelToGoCoord(mockEvent, canvas);
      
      expect(coord).not.toBeNull();
      expect(coord!.x).toBeGreaterThanOrEqual(0);
      expect(coord!.x).toBeLessThanOrEqual(18);
    });
    
    it('should return null for out of bounds click', () => {
      const canvas = document.createElement('canvas');
      const mockEvent = {
        clientX: -10,
        clientY: 5
      } as any;
      
      const coord = pixelToGoCoord(mockEvent, canvas);
      expect(coord).toBeNull();
    });
  });
  
  describe('goCoordToPixel', () => {
    it('should convert Go coordinates to pixels', () => {
      const cellSize = 20;
      const { px, py } = goCoordToPixel({ x: 3, y: 5 }, cellSize);
      
      expect(px).toBe(cellSize + 3 * cellSize);
      expect(py).toBe(cellSize + 5 * cellSize);
    });
  });
});
```

---

## 8. Tests E2E

### 8.1 Playwright Tests

**Fichier** : `tests/e2e/board-interaction.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Board Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Create new game
    await page.click('button:has-text("Nouvelle Partie")');
    await page.fill('input[name="title"]', 'Test Game');
    await page.click('button:has-text("Créer")');
  });
  
  test('should display 19x19 board', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(300);
    expect(box!.height).toBeGreaterThan(300);
  });
  
  test('should place black stone on click', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Click center of canvas
    await canvas.click({ position: { x: 190, y: 190 } });
    
    // Verify move added (check UI indicator)
    await expect(page.locator('text=/Coup 1/')).toBeVisible();
    await expect(page.locator('text=/Tour : Blanc/')).toBeVisible();
  });
  
  test('should alternate colors', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Place 3 stones
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 200, y: 200 } });
    await canvas.click({ position: { x: 150, y: 150 } });
    
    await expect(page.locator('text=/Coup 3/')).toBeVisible();
    await expect(page.locator('text=/Tour : Blanc/')).toBeVisible();
  });
  
  test('should undo move with Ctrl+Z', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 200, y: 200 } });
    
    await expect(page.locator('text=/Coup 2/')).toBeVisible();
    
    // Undo
    await page.keyboard.press('Control+Z');
    
    await expect(page.locator('text=/Coup 1/')).toBeVisible();
  });
  
  test('should reject occupied intersection', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Place stone
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Try to place on same spot
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Should show error or stay at move 1
    await expect(page.locator('text=/Intersection occupée/'))
      .toBeVisible({ timeout: 2000 });
  });
  
  test('should navigate move history', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Place 5 stones
    for (let i = 0; i < 5; i++) {
      await canvas.click({ 
        position: { x: 100 + i * 20, y: 100 } 
      });
    }
    
    // Navigate back
    await page.click('button[aria-label="Coup précédent"]');
    await page.click('button[aria-label="Coup précédent"]');
    
    await expect(page.locator('text=/Coup 3/')).toBeVisible();
    
    // Navigate forward
    await page.click('button[aria-label="Coup suivant"]');
    
    await expect(page.locator('text=/Coup 4/')).toBeVisible();
  });
  
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    const box = await canvas.boundingBox();
    expect(box!.width).toBeLessThan(400);
    
    // Touch interaction
    await canvas.tap({ position: { x: 100, y: 100 } });
    await expect(page.locator('text=/Coup 1/')).toBeVisible();
  });
  
  test('should auto-save game', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Place move
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Wait for debounce (500ms)
    await page.waitForTimeout(600);
    
    // Reload page
    await page.reload();
    
    // Game should be loaded from IndexedDB
    await expect(page.locator('text=/Test Game/')).toBeVisible();
    await expect(page.locator('text=/Coup 1/')).toBeVisible();
  });
});
```

### 8.2 Visual Regression Tests

**Fichier** : `tests/e2e/board-visual.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Board Visual Regression', () => {
  test('should match empty board snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('button:has-text("Nouvelle Partie")');
    
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('empty-board.png');
  });
  
  test('should match board with stones snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // ... place some stones
    
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('board-with-stones.png');
  });
});
```

---

## 9. Performance Targets

### 9.1 Métriques Clés

| Métrique | Target | Mesure | Critique |
|---|---|---|---|
| **Frame Rate** | ≥ 60 FPS | Chrome DevTools FPS counter | ✅ Critique |
| **Render Time** | < 16ms | performance.now() delta | ✅ Critique |
| **Click Response** | < 100ms | Event → UI update | ✅ Critique |
| **Canvas Size** | 360-800px | Responsive calc | ⚠️ Important |
| **Memory Usage** | < 50 MB heap | Chrome Memory Profiler | ⚠️ Important |
| **Auto-save Latency** | < 500ms | IndexedDB write time | ℹ️ Nice-to-have |

### 9.2 Tests de Performance

#### 9.2.1 FPS Benchmark

```typescript
// tests/performance/fps-benchmark.ts
const measureFPS = (canvas: HTMLCanvasElement): Promise<number> => {
  return new Promise(resolve => {
    let frames = 0;
    const startTime = performance.now();
    
    const measure = () => {
      frames++;
      const elapsed = performance.now() - startTime;
      
      if (elapsed >= 1000) {
        resolve(frames);
      } else {
        requestAnimationFrame(measure);
      }
    };
    
    requestAnimationFrame(measure);
  });
};

test('should maintain 60 FPS with hover', async () => {
  const fps = await measureFPS(canvasElement);
  expect(fps).toBeGreaterThanOrEqual(60);
});
```

#### 9.2.2 Render Time Profiling

```typescript
const profileRender = () => {
  const start = performance.now();
  
  renderBoard(); // Main render function
  
  const end = performance.now();
  const renderTime = end - start;
  
  console.log(`Render time: ${renderTime.toFixed(2)}ms`);
  
  if (renderTime > 16) {
    console.warn('⚠️ Render budget exceeded!');
  }
};
```

### 9.3 Optimisations Prévues

1. **Canvas Buffering** : Off-screen canvas si render > 16ms
2. **Debounce Hover** : Limiter rafraîchissement hover à 30 FPS
3. **Memoization** : useMemo pour calculs coûteux (boardState)
4. **Lazy Rendering** : Skip render si state unchanged
5. **Web Workers** : Move calculs lourds hors main thread (Phase 2B)

---

## 10. Edge Cases

### 10.1 Cas Limites Fonctionnels

#### EC-01 : Clic sur Bordure Canvas

**Scenario** : Utilisateur clique en dehors de la grille 19×19 (marges)  
**Comportement attendu** : Click ignoré, aucun coup placé  
**Validation** : `pixelToGoCoord()` retourne `null`

---

#### EC-02 : Rapid Clicks (Double-click)

**Scenario** : Utilisateur double-clique rapidement sur intersection  
**Comportement attendu** : Un seul coup placé (debounce ou check occupé)  
**Validation** : Second click rejeté car intersection occupée

---

#### EC-03 : Resize Fenêtre Pendant Jeu

**Scenario** : Utilisateur redimensionne navigateur pendant partie  
**Comportement attendu** : Canvas resize, coups conservés, re-render OK  
**Validation** : ResizeObserver met à jour `canvasSize`, re-render propre

---

#### EC-04 : 361 Coups Placés (Plateau Plein)

**Scenario** : Toutes intersections occupées  
**Comportement attendu** : Aucune intersection cliquable, message "Plateau plein"  
**Validation** : `isValidMove()` retourne false pour toute intersection

---

#### EC-05 : Undo sur Nouveau Jeu Vide

**Scenario** : Ctrl+Z sur partie vierge (0 coups)  
**Comportement attendu** : Rien ne se passe, pas d'erreur  
**Validation** : `undoMove()` vérifie `game.rootMoves.length > 0`

---

#### EC-06 : Navigation Historique Hors Limites

**Scenario** : Utilisateur clique "Suivant" au dernier coup  
**Comportement attendu** : Bouton "Suivant" désactivé  
**Validation** : `currentMoveIndex === totalMoves - 1 → disabled`

---

#### EC-07 : Touch Event sur Desktop

**Scenario** : Hybride touch+mouse (Surface Pro, etc.)  
**Comportement attendu** : Touch et mouse fonctionnent tous deux  
**Validation** : `onMouseDown` et `onTouchStart` séparés, pas de conflit

---

#### EC-08 : Canvas Non Supporté (Vieux Navigateur)

**Scenario** : IE11 ou navigateur sans Canvas API  
**Comportement attendu** : Message fallback "Navigateur non supporté"  
**Validation** : Check `canvas.getContext('2d')` au mount, affiche erreur

---

### 10.2 Cas Limites Performance

#### EC-09 : 300+ Coups (Partie Longue)

**Scenario** : Partie avec 300 coups (jeu prolongé)  
**Comportement attendu** : FPS ≥ 60, render < 16ms  
**Validation** : Benchmark avec game.rootMoves.length = 300

---

#### EC-10 : Hover Continu Rapide

**Scenario** : Utilisateur bouge souris rapidement sur plateau  
**Comportement attendu** : Hover suit sans lag, 60 FPS maintenu  
**Validation** : Throttle hover à 30 FPS si nécessaire (optimisation)

---

#### EC-11 : Memory Leak après 1000 Coups

**Scenario** : Boucle place/undo 1000 fois  
**Comportement attendu** : Heap size stable, pas de croissance  
**Validation** : Chrome Memory Profiler, 3 snapshots (début/milieu/fin)

---

### 10.3 Cas Limites Accessibilité

#### EC-12 : Navigation Clavier Seul

**Scenario** : Utilisateur sans souris (keyboard-only)  
**Comportement attendu** : Curseur virtuel déplacé avec flèches, Enter pour placer  
**Validation** : Tester avec Tab, flèches, Enter → coup placé

---

#### EC-13 : Screen Reader

**Scenario** : Utilisateur aveugle avec NVDA/JAWS  
**Comportement attendu** : Canvas annoncé "Plateau Go 19×19, N coups"  
**Validation** : ARIA label dynamique, live region pour coups

---

## 11. Code Snippets Attendus

### 11.1 Board.tsx (Composant Principal)

```typescript
// src/components/Board.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addMove } from '@/store/slices/gameSlice';
import { GameService } from '@/services/GameService';
import {
  drawBackground,
  drawGrid,
  drawHoshi,
  drawStones,
  drawMoveNumbers,
  drawHighlights,
  drawHover
} from '@/utils/canvasUtils';
import { pixelToGoCoord } from '@/utils/boardUtils';
import type { Position } from '@/types/game';

export interface BoardProps {
  className?: string;
}

export const Board: React.FC<BoardProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null);
  const [canvasSize, setCanvasSize] = useState(760);
  
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game.current);
  const currentMoveIndex = useSelector(
    (state: RootState) => state.game.currentMoveIndex
  );
  
  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      
      const width = container.clientWidth;
      const size = Math.min(800, Math.max(360, width - 20));
      setCanvasSize(size);
    };
    
    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Render loop
  useEffect(() => {
    if (!game) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    const cellSize = canvasSize / 19;
    const moves = game.rootMoves.slice(0, currentMoveIndex + 1);
    const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;
    
    let rafId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      
      drawBackground(ctx, canvasSize);
      drawGrid(ctx, canvasSize, cellSize);
      drawHoshi(ctx, cellSize);
      drawStones(ctx, moves, cellSize);
      drawMoveNumbers(ctx, moves, cellSize);
      drawHighlights(ctx, lastMove, cellSize);
      drawHover(ctx, hoverPosition, cellSize, GameService.getNextColor(game));
      
      rafId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(rafId);
  }, [game, currentMoveIndex, hoverPosition, canvasSize]);
  
  // Click handler
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!game || !canvasRef.current) return;
    
    const position = pixelToGoCoord(e, canvasRef.current, canvasSize);
    if (!position) return;
    
    if (!GameService.isValidMove(game, position)) {
      console.warn('Invalid move:', position);
      return;
    }
    
    dispatch(addMove(position));
  };
  
  // Hover handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const position = pixelToGoCoord(e, canvasRef.current, canvasSize);
    setHoverPosition(position);
  };
  
  const handleMouseLeave = () => {
    setHoverPosition(null);
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className={className}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        border: '2px solid #333',
        borderRadius: '4px',
        cursor: 'crosshair',
        touchAction: 'none'
      }}
      aria-label={`Plateau Go 19×19, ${game?.rootMoves.length || 0} coups`}
    />
  );
};
```

### 11.2 gameSlice.ts (Redux)

```typescript
// src/store/slices/gameSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Game, Position } from '@/types/game';
import { GameService } from '@/services/GameService';

export interface GameState {
  current: Game | null;
  games: Game[];
  currentMoveIndex: number;
  loading: boolean;
  error: string | null;
}

const initialState: GameState = {
  current: null,
  games: [],
  currentMoveIndex: -1,
  loading: false,
  error: null
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentGame: (state, action: PayloadAction<Game>) => {
      state.current = action.payload;
      state.currentMoveIndex = action.payload.rootMoves.length - 1;
    },
    
    addMove: (state, action: PayloadAction<Position>) => {
      if (!state.current) return;
      
      state.current = GameService.addMove(state.current, action.payload);
      state.currentMoveIndex = state.current.rootMoves.length - 1;
    },
    
    undoMove: (state) => {
      if (!state.current) return;
      
      state.current = GameService.undoMove(state.current);
      state.currentMoveIndex = state.current.rootMoves.length - 1;
    },
    
    setCurrentMoveIndex: (state, action: PayloadAction<number>) => {
      if (!state.current) return;
      
      const maxIndex = state.current.rootMoves.length - 1;
      state.currentMoveIndex = Math.max(-1, Math.min(maxIndex, action.payload));
    },
    
    nextMove: (state) => {
      if (!state.current) return;
      
      const maxIndex = state.current.rootMoves.length - 1;
      if (state.currentMoveIndex < maxIndex) {
        state.currentMoveIndex++;
      }
    },
    
    previousMove: (state) => {
      if (state.currentMoveIndex > -1) {
        state.currentMoveIndex--;
      }
    }
  }
});

export const {
  setCurrentGame,
  addMove,
  undoMove,
  setCurrentMoveIndex,
  nextMove,
  previousMove
} = gameSlice.actions;

export default gameSlice.reducer;
```

### 11.3 boardUtils.ts (Helpers)

```typescript
// src/utils/boardUtils.ts
import type { Position } from '@/types/game';

export const pixelToGoCoord = (
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement,
  canvasSize: number
): Position | null => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  let clientX: number, clientY: number;
  
  if ('touches' in e) {
    if (e.touches.length === 0) return null;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  
  const cellSize = canvasSize / 19;
  const x = Math.round((canvasX - cellSize) / cellSize);
  const y = Math.round((canvasY - cellSize) / cellSize);
  
  if (x < 0 || x > 18 || y < 0 || y > 18) {
    return null;
  }
  
  return { x, y };
};

export const goCoordToPixel = (
  position: Position,
  cellSize: number
): { px: number; py: number } => {
  const px = cellSize + position.x * cellSize;
  const py = cellSize + position.y * cellSize;
  return { px, py };
};
```

---

## 12. Checklist Implémentation

### Phase 1 : Setup & Types

- [ ] Créer `src/types/game.ts` avec types Position, Move, BoardState, Game
- [ ] Créer `src/store/slices/gameSlice.ts` avec actions Redux
- [ ] Configurer Redux store dans `src/store/index.ts`

### Phase 2 : GameService

- [ ] Créer `src/services/GameService.ts`
- [ ] Implémenter `createGame()`
- [ ] Implémenter `getBoardState()`
- [ ] Implémenter `isValidMove()`
- [ ] Implémenter `addMove()`
- [ ] Implémenter `undoMove()`
- [ ] Implémenter `getNextColor()`

### Phase 3 : Board Utils

- [ ] Créer `src/utils/boardUtils.ts`
- [ ] Implémenter `pixelToGoCoord()`
- [ ] Implémenter `goCoordToPixel()`
- [ ] Créer `src/utils/canvasUtils.ts`
- [ ] Implémenter fonctions draw (background, grid, hoshi, stones...)

### Phase 4 : Board Component

- [ ] Créer `src/components/Board.tsx`
- [ ] Setup Canvas ref et sizing
- [ ] Implémenter render loop (requestAnimationFrame)
- [ ] Implémenter click handler
- [ ] Implémenter hover handler
- [ ] Implémenter touch support
- [ ] Ajouter responsive resize

### Phase 5 : Tests Unitaires

- [ ] Créer `tests/unit/GameService.test.ts`
- [ ] Tester tous les cas GameService (10+ tests)
- [ ] Créer `tests/unit/boardUtils.test.ts`
- [ ] Tester conversions coordonnées (5+ tests)

### Phase 6 : Tests E2E

- [ ] Créer `tests/e2e/board-interaction.spec.ts`
- [ ] Tester placement coups (5+ scenarios)
- [ ] Tester navigation historique
- [ ] Tester responsive mobile
- [ ] Tester auto-save

### Phase 7 : Performance

- [ ] Profiler FPS avec Chrome DevTools
- [ ] Mesurer render time (< 16ms)
- [ ] Test memory leak (100+ coups)
- [ ] Optimiser si nécessaire (buffering, memoization)

### Phase 8 : Accessibilité

- [ ] Ajouter ARIA labels
- [ ] Implémenter navigation clavier
- [ ] Tester avec NVDA/JAWS
- [ ] Vérifier contraste couleurs (WCAG AA)

### Phase 9 : Documentation

- [ ] Commenter code (JSDoc)
- [ ] Mettre à jour README.md
- [ ] Créer guide utilisateur Board
- [ ] Documenter API GameService

### Phase 10 : QA & Review

- [ ] Review code par @qa
- [ ] Fix bugs identifiés
- [ ] Validation tous critères acceptation (18/18 ✅)
- [ ] Merge vers main

---

## 📊 Résumé Exécutif

**User Story** : US-2 Board Interactif 19×19  
**Complexité** : Moyenne (5 story points)  
**Durée estimée** : 3-4 jours dev + 1 jour tests  

**Livrables** :
- ✅ Composant `Board.tsx` (Canvas 19×19)
- ✅ Service `GameService.ts` (logique métier)
- ✅ Redux `gameSlice.ts` (state management)
- ✅ Utils `boardUtils.ts` + `canvasUtils.ts`
- ✅ Tests unitaires (15+ tests)
- ✅ Tests E2E (8+ scenarios)
- ✅ Documentation complète

**Critères Succès** :
- ✅ 18/18 critères acceptation validés
- ✅ Performance 60 FPS garantie
- ✅ 100% coverage tests unitaires
- ✅ WCAG 2.1 AA accessible
- ✅ Responsive 360px → 1920px

**Prochaines Étapes** :
- Phase 2B : Variantes & Annotations
- Phase 2C : SGF Import/Export
- Phase 3A : KataGo Analysis

---

**Document créé par** : @specs  
**Pour implémentation par** : @dev  
**Validation par** : @qa  
**Date** : 3 février 2026
