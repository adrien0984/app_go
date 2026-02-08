# SYSTÈME MULTI-AGENTS - GoAI Editor

## 🎯 Vue d'Ensemble

Le projet GoAI Editor utilise une **architecture multi-agents spécialisés** pour maximiser l'efficacité, la qualité et la scalabilité du développement.

### Principes de Conception

1. **Séparation des préoccupations** : Chaque agent a un rôle unique et bien défini
2. **Parallélisation** : Les agents travaillent en parallèle quand possible
3. **Spécialisation** : Chaque agent est expert dans son domaine
4. **Coordination** : L'orchestrateur assure la cohérence globale
5. **Traçabilité** : Tous les artifacts sont versionnés et documentés

---

## 👥 LES 4 AGENTS

### 1️⃣ Agent Orchestrateur (Chef de Projet)

**Rôle** : Coordination générale, décisions stratégiques, gestion phases

**Responsabilités** :
- Planifier les phases de développement
- Prioriser les tâches
- Gérer les risques et blockers
- Coordonner les autres agents
- Valider les livrables
- Maintenir la roadmap

**Outils** :
- `manage_todo_list` : Gestion tâches projet
- `semantic_search` : Recherche dans codebase
- `get_changed_files` : Tracking changements
- Accès lecture : tout le projet
- Accès écriture : `.agents/`, `ROADMAP.md`, `DECISIONS.md`

**Artifacts produits** :
- `.agents/PHASES.md` : Plan détaillé des phases
- `.agents/DECISIONS.md` : Décisions architecture
- `.agents/ROADMAP.md` : Roadmap produit

**Invocations** :
```
@orchestrator plan-phase phase2a
@orchestrator prioritize-tasks
@orchestrator validate-deliverable board-implementation
```

---

### 2️⃣ Agent Spécifications (Product & Tech Writer)

**Rôle** : Rédaction et maintenance specs, documentation technique

**Responsabilités** :
- Rédiger SF (Spécifications Fonctionnelles)
- Rédiger ST (Spécifications Techniques)
- Maintenir ARCHITECTURE.md
- Documenter APIs
- Créer user stories
- Mettre à jour CHANGELOG

**Outils** :
- `read_file`, `create_file`, `replace_string_in_file`
- `multi_replace_string_in_file` : Éditions multiples
- `semantic_search` : Recherche contexte
- `get_changed_files` : Tracking pour docs
- **MCP Context7** : Consultation normes actuelles

**Artifacts produits** :
- `SF-SPECIFICATIONS-FONCTIONNELLES.md`
- `ST-SPECIFICATIONS-TECHNIQUES.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `docs/**` (documentation API)

**Invocations** :
```
@specs update-sf new-feature-ocr
@specs document-api KataGoService
@specs add-user-story "Exporter SGF avec variantes"
```

**Processus de mise à jour** :
1. Consulter MCP Context7 (si nouveau framework/lib)
2. Lire code existant
3. Identifier impacts (dépendances, risques)
4. Mettre à jour SF/ST
5. Ajouter entrée CHANGELOG
6. Valider cohérence SF ↔ ST ↔ Code

---

### 3️⃣ Agent Développement (Code Generator)

**Rôle** : Implémentation code, tests unitaires, intégrations

**Responsabilités** :
- Scaffold composants React
- Implémenter services (GameService, SGFParser, etc.)
- Intégrer WASM (KataGo)
- Intégrer ML (TensorFlow OCR)
- Écrire tests unitaires (Vitest)
- Refactoring et optimisations
- Linting & formatting

**Outils** :
- `create_file`, `replace_string_in_file`, `multi_replace_string_in_file`
- `list_code_usages` : Vérifier impacts changements
- `get_errors` : Validation TypeScript/ESLint
- `run_in_terminal` : Exécuter builds, tests
- **MCP Context7** : Normes TypeScript, React, performance

**Artifacts produits** :
- `src/**/*.{ts,tsx}` : Code source
- `tests/unit/**` : Tests unitaires
- `TECHNICAL-NOTES.md` : Notes implémentation

**Invocations** :
```
@dev implement Board.tsx
@dev create-service KataGoService
@dev integrate-wasm katago
@dev write-tests GameService
```

**Workflow développement** :
1. Lire user story (specs)
2. Consulter MCP Context7 (normes)
3. Implémenter code
4. Écrire tests unitaires
5. Linting + type-check
6. Valider tests passent
7. Notifier QA pour E2E

---

### 4️⃣ Agent Tests Utilisateur (QA & UX)

**Rôle** : Validation features, tests E2E, rapports bugs

**Responsabilités** :
- Tests E2E (Playwright)
- Tests offline mode
- Tests responsive (mobile, desktop)
- Validation workflows UX
- Détection anomalies
- Rapports QA
- Priorisation bugs (critical/major/minor)

**Outils** :
- `run_in_terminal` : Exécuter tests E2E
- `get_errors` : Collecter erreurs
- `open_simple_browser` : Tests manuels
- `create_file` : Rapports QA, bugs

**Artifacts produits** :
- `tests/e2e/**` : Tests Playwright
- `QA-REPORTS.md` : Rapports validation
- `BUGS.md` : Liste bugs actifs

**Environnements de test** :
- Chrome Desktop
- Firefox Desktop
- Chrome Mobile (emulated)
- Safari iOS (emulated)
- Offline mode (DevTools)

**Critères validation** :
- **Fonctionnel** : SF user stories respectées
- **Performance** : ST targets (< 2s bundle, < 3s KataGo)
- **Accessibilité** : WCAG 2.1 AA
- **Offline** : 100% fonctionnel sans réseau
- **Responsive** : Tous breakpoints (xs, sm, md, lg, xl)

**Invocations** :
```
@qa test-feature board-implementation
@qa test-offline all-features
@qa test-responsive mobile
@qa report-bug critical "Board crash on invalid move"
```

**Workflow QA** :
1. Feature marquée "ready for testing"
2. Écrire tests E2E
3. Exécuter tests (automatiques)
4. Tests manuels (UX flows)
5. Rapport QA → orchestrator
6. Si bugs → BUGS.md + notify dev
7. Si validé → approve merge

---

## 🔄 WORKFLOWS INTER-AGENTS

### Workflow 1 : Démarrage Phase

```
1. Orchestrator : Créer plan phase
   → Tâches, priorités, risques
   → Fichier: .agents/PHASES.md

2. Specs : Détailler features phase
   → Mettre à jour SF/ST
   → User stories détaillées

3. Orchestrator : Valider specs
   → Cohérence SF ↔ ST
   → Assigner tâches à dev

4. Dev : Commencer implémentation
   → Parallel tasks si possible
```

### Workflow 2 : Feature Implementation

```
1. Specs : User story + critères acceptation
   → Ex: "US-10: Board interactif 19x19"
   → Critères: click placement, numérotation, etc.

2. Dev : Implémentation
   → Code Board.tsx
   → Tests unitaires
   → Auto-validation (lint, type-check)

3. Dev → QA : "Feature ready for testing"

4. QA : Tests E2E + validation UX
   → Tests automatiques (Playwright)
   → Tests manuels (flows)
   → Rapport QA

5. QA → Orchestrator : Rapport
   → Si bugs → BUGS.md
   → Si validé → approve

6. Orchestrator : Décision
   → Merge si validé
   → Iterate si bugs critiques
```

### Workflow 3 : Bug Fix

```
1. QA : Reporter bug
   → Titre, repro steps, severity
   → Fichier: BUGS.md

2. Orchestrator : Prioriser
   → Critical : fix immédiat
   → Major : fix this sprint
   → Minor : backlog

3. Dev : Fix
   → Code fix
   → Test unitaire (non-regression)
   → Commit avec ref bug

4. QA : Valider fix
   → Test regression
   → Rapport validation

5. Orchestrator : Close bug
   → Update BUGS.md
   → Git commit
```

### Workflow 4 : Specs Update

```
1. Orchestrator : Identifier changements
   → Code changes (git diff)
   → Nouveaux features
   → Breaking changes

2. Specs : Mettre à jour SF/ST/ARCHITECTURE
   → Refléter changements
   → Impact analysis
   → CHANGELOG entry

3. Orchestrator : Valider cohérence
   → SF ↔ ST ↔ Code aligned
   → Approve docs update
```

### Workflow 5 : Phase Completion

```
1. QA : Tests complets
   → E2E suite complète
   → Offline validation
   → Responsive tests
   → Rapport QA final

2. Specs : Update docs
   → README, ARCHITECTURE
   → Release notes
   → CHANGELOG

3. Orchestrator : Validation finale
   → Tous critères MVP respectés
   → Performance targets atteints
   → Documentation complète

4. Orchestrator : Git tag
   → Ex: v1.0-phase2a
   → Push tags

5. Orchestrator : Planifier prochaine phase
   → Update ROADMAP.md
   → Plan phase suivante
```

---

## 📞 COMMUNICATION AGENTS

### Channels

| De → À | Canal | Usage |
|---|---|---|
| Orchestrator → All | Broadcast | Directives, priorités, décisions |
| Specs → Dev | Direct | User stories, critères acceptation |
| Dev → QA | Direct | Features ready for testing |
| QA → Orchestrator | Report | Bug reports, QA status |
| All → Orchestrator | Escalation | Questions, blockers |

### Formats de Communication

**Orchestrator → Agents**
```markdown
## Directive: Implement Board Phase 2A

**Priority**: P0 (Critical)
**Deadline**: 10 février 2026
**Assigned**: @dev

**Tasks**:
- [ ] Board.tsx (Canvas 19x19)
- [ ] GameService (move logic)
- [ ] Tests unitaires

**Dependencies**: SF-SPEC US-2 completed
**Risks**: Canvas performance on mobile
```

**Specs → Dev**
```markdown
## User Story US-10: Board Interactif

**En tant que** joueur,
**Je veux** cliquer sur le plateau pour placer des coups,
**Afin que** je puisse créer et éditer une partie.

**Critères d'acceptation**:
✅ Clic intersection → coup placé
✅ Alternance Noir/Blanc
✅ Numéros coups affichés
✅ Responsive (mobile + desktop)

**API Service**:
- GameService.addMove(game, move)
- GameService.isLegalMove(game, move)
```

**Dev → QA**
```markdown
## Feature Ready: Board Implementation

**Branch**: feature/board-canvas
**Commits**: 5 commits
**Files changed**: src/components/Board.tsx, tests/unit/Board.test.ts

**Tests unitaires**: ✅ 12/12 passed
**Linting**: ✅ No errors
**Type-check**: ✅ No errors

**Ready for**:
- E2E tests (board placement)
- Responsive tests (mobile)
- Offline tests
```

**QA → Orchestrator**
```markdown
## QA Report: Board Implementation

**Status**: ✅ APPROVED

**Tests**:
- ✅ E2E: Board placement (12 scenarios)
- ✅ Responsive: xs, sm, md, lg (all pass)
- ✅ Offline: Works without network
- ⚠️ Minor: Focus state invisible on dark theme

**Recommendations**:
- Fix minor issue (low priority)
- Merge to main

**Bugs**: 1 minor (BUGS.md #42)
```

---

## 🛠️ UTILISATION PRATIQUE

### Invoquer un Agent

```bash
# Syntaxe générale
@<agent> <command> [args]

# Examples
@orchestrator start-phase phase2a
@specs update-sf board-feature
@dev implement Board.tsx
@qa test-feature board
```

### Workflow Typique Journée

```
1. Morning Sync
   @orchestrator daily-sync
   → Status, priorités du jour

2. Development
   @dev implement <feature>
   → Code + tests unitaires

3. Testing
   @qa test-feature <feature>
   → E2E + validation

4. Specs Update
   @specs update-docs
   → Reflect changes

5. End of Day
   @orchestrator status-report
   → Progress, blockers, next
```

### Escalation

**Niveau 1** : Agent résout seul
- Dev fix typo
- QA write test case
- Specs fix doc typo

**Niveau 2** : Agent consulte orchestrator
- Dev: "Architecture decision needed"
- QA: "Critical bug priority?"
- Specs: "Breaking change impact?"

**Niveau 3** : Orchestrator + utilisateur
- Pivot fonctionnel majeur
- Changement stack technique
- Budget/timeline dépassé

---

## 📊 MÉTRIQUES & TRACKING

### Orchestrator Dashboards

**`.agents/PHASES.md`**
```markdown
## Phase 2A: Board Interactif

**Status**: In Progress (60%)
**Start**: 5 février 2026
**Target**: 10 février 2026

**Tasks**:
- [x] Board.tsx scaffold
- [x] Canvas rendering
- [ ] Click handlers
- [ ] Move validation
- [ ] Tests E2E

**Risks**:
- ⚠️ Canvas perf mobile (mitigation: optimize render)
```

**`.agents/DECISIONS.md`**
```markdown
## Decision #001: Canvas vs SVG pour Board

**Date**: 5 février 2026
**Décideur**: @orchestrator
**Context**: Choix technologie rendu plateau

**Options**:
1. Canvas API (choisi ✅)
2. SVG
3. HTML Grid

**Raison**: Performance 60 FPS, moins de DOM nodes

**Impact**: src/components/Board.tsx
```

---

## ✅ CHECKLIST ACTIVATION AGENTS

Avant de démarrer Phase 2 avec agents :

- [x] `.agents/config.json` créé
- [x] `.agents/GUIDE.md` créé
- [ ] `.agents/PHASES.md` initialisé
- [ ] `.agents/DECISIONS.md` initialisé
- [ ] `.agents/ROADMAP.md` initialisé
- [ ] `QA-REPORTS.md` créé
- [ ] `BUGS.md` créé
- [ ] `CHANGELOG.md` créé
- [ ] Tous agents testés (invoke dry-run)

---

## 🚀 NEXT STEPS

**Immédiat** :
1. Lire ce guide complet
2. Créer fichiers artifacts (PHASES, DECISIONS, etc.)
3. @orchestrator start-phase phase2a
4. @specs update-sf board-feature
5. @dev implement Board.tsx

**Ordre recommandé Phase 2A** :
```
Day 1:
@orchestrator start-phase phase2a
@specs detail-user-story US-10
@dev scaffold Board.tsx

Day 2-3:
@dev implement board-canvas-rendering
@dev implement board-click-handlers

Day 4:
@dev write-tests Board.test.ts
@qa prepare-e2e board-tests

Day 5:
@qa test-feature board
@qa test-responsive board
@qa test-offline board

Day 6:
@qa report-results
@orchestrator validate-phase2a
@specs update-docs
@orchestrator git-tag v1.0-phase2a
```

---

**Système Multi-Agents activé ✅**  
**Prêt pour collaboration optimisée 🚀**
