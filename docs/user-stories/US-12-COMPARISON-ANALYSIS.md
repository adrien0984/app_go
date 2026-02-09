# US-12 : Comparer Plusieurs Positions Analysées

**User Story ID** : US-12  
**Phase** : Phase 3 - Intégration KataGo  
**Priorité** : Moyenne  
**Status** : 🚧 À implémenter  
**Date** : 8 février 2026

---

## Vue d'ensemble

Permettre à l'utilisateur de **comparer les résultats d'analyse** de deux ou plusieurs positions côte à côte : winrate, score estimé, top moves.

---

## User Story

**En tant que** joueur Go étudiant des parties,  
**Je veux** comparer les analyses de plusieurs positions d'une partie,  
**Afin que** j'identifie les positions clés où la partie s'est décidée.

---

## Critères d'Acceptation

### CA-1 : Interface de comparaison

- [ ] Bouton "Comparer" dans AnalysisPanel
- [ ] Sélectionner 2-4 positions pour comparer
- [ ] Affichage panel "Comparaison" avec tableau côte-à-côte
- [ ] Colonnes : Position | Winrate N | Winrate B | Score | Meilleur coup

### CA-2 : Métriques affichées

```
Position  | N Winrate | B Winrate | Score | Meilleur Coup
────────────────────────────────────────────────────────────
Coup 1    | 45%       | 55%       | B+3.5 | D16
Coup 10   | 58%       | 42%       | N+2.1 | E17
Coup 20   | 62%       | 38%       | N+4.3 | C3
```

### CA-3 : Sélection positions

- [ ] Checkboxes pour coups à comparer (1 à 20)
- [ ] Récupérer analyses depuis **IndexedDB** (cache)
- [ ] Afficher badge "En cache" vs "À analyser"
- [ ] Si position non analysée → bouton "Analyser"

### CA-4 : Export comparaison

- [ ] Bouton "Exporter CSV" pour tableau
- [ ] Bouton "Imprimer" pour rapport PDF
- [ ] Bouton "Copier tableau" (clipboard)

### CA-5 : Visualisation graphique

- [ ] Graphe "Winrate par coup" (ligne continue)
- [ ] Graphe "Score par coup" (colonne stacked)
- [ ] Legend avec couleurs Noir/Blanc
- [ ] Zoom & pan interactif

---

## Implémentation Attendue

### 1. Composant ComparisonPanel

```typescript
// src/components/ComparisonPanel.tsx

export interface ComparisonViewerProps {
  gameId: string;
  selectedMoveIndexes: number[];
  analyses: Map<number, KataGoAnalysisResult>;
  onClose: () => void;
}

export const ComparisonPanel: React.FC<ComparisonViewerProps> = ({
  gameId,
  selectedMoveIndexes,
  analyses,
  onClose,
}) => {
  // Affiche tableau comparat if
  // Affiche graphiques
  // Gestion export
};
```

### 2. Intégration GameEditor

```typescript
// src/components/GameEditor.tsx - Modification

const [compareMode, setCompareMode] = useState(false);
const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);

const handleToggleComparison = (moveIndex: number) => {
  setSelectedForComparison(prev => 
    prev.includes(moveIndex) 
      ? prev.filter(i => i !== moveIndex)
      : [...prev, moveIndex]
  );
};
```

### 3. Format données

```typescript
export interface ComparisonRecord {
  moveIndex: number;
  moveNotation: string;  // "D3", "Q16", etc.
  blackWinrate: number;
  whiteWinrate: number;
  scoreEstimate: number;
  topMove: string;
  analyzed: boolean;
  timestamp?: Date;
}
```

---

## Données Exemple

**Partie**: 25 coups analysés

| Coup | Noir WR | Blanc WR | Score | Meilleur Coup | Status |
|------|---------|----------|-------|---------------|--------|
| 1    | 45%     | 55%      | B+3.2 | D4            | Cache  |
| 5    | 52%     | 48%      | N+1.1 | E17           | Cache  |
| 10   | 61%     | 39%      | N+4.5 | C3            | Cache  |
| 15   | 68%     | 32%      | N+6.8 | A18           | Cache  |
| 20   | 55%     | 45%      | N+2.1 | K10           | Cache  |

**Graphique Winrate** :
```
100% │
     │     ╱╲
  50% │────╱  ╲
     │        ╲
   0% │         ╲
     └──────────────
     1   5  10 15 20
```

---

## Points d'Intégration

1. **AnalysisPanel** : Bouton "Comparer"
2. **Redux `evaluationsSlice`** : Récupérer analyses cachées
3. **StorageService** : Charger analyses depuis IndexedDB
4. **Chart.js** ou D3.js : Graphiques interactifs

---

## Blockers / Dépendances

- ✅ Analyses déjà sauvegardées en IndexedDB (evaluations store)
- ✅ AnalysisPanel fournit les résultats
- ⏳ Besoin Chart library (Chart.js recommandé)

---

## Notes QA

- Tester avec 2, 4, 10 positions
- Tester export CSV sur position sans analyses
- Tester responsive (mobile: 360px)
- Tester graphe avec des variations extrêmes (0% vs 100%)

---

## Performance Targets

- Rendu tableau < 50ms
- Graphe interactif < 200ms
- Export PDF < 2s

---

## Acceptance Criteria Techniques

- **Tests E2E** : ≥ 4 scénarios de comparaison
- **Accessibility** : Tableaux avec headers ARIA
- **Mobile** : Tableau scrollable horizontalement
- **Offline** : Fonctionne si analyses en cache
