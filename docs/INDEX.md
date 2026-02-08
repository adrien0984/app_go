# 📑 INDEX - GoAI Editor MVP v1.0

## 🚀 DÉMARRAGE RAPIDE

**Nouveau sur le projet ?** Commencez ici :

1. **[QUICK-START.md](QUICK-START.md)** ← **LISEZ D'ABORD** (5 min)
   - Installation (npm install)
   - Démarrage serveur dev
   - Test menu parties
   - Commandes utiles

2. **[README.md](README.md)** (10 min)
   - Vue d'ensemble
   - Architecture résumée
   - Déploiement
   - Roadmap v1.0 → v2.0

3. **[RAPPORT-DEMARRAGE.md](RAPPORT-DEMARRAGE.md)** (15 min)
   - Résumé exécutif scaffold
   - Fichiers créés
   - Checklist Phase 2
   - Next steps

---

## 📚 DOCUMENTATION DÉTAILLÉE

### Spécifications Produit

**[SF-SPECIFICATIONS-FONCTIONNELLES.md](SF-SPECIFICATIONS-FONCTIONNELLES.md)**
- 10 User Stories principales
- Cas d'usage critiques
- Workflows interactions
- Modèles de données
- Contraintes MVP
- Roadmap v1.1 → v2.0

**[ST-SPECIFICATIONS-TECHNIQUES.md](ST-SPECIFICATIONS-TECHNIQUES.md)**
- Architecture complète
- Stack technologique
- Schéma IndexedDB
- Services détaillés
- Performance targets
- Stratégie de test

### Architecture & Implémentation

**[ARCHITECTURE.md](ARCHITECTURE.md)**
- Diagrammes d'architecture
- Composants clés
- Redux store shape
- Services implémentation
- Flux de données
- Optimisations performance
- Testing strategy
- Normes de codage

### Listes & Guides

**[FICHIERS-CREES.md](FICHIERS-CREES.md)**
- Inventaire complet des 39 fichiers
- Arborescence source
- Statistiques (lignes de code)
- Dépendances NPM
- Checklist validation

---

## 🎯 PAR RÔLE

### 👨‍💼 Product Manager / UX
Lire dans cet ordre :
1. [QUICK-START.md](QUICK-START.md) - Overview rapide
2. [README.md](README.md) - Features & roadmap
3. [SF-SPECIFICATIONS-FONCTIONNELLES.md](SF-SPECIFICATIONS-FONCTIONNELLES.md) - User stories complètes

### 🧑‍💻 Developer / Frontend
Lire dans cet ordre :
1. [QUICK-START.md](QUICK-START.md) - Setup
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Flux données + composants
3. [ST-SPECIFICATIONS-TECHNIQUES.md](ST-SPECIFICATIONS-TECHNIQUES.md) - Services + Redux
4. Code source : `src/` folder

### 🏗️ Architect / Tech Lead
Lire dans cet ordre :
1. [RAPPORT-DEMARRAGE.md](RAPPORT-DEMARRAGE.md) - Overview scaffold
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture complète
3. [ST-SPECIFICATIONS-TECHNIQUES.md](ST-SPECIFICATIONS-TECHNIQUES.md) - Stack technique
4. [FICHIERS-CREES.md](FICHIERS-CREES.md) - Inventaire code

### 🧪 QA / Tester
Lire dans cet ordre :
1. [README.md](README.md) - Features testables
2. [SF-SPECIFICATIONS-FONCTIONNELLES.md](SF-SPECIFICATIONS-FONCTIONNELLES.md) - Critères acceptation
3. [ST-SPECIFICATIONS-TECHNIQUES.md](ST-SPECIFICATIONS-TECHNIQUES.md#11-stratégie-de-test) - Plan tests
4. [QUICK-START.md](QUICK-START.md) - Setup test offline

---

## 📂 STRUCTURE SOURCE

```
workspace/
├── 📖 Documentation (INDEX, QUICK-START, README, etc.)
├── ⚙️ Configuration (package.json, vite.config, tsconfig, etc.)
├── src/
│   ├── components/       # Composants React (Menu, Editor, Board future)
│   ├── services/         # Business logic (StorageService, futur KataGo, OCR)
│   ├── store/            # Redux (gameSlice, uiSlice, etc.)
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilitaires (i18n config)
│   ├── locales/          # Traductions (fr.json, en.json)
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Styles globaux
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── sw.ts             # Service Worker
│   └── icons/            # App icons (à créer)
└── tests/                # Tests (à créer Phase 2)
```

---

## 🔍 GUIDE PAR FONCTIONNALITÉ

### 🎮 "Je veux créer une partie"
1. Voir User Story US-1 → [SF.md](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-1--créer-une-nouvelle-partie)
2. Voir composant → [src/components/GameMenu.tsx](src/components/GameMenu.tsx)
3. Voir Redux action → [src/store/slices/gameSlice.ts](src/store/slices/gameSlice.ts)

### 📝 "Je veux éditer une partie avec coups"
1. Voir User Story US-2 → [SF.md](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-2--jouer-des-coups-et-éditer-variantes)
2. Voir architecture → [ARCHITECTURE.md#workflow--créer-partie](ARCHITECTURE.md)
3. Implementation future → Board.tsx (Phase 2)

### 💾 "Je veux sauvegarder en offline"
1. Voir contrainte → [SF.md](SF-SPECIFICATIONS-FONCTIONNELLES.md#5--règles-métier)
2. Voir service → [src/services/StorageService.ts](src/services/StorageService.ts)
3. Voir Service Worker → [public/sw.ts](public/sw.ts)

### 🌍 "Je veux français ou anglais"
1. Voir User Story US-8 → [SF.md](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-8--voir-linterface-en-français-et-en-anglais)
2. Voir composant → [src/components/LanguageSelector.tsx](src/components/LanguageSelector.tsx)
3. Voir traductions → [src/locales/](src/locales/)

### 🔬 "Je veux analyser avec IA"
1. Voir User Story US-5 → [SF.md](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-5--analyser-une-position-avec-katago)
2. Voir architecture → [ST.md#83-katago-service](ST-SPECIFICATIONS-TECHNIQUES.md)
3. Implementation future → KataGoService (Phase 2)

### 📸 "Je veux reconnaissance photo"
1. Voir User Story US-6 → [SF.md](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-6--prendre-une-photo-et-reconnaître-le-plateau-ocr)
2. Voir architecture → [ST.md#84-ocrservice](ST-SPECIFICATIONS-TECHNIQUES.md)
3. Implementation future → OCRService (Phase 2)

---

## 🚀 PHASES DE DÉVELOPPEMENT

### ✅ Phase 1 (Actuelle) - SCAFFOLD
**Status**: COMPLÈTE  
**Documentation** :
- [RAPPORT-DEMARRAGE.md](RAPPORT-DEMARRAGE.md) - Résumé scaffold
- [FICHIERS-CREES.md](FICHIERS-CREES.md) - Inventaire 39 fichiers

### 📋 Phase 2A - Board & Coups (1-2 semaines)
**Todo** :
- [ ] Board.tsx (Canvas 19×19)
- [ ] GameService (logique coups)
- [ ] Move placement UI
**Documents** :
- Voir [ST.md - Composants clés](ST-SPECIFICATIONS-TECHNIQUES.md#6-composants-principaux)

### 📄 Phase 2B - SGF (1 semaine)
**Todo** :
- [ ] SGFParser (import)
- [ ] SGFSerializer (export)
- [ ] SGFManager UI
**Documents** :
- Voir [SF.md - US-3, US-4](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-3--importer-un-fichier-sgf)
- Voir [ST.md - SGFParser service](ST-SPECIFICATIONS-TECHNIQUES.md#52-sgfparser)

### 🧠 Phase 2C - IA & OCR (2 semaines)
**Todo** :
- [ ] KataGoService + Worker
- [ ] OCRService + Worker
- [ ] Analysis & OCR panels
**Documents** :
- Voir [SF.md - US-5, US-6](SF-SPECIFICATIONS-FONCTIONNELLES.md#us-5--analyser-une-position-avec-katago)
- Voir [ST.md - Intégrations WASM](ST-SPECIFICATIONS-TECHNIQUES.md#8-intégrations-externes)

### 🧪 Phase 2D - Tests & Offline (1 semaine)
**Todo** :
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] Offline validation
**Documents** :
- Voir [ST.md - Stratégie test](ST-SPECIFICATIONS-TECHNIQUES.md#11-stratégie-de-test)

### 🚀 Phase 2E - Deploy (1 semaine)
**Todo** :
- [ ] GitHub Pages setup
- [ ] PWA installation test
- [ ] Performance optimization
**Documents** :
- Voir [ST.md - Deployment](ST-SPECIFICATIONS-TECHNIQUES.md#12-deployment--cicd)

---

## 🔗 LIENS RAPIDES

### Documentation Principale
- [QUICK-START.md](QUICK-START.md) - Installation 5 min
- [README.md](README.md) - Overview complet
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture détaillée

### Spécifications
- [SF-SPECIFICATIONS-FONCTIONNELLES.md](SF-SPECIFICATIONS-FONCTIONNELLES.md) - Features
- [ST-SPECIFICATIONS-TECHNIQUES.md](ST-SPECIFICATIONS-TECHNIQUES.md) - Tech stack

### Inventaires & Rapports
- [RAPPORT-DEMARRAGE.md](RAPPORT-DEMARRAGE.md) - Scaffold résumé
- [FICHIERS-CREES.md](FICHIERS-CREES.md) - 39 fichiers inventaire

### Code Source
- [src/components/](src/components/) - Composants React
- [src/services/StorageService.ts](src/services/StorageService.ts) - IndexedDB
- [src/store/](src/store/) - Redux state
- [src/types/](src/types/) - TypeScript types
- [src/locales/](src/locales/) - Traductions

### Configuration
- [package.json](package.json) - Dépendances
- [vite.config.ts](vite.config.ts) - Build config
- [tsconfig.json](tsconfig.json) - TypeScript
- [.eslintrc.json](.eslintrc.json) - Linting

---

## ❓ QUESTIONS FRÉQUENTES

**Q: Par où commencer ?**  
A: [QUICK-START.md](QUICK-START.md) (5 min) puis npm install + npm run dev

**Q: Où trouver les user stories ?**  
A: [SF-SPECIFICATIONS-FONCTIONNELLES.md](SF-SPECIFICATIONS-FONCTIONNELLES.md)

**Q: Quel est le plan de développement ?**  
A: [RAPPORT-DEMARRAGE.md](RAPPORT-DEMARRAGE.md#-prochaines-étapes-phase-2)

**Q: Comment fonctionne Redux ?**  
A: [ARCHITECTURE.md#redux-store-structure](ARCHITECTURE.md)

**Q: Quand implémenter le Board ?**  
A: Phase 2A - Voir [ST.md](ST-SPECIFICATIONS-TECHNIQUES.md#61-board-component)

**Q: Comment tester offline ?**  
A: [QUICK-START.md#-test-offline-mode](QUICK-START.md)

**Q: Quand déployer ?**  
A: Phase 2E - Voir [ST.md#deployment](ST-SPECIFICATIONS-TECHNIQUES.md#12-deployment--cicd)

---

## 📞 NAVIGATION

**Vous êtes ici** : INDEX.md (Vous lisez)

**Aller à** :
- ← [QUICK-START](QUICK-START.md) - Démarrage rapide
- → [README](README.md) - Vue d'ensemble
- → [ARCHITECTURE](ARCHITECTURE.md) - Détails techniques
- → [SF-SPECS](SF-SPECIFICATIONS-FONCTIONNELLES.md) - Features
- → [ST-SPECS](ST-SPECIFICATIONS-TECHNIQUES.md) - Stack technique

---

## ✨ RÉSUMÉ

**GoAI Editor v1.0 MVP** est un scaffold complet et production-ready pour une **Progressive Web App (PWA) pour joueurs de Go**.

**Vous avez** :
- ✅ Architecture solide (React + Redux + Vite)
- ✅ Spécifications complètes (SF + ST v1.0)
- ✅ Structure modulaire (services, components, types)
- ✅ PWA ready (Service Worker, manifest.json)
- ✅ Offline-first (IndexedDB, Service Worker caching)
- ✅ Multilingue (FR/EN avec i18n)
- ✅ Documentation exhaustive (6 docs guides)

**Prochaine étape** : Implémenter Phase 2 (Board, SGF, KataGo, OCR, Tests)

**Timeline estimé** : 2 mois (6 semaines Phase 2 + 2 semaines polish/deploy)

---

**GoAI Editor MVP**  
Scaffold v1.0 ✅  
Réalisé : 3 février 2026  
Prêt pour développement Phase 2 🚀
