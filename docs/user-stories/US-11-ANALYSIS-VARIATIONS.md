# US-11 : Visualiser les Variations Recommandées par KataGo

**User Story ID** : US-11  
**Phase** : Phase 3 - Intégration KataGo  
**Priorité** : Haute  
**Status** : 🚧 À implémenter  
**Date** : 8 février 2026

---

## Vue d'ensemble

Après une analyse de position avec KataGo, l'utilisateur peut cliquer sur les coups recommandés pour visualiser les **variantes estimées** (ligne de jeu principale PV).

---

## User Story

**En tant que** joueur Go,  
**Je veux** voir la ligne de jeu estimée (PV) pour chaque coup recommandé,  
**Afin que** je comprenne les conséquences stratégiques de chaque coup proposé par l'IA.

---

## Critères d'Acceptation

### CA-1 : Affichage PV sur plateau

- [ ] Sélectionner un coup dans la liste "Top Moves"
- [ ] Plateau affiche la **ligne de jeu complète (PV)** estimée par KataGo
- [ ] Les coups de la PV sont affichés de manière différente (couleur/opacité/annotations)
- [ ] La PV peut avoir jusqu'à 20-30 coups estimés

### CA-2 : Navigation dans la PV

- [ ] Boutons "Coup Précédent" / "Coup Suivant" pour naviguer la PV
- [ ] Affichage position courante dans la PV (ex: "4/15 coups")
- [ ] Retour au plateau principal en cliquant un bouton "Retour"

### CA-3 : Heatmap dynamique

- [ ] La **policy heatmap** se met à jour pendant la navigation PV
- [ ] La **ownership map** reflète l'état du terrain à chaque étape

### CA-4 : Format d'affichage

- [ ] PV affichée avec numérotation des coups (ex: 1, 2, 3... en bleu )
- [ ] Notifications/badges pour chaque coup :
  - Winrate estimé après ce coup
  - Score estimé
- [ ] Tooltip au survol d'un coup de la PV

### CA-5 : Gestion d'erreurs

- [ ] Si PV invalide → message d'erreur "Position invalide"
- [ ] Si PV n'est pas calculée → message "PV non disponible pour ce coup"

---

## Implémentation Attendue

### 1. Types TypeScript

```typescript
// src/types/katago.ts - Extension

export interface KataGoAnalysisResult {
  // ... existing fields ...
  
  /** Ligne principale estimée (PV) pour chaque top move */
  variationPVs: {
    move: Position;  // Coup clé
    pv: Move[];      // Séquence de 15-30 coups estimés
    pvWinrates: number[];  // Winrate après chaque coup du PV
  }[];
}
```

### 2. Composant Variation

```typescript
// src/components/VariationViewer.tsx

export interface VariationViewerProps {
  moves: Move[];
  winrates: number[];
  onClose: () => void;
  onMoveClick?: (index: number) => void;
}

export const VariationViewer: React.FC<VariationViewerProps> = ({
  moves,
  winrates,
  onClose,
  onMoveClick,
}) => {
  // Affiche PV avec navigation +/-
  // Affiche numérotation des coups
  // Affiche winrates changement
};
```

### 3. Intégration AnalysisPanel

```typescript
// src/components/AnalysisPanel.tsx - Modification

const handleShowVariation = (pvIndex: number) => {
  const pv = result.variationPVs[pvIndex];
  setSelectedVariation(pv);  // Affiche VariationViewer modal
};
```

---

## Données Exemple

```
Position analysée: d3, d4, d5

Analysis Result:
{
  moveInfos: [
    { move: {x: 3, y: 16}, winrate: 0.62, visits: 280, ... },
  ],
  variationPVs: [
    {
      move: {x: 3, y: 16},
      pv: [
        {x: 3, y: 16}, // Move 1 (Noir)
        {x: 16, y: 3}, // Move 2 (Blanc)
        {x: 3, y: 3},  // Move 3 (Noir)
        // ... 12 coups supplémentaires
      ],
      pvWinrates: [0.62, 0.61, 0.62, 0.63, ...]
    }
  ]
}
```

---

## Acceptance Criteria Techniques

- **Performance** : Affichage PV < 100ms après clic
- **Memory** : Pas de leak si navigation lente (100+ variations)
- **Accessibility** : Keyboard navigation dans PV (arrows, Enter)
- **Responsive** : Visible sur 360px - 1920px
- **Tests** : ≥ 5 tests E2E pour workflow complet

---

## Points d'Intégration

1. **KataGoService** : Générer PVs dans simulation (ou Web Worker)
2. **AnalysisPanel** : Ajouter listener "Montrer PV"
3. **Board** : Afficher PV stones avec styling distinctif
4. **Redux** : State `selectedVariation` optionnel

---

## Blockers / Dépendances

- ✅ KataGoService.analyzePosition() déjà implémenté
- ✅ Board rendering capable d'afficher pierres
- ⏳ Besoin d'étendre `KataGoAnalysisResult` avec champs PV

---

## Points d'Extension Futur (v2.0)

- Sauvegarder PVs favoris dans IndexedDB
- Analyser PV complète (ex: positions intermédiaires)
- Comparer 2 PVs côte à côte
- Exporter PV dans SGF

---

## Notes QA

- Tester avec board vide (pas de PV)
- Tester avec 100 coups estimés dans PV
- Tester navigation rapide (rafales clicks)
- Tester offline (cache)
