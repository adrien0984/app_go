# US-13 : Historique Persistant des Analyses

**User Story ID** : US-13  
**Phase** : Phase 3 - Intégration KataGo  
**Priorité** : Moyenne  
**Status** : 🚧 À implémenter  
**Date** : 8 février 2026

---

## Vue d'ensemble

Sauvegarder et afficher l'**historique complet des analyses** effectuées sur une partie : dates, paramètres, résultats.

---

## User Story

**En tant que** joueur Go faisant de longues études,  
**Je veux** voir l'historique de toutes les analyses que j'ai effectuées,  
**Afin que** je puisse comparer comment mes évaluations ont changé et identifier les positions critiques.

---

## Critères d'Acceptation

### CA-1 : Enregistrement analyses

- [ ] Chaque `analyzePosition()` crée un enregistrement d'historique
- [ ] Historique inclut :
  - Coup analysé (coordonnées + numéro)
  - Profil utilisé (fast/standard/pro)
  - Timestamp de l'analyse
  - Résultat complet (winrate, score, top moves)
  - Version KataGo utilisée (metadata)
  - Durée de l'analyse (ms)

### CA-2 : Affichage historique

- [ ] Sidebar "Historique Analyses" en bas du panel d'analyse
- [ ] Liste chronologique inversée (analyses les plus récentes en haut)
- [ ] Affichage discrètement :
  ```
  [12:45] Position D3 (fast) — N 58% | B 42% | +2.1
  [12:40] Position E17 (standard) — N 62% | B 38% | +3.5
  [12:35] Position C3 (pro) — N 72% | B 28% | +6.2
  ```

### CA-3 : Actions historique

- [ ] Clic sur ligne = recharge résultat analyse
- [ ] Bouton "Recharger" = ré-analyse avec même config
- [ ] Bouton "Supprimer" = retire de l'historique
- [ ] Badge "Ancienne" si analyse > 7 jours (option "Mettre à jour")

### CA-4 : Export historique

- [ ] Bouton "Exporter histoire partieJSON"
- [ ] Export inclut toutes les analyses + métadonnées
- [ ] Format: `{ gameId, analyses: [...], exportDate }`
- [ ] Import possible dans une autre partie

### CA-5 : Gestion stockage

- [ ] Limite de 100 analyses par partie (anciennes supprimées auto)
- [ ] Limite de 50 MB total IndexedDB pour toutes analyses
- [ ] Compression: déduplication si analyses identiques

### CA-6 : Dashboard analyse

- [ ] Statistiques historique :
  - Nombre total analyses : **N**
  - Profil le plus utilisé : **fast/standard/pro**
  - Winrate moyen : **N: XX%, B: YY%**
  - Position la plus analysée : **coordonnées**
  - Durée moyenne : **XXXms**

---

## Implémentation Attendue

### 1. Types TypeScript

```typescript
// src/types/katago.ts - Extension

export interface AnalysisHistoryEntry {
  id: string;  // UUID
  gameId: string;
  moveIndex: number;
  moveNotation: string;
  profile: AnalysisProfileId;
  timestamp: Date;
  analysisTime: number;  // ms
  result: KataGoAnalysisResult;
  katagoVersion?: string;
  notes?: string;
}

export interface AnalysisHistory {
  gameId: string;
  entries: AnalysisHistoryEntry[];
  totalAnalyses: number;
  lastAnalysis?: AnalysisHistoryEntry;
}
```

### 2. Extension Store Redux

```typescript
// src/store/slices/analysisHistorySlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AnalysisHistoryEntry } from '@/types/katago';

export const analysisHistorySlice = createSlice({
  name: 'analysisHistory',
  initialState: new Map<string, AnalysisHistoryEntry[]>(),  // gameId -> entries
  
  reducers: {
    addAnalysisEntry: (state, action: PayloadAction<AnalysisHistoryEntry>) => {
      const { gameId, entries } = action.payload;
      // ... ajouter à historique et limiter à 100
    },
    
    clearHistoryForGame: (state, action: PayloadAction<string>) => {
      state.delete(action.payload);  // gameId
    },
    
    updateHistoryEntry: (state, action: PayloadAction<AnalysisHistoryEntry>) => {
      // ... merger analyses
    },
    
    deleteHistoryEntry: (state, action: PayloadAction<{gameId: string, entryId: string}>) => {
      // ... supprimer une entrée
    },
  },
});
```

### 3. Composant AnalysisHistory

```typescript
// src/components/AnalysisHistory.tsx

export interface AnalysisHistoryProps {
  gameId: string;
  onSelect: (entry: AnalysisHistoryEntry) => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  gameId,
  onSelect,
}) => {
  // Affiche liste historique
  // Actions (recharger, supprimer, exporter)
  // Statistiques résumés
};
```

### 4. Extension StorageService

```typescript
// src/services/StorageService.ts - Modification

public async getGameAnalysisHistory(gameId: string): Promise<AnalysisHistoryEntry[]> {
  // Récupère toutes analyses pour un jeu
}

public async saveAnalysisEntry(entry: AnalysisHistoryEntry): Promise<void> {
  // Ajoute entrée à analysisHistory store
}

public async deleteAnalysisEntry(gameId: string, entryId: string): Promise<void> {
  // Supprime une analyse
}

public async exportAnalysisHistory(gameId: string): Promise<string> {
  // Exporte JSON pour partage/backup
}
```

### 5. Extension KataGoService

```typescript
// src/services/KataGoService.ts - Modification

private async recordAnalysis(
  gameId: string,
  moveIndex: number,
  result: KataGoAnalysisResult,
  profile: AnalysisProfileId
): Promise<AnalysisHistoryEntry> {
  const entry: AnalysisHistoryEntry = {
    id: uuidv4(),
    gameId,
    moveIndex,
    moveNotation: result.moveInfos[0]?.moveSGF || '?',
    profile,
    timestamp: new Date(),
    analysisTime: result.analysisTime,
    result,
    katagoVersion: this.version,
  };
  
  // Sauvegarder
  await StorageService.saveAnalysisEntry(entry);
  
  // Dispatcher Redux
  dispatch(addAnalysisEntry(entry));
  
  return entry;
}
```

---

## Intégration AnalysisPanel

```typescript
// src/components/AnalysisPanel.tsx - Modification

const history = useSelector((state: RootState) => 
  state.analysisHistory.get(game?.id)
);

useEffect(() => {
  // Afficher historique après chaque analyse
  if (result && game) {
    const entry = recordAnalysisEntry(game.id, currentMoveIndex, result);
    // Mise à jour UI automatique via Redux
  }
}, [result]);

// Render:
<div className="analysis-history-section">
  {history && (
    <AnalysisHistory
      gameId={game.id}
      history={history}
      onSelect={handleReloadAnalysis}
    />
  )}
</div>
```

---

## Données Stockage IndexedDB

### Store: `analysisHistory`

```
{
  id: "uuid-1",
  gameId: "game-abc",
  moveIndex: 3,
  moveNotation: "D3",
  profile: "standard",
  timestamp: 2026-02-08T12:45:00Z,
  analysisTime: 1500,
  result: {
    id: "result-1",
    rootInfo: { winrate: 0.58, scoreLead: 2.1 },
    moveInfos: [...],
    policy: [...],
    ownership: [...],
    confidence: 0.95,
    analysisTime: 1500
  },
  katagoVersion: "1.0 MVP",
  notes: "Début de partie standard"
}
```

---

## Points d'Intégration

1. **Redux** : Nouveau slice `analysisHistorySlice`
2. **StorageService** : Store `analysisHistory` dans IndexedDB
3. **KataGoService** : Enregistrement auto après chaque analyse
4. **AnalysisPanel** : Affichage historique sidebar
5. **GameEditor** : Intégration cleanup (supprimer historique au delete)

---

## Blockers / Dépendances

- ✅ IndexedDB déjà configuré (StorageService)
- ✅ Redux store configuré (gameSlice, etc.)
- ⏳ Besoin nouvelle slice Redux `analysisHistorySlice`
- ⏳ Besoin nouvelles tables IndexedDB

---

## Notes QA

- Tester limite 100 analyses (anciennes supprimées)
- Tester export JSON valide
- Tester offline (historique en cache)
- Tester suppression partie = cleanup historique
- Tester réponse temps requête historique (< 100ms)

---

## Performance Targets

- Chargement historique < 50ms
- Sauvegarde analyse < 100ms
- Affichage liste < 30ms (lazy load si 100+ items)

---

## Acceptance Criteria Techniques

- **Tests Unitaires** : ≥ 8 tests pour StorageService historique
- **Tests E2E** : ≥ 5 scénarios workflows complets
- **Memory** : Pas de leak avec 100+ analyses
- **Offline** : Fonctionne complètement offline
- **Concurrency** : Gère analyses simultanées sans crash

---

## Extension Futur (v2.0)

- Synchroniser historique avec cloud (IndexedDB Sync API)
- Partager historique avec d'autres joueurs
- Statistiques détaillées par session
- Graphe évolution winrate partie
