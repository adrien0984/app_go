# BUGS TRACKER - GoAI Editor

**Projet** : GoAI Editor MVP  
**Responsable** : @qa  
**Date création** : 3 février 2026

---

## 📊 Statistiques

**Au 3 février 2026** :

| Severity | Ouverts | Résolus | Total |
|---|---|---|---|
| 🔴 **Critical** | 0 | 0 | 0 |
| 🟠 **Major** | 0 | 0 | 0 |
| 🟡 **Minor** | 3 | 0 | 3 |
| **TOTAL** | **3** | **0** | **3** |

---

## 🔴 CRITICAL (0)

**Définition** : App inutilisable, data loss, security issue

Aucun bug critique actuellement.

---

## 🟠 MAJOR (0)

**Définition** : Feature principale cassée, workaround complexe

Aucun bug majeur actuellement.

---

## 🟡 MINOR (3)

**Définition** : UX dégradée, workaround simple, cosmétique

### 🟡 Bug #001 : canvasUtils.test.ts Manquant

**Titre** : Fichier test manquant pour canvasUtils.ts  
**Component** : tests/unit/canvasUtils.test.ts  
**Severity** : 🟡 **MINOR**  
**Status** : ⏳ **À FAIRE** (Phase 2B)  
**Reporter** : @qa  
**Date** : 3 février 2026

**Description** :
Fichier `tests/unit/canvasUtils.test.ts` non créé selon checklist. Devrait tester les fonctions de rendu Canvas (drawBackground, drawGrid, drawHoshi, drawStones, drawMoveNumbers, drawHighlights, drawHover).

**Implémentation Attendue** :
```typescript
// tests/unit/canvasUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  drawBackground,
  drawGrid,
  drawHoshi,
  drawStones,
  drawMoveNumbers,
  drawHighlights,
  drawHover
} from '@/utils/canvasUtils';

describe('canvasUtils', () => {
  // Tests pour chaque fonction de rendu
});
```

**Impact** : 
- ❌ Pas de couverture tests unitaires pour drawing functions
- ✅ Couvert par 32 tests E2E Playwright (non-bloquant)

**Workaround** :
- Tests E2E board.spec.ts couvrent visually toutes les fonctions
- Screenshots verification incluse dans E2E

**Resolution Timeline** : Phase 2B (après release MVP)  
**Priority** : Basse (E2E coverage suffisante pour MVP)

**Steps to Reproduce** :
```bash
ls tests/unit/
# manquant : canvasUtils.test.ts
```

**Expected** : Fichier presente avec ≥ 15 tests

**Notes** :
- Non-bloquant pour MVP (E2E couvre)
- À ajouter pour complétude suite tests v1.1

---

### 🟡 Bug #002 : Auto-save Debounce Non Implémenté

**Titre** : CA-11 Auto-save debounce 500ms manquant  
**Component** : src/components/Board.tsx (useEffect hook)  
**Severity** : 🟡 **MINOR**  
**Status** : ⏳ **À FAIRE** (Phase 2B)  
**Reporter** : @qa  
**Date** : 3 février 2026

**Description** :
Critère CA-11 spécifie : "Après 500ms sans nouveau coup → sauvegarde IndexedDB avec debounce".
Actuellement : Redux state managé, mais appel StorageService non débounced.

**Impact** :
- Sauvegarde peut être appelée trop fréquemment (à chaque coup)
- Performance OK (non bloquant)
- StorageService.saveGame() async, pas de lag visible

**Implémentation Attendue** :
```typescript
// src/hooks/useDebounce.ts
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// src/components/Board.tsx
const debouncedGame = useDebounce(game, 500);

useEffect(() => {
  StorageService.saveGame(debouncedGame);
}, [debouncedGame]);
```

**Workaround** :
- MVP fonctionne sans debounce (données sauvegardées)
- Légère duplication appels au storage (non critique)

**Resolution Timeline** : Phase 2B  
**Priority** : Basse (MVP fonctionne)

**Notes** :
- StorageService.saveGame() déjà implémenté
- Hook useDebounce facile à ajouter
- À l'agenda Phase 2B

---

### 🟡 Bug #003 : Keyboard Navigation Non Activée

**Titre** : CA-12 Navigation clavier (flèches) commentée/désactivée  
**Component** : src/components/Board.tsx (line ~100-110)  
**Severity** : 🟡 **MINOR**  
**Status** : ⏳ **INTENTIONNEL** (TODO Phase 2B)  
**Reporter** : @qa  
**Date** : 3 février 2026

**Description** :
Code présent mais commenté dans Board.tsx :
```typescript
// Navigation clavier (MVP v1.0 : disabled pour cette version)
// TODO: Implémenter en Phase 2B
// if (e.key === 'ArrowUp') setKeyboardCursor(...);
```

Feature optionnelle pour MVP v1.0. Utilisateurs peuvent utiliser souris/touch.

**Implémentation Attendue** :
```typescript
// src/components/Board.tsx
if (e.key === 'ArrowUp') {
  setKeyboardCursor(prev => 
    prev ? { x: prev.x, y: Math.max(0, prev.y - 1) } : { x: 9, y: 9 }
  );
  e.preventDefault();
}
// etc. pour Down, Left, Right, Enter
```

**Impact** :
- ❌ Pas d'accès clavier pour placement coups
- ✅ Souris/touch disponibles (accessibility minimale)
- ✅ Ctrl+Z fonctionne (undo clavier)

**Workaround** :
- Utiliser souris ou touch
- Ctrl+Z pour undo disponible
- MVP acceptable sans nav clavier

**Resolution Timeline** : Phase 2B (optionnel, low-impact)  
**Priority** : Très basse (non-essentiel MVP)

**Notes** :
- Feature marquée "optionnel v1.0"
- Code framework 90% prêt (juste à uncomment)
- À activer en Phase 2B si temps

---

## ✅ RÉSOLU (0)

Aucun bug résolu pour le moment (projet en Phase 1).

---

## 📝 Template Bug Report

```markdown
## Bug #XXX: [Titre Court]

**Date** : JJ mois AAAA
**Reporter** : @qa
**Severity** : 🔴 Critical / 🟠 Major / 🟡 Minor
**Status** : 🔓 Open / 🔒 In Progress / ✅ Resolved

### Description

Description claire du bug observé.

### Reproduction Steps

1. Étape 1
2. Étape 2
3. Étape 3

### Expected Behavior

Comportement attendu.

### Actual Behavior

Comportement observé.

### Environment

- **Browser** : Chrome 120
- **OS** : Windows 11
- **Screen** : Desktop 1920×1080
- **Network** : Online / Offline

### Screenshots

[Screenshot if applicable]

### Logs

```
Error logs pertinents
```

### Impact

- **Users affected** : X%
- **Workaround** : Oui/Non - Description

### Priority

- [ ] P0 : Fix immédiat (blocker release)
- [ ] P1 : Fix this sprint
- [ ] P2 : Fix next sprint
- [ ] P3 : Backlog

### Assigned To

@dev

### Related

- Issue #XX
- Commit abc123
- PR #XX

---

**Created** : JJ mois AAAA by @qa
**Updated** : JJ mois AAAA
**Resolved** : JJ mois AAAA (if resolved)
```

---

## 🔍 Bug Triage Process

### 1. Identification
- @qa découvre bug (tests ou user report)
- Créer entrée BUGS.md
- Assigner severity

### 2. Priorisation
- **Critical** : Fix immédiat (@dev notifié)
- **Major** : Fix dans les 48h
- **Minor** : Fix dans sprint actuel ou backlog

### 3. Assignment
- @qa assigne à @dev
- @orchestrator valide priorité si conflit

### 4. Fix
- @dev créer branch `fix/bug-XXX`
- Implémenter fix
- Tests non-régression
- Commit avec ref `Fix #XXX`

### 5. Validation
- @qa re-test bug
- Si résolu → ✅ Close
- Si non résolu → Iterate

### 6. Documentation
- Update BUGS.md status
- CHANGELOG.md entry
- Git commit

---

## 📈 Métriques Qualité

**Targets** :

| Métrique | v1.0 Target | v2.0 Target |
|---|---|---|
| **Critical bugs** | 0 | 0 |
| **Major bugs** | < 3 | < 2 |
| **Minor bugs** | < 10 | < 5 |
| **Time to fix (Critical)** | < 24h | < 12h |
| **Time to fix (Major)** | < 48h | < 24h |
| **Time to fix (Minor)** | < 7 days | < 3 days |

---

## 🛡️ Prevention

### Code Review
- Mandatory @orchestrator review avant merge
- @qa validation systématique

### Testing
- Unit tests (Vitest) > 80% coverage
- E2E tests (Playwright) workflows critiques
- Performance tests (Lighthouse)

### Monitoring
- Error tracking (v1.1+ : Sentry)
- Analytics (privacy-first)

---

## 🔗 Related Documents

- [QA-REPORTS.md](QA-REPORTS.md) : Rapports validation features
- [CHANGELOG.md](CHANGELOG.md) : Historique changements
- [.agents/PHASES.md](.agents/PHASES.md) : Planning phases

---

**Dernière mise à jour** : 3 février 2026 by @qa  
**Prochaine révision** : 10 février 2026 (fin Phase 2A)
