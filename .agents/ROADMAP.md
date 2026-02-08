# ROADMAP PRODUIT - GoAI Editor

**Version actuelle** : 1.0-dev (Phase 1 terminée)  
**Date** : 3 février 2026  
**Horizon** : Q1 2026 → Q4 2026

---

## 🎯 Vision Produit

**Mission** : Devenir l'outil de référence pour les joueurs de Go souhaitant analyser, étudier et améliorer leur jeu grâce à l'intelligence artificielle, accessible partout (offline-first PWA).

**Valeurs** :
- **Offline-first** : Fonctionnel sans connexion internet
- **Performance** : 60 FPS, < 3s analyse KataGo
- **Accessibilité** : WCAG 2.1 AA minimum
- **Simplicité** : UX intuitive pour débutants
- **Puissance** : Features avancées pour experts

---

## 📅 Timeline Globale

```
Q1 2026 (Jan-Mar)
├── Phase 1: Scaffold ✅ (1-3 fév)
├── Phase 2A: Board ⏳ (3-10 fév)
├── Phase 2B: SGF Parser (11-15 fév)
├── Phase 2C: KataGo + OCR (16-28 fév)
├── Phase 2D: Tests E2E (1-7 mar)
└── Phase 2E: Deploy MVP v1.0 🎯 (15 mar)

Q2 2026 (Apr-Jun)
├── v1.1: Keyboard navigation + a11y
├── v1.2: Variantes multiples UI
└── v1.3: Export PDF/image

Q3 2026 (Jul-Sep)
├── v2.0: Multiplayer (websockets)
├── v2.1: Cloud sync (optionnel)
└── v2.2: Mobile apps (Capacitor)

Q4 2026 (Oct-Dec)
├── v3.0: Tsumego solver
├── v3.1: Joseki database
└── v3.2: Tournament management
```

---

## 🚀 MVP v1.0 - Mars 2026

**Date cible** : 15 mars 2026  
**Status** : 🔄 En cours (Phase 2A/6)

### Objectif

Livrer PWA offline-first avec features essentielles : édition plateau, SGF import/export, analyse KataGo, OCR photos.

### Features Incluses

#### ✅ Core Editor
- [x] Board 19×19 interactif (Canvas)
- [x] Placement coups (clic/touch)
- [x] Numérotation coups
- [x] Alternance Noir/Blanc
- [ ] Menu création/chargement parties
- [ ] Suppression parties

#### ⏳ SGF Support
- [ ] Import fichier SGF
- [ ] Export partie en SGF
- [ ] Support variantes (lecture seule v1.0)
- [ ] Metadata (joueurs, date, résultat)

#### ⏳ AI Analysis (KataGo)
- [ ] Intégration KataGo.js WASM
- [ ] Analyse position (winrate, top 5 coups)
- [ ] Graph winrate au fil de la partie
- [ ] Cache evaluations (IndexedDB)

#### ⏳ OCR Photos
- [ ] Upload photo plateau
- [ ] Détection pierres (TensorFlow.js)
- [ ] Corrections manuelles
- [ ] Confidence scoring

#### ✅ PWA Features
- [x] Offline-first (Service Worker)
- [x] Installable (manifest.json)
- [x] IndexedDB persistence
- [ ] Update notifications

#### ✅ i18n
- [x] Français (prioritaire)
- [x] Anglais

### Métriques Succès v1.0

| Métrique | Target | Actuel |
|---|---|---|
| **Bundle size** | < 2 MB gzipped | TBD |
| **First Paint** | < 1.5s | TBD |
| **Time to Interactive** | < 3s | TBD |
| **KataGo analysis** | < 3s (10 playouts) | TBD |
| **Lighthouse** | > 90 | TBD |
| **Offline** | 100% features | TBD |
| **Tests E2E** | > 80% coverage | 0% |

### Non-Scope v1.0

- ❌ Multiplayer (v2.0)
- ❌ Cloud sync (v2.0)
- ❌ Mobile apps natives (v2.2)
- ❌ Variantes multiples UI complexe (v1.2)
- ❌ Tsumego solver (v3.0)

---

## 📦 v1.1 - Avril 2026

**Thème** : Accessibilité & UX Polish

### Features

- **Keyboard navigation** : Arrow keys board navigation
- **Screen reader** : ARIA labels complets
- **High contrast** : Thème contraste élevé
- **Focus visible** : Outlines clairs
- **Undo/Redo** : Ctrl+Z / Ctrl+Y
- **Shortcuts** : Cheatsheet (?)

### Métriques

- ✅ WCAG 2.1 AAA (vs AA v1.0)
- ✅ Keyboard-only usable
- ✅ Screen reader friendly

---

## 🌳 v1.2 - Mai 2026

**Thème** : Variantes Multiples

### Features

- **Variantes tree UI** : Arbre navigation variantes
- **Create variant** : Branch depuis n'importe quel coup
- **Delete variant** : Supprimer branche
- **Merge variants** : Combiner branches
- **Highlight main line** : Ligne principale vs variantes

### Use Case

Étude joseki avec multiple variations explorées.

---

## 📸 v1.3 - Juin 2026

**Thème** : Export & Sharing

### Features

- **Export PNG** : Board screenshot HD
- **Export PDF** : Partie complète avec commentaires
- **Export GIF** : Animation replay partie
- **Share link** : URL partie (data URL encodé)
- **Print mode** : CSS print optimized

---

## 🌐 v2.0 - Juillet 2026

**Thème** : Multiplayer (Breaking Change)

### Features

- **Websockets** : Real-time multiplayer
- **Rooms** : Créer/joindre room
- **Spectators** : Observer parties
- **Chat** : In-game chat
- **Sync** : State synchronized cross-clients

### Architecture Changes

- **Backend** : Node.js + Socket.io
- **Auth** : Firebase Auth (optionnel, guest ok)
- **Hosting** : Vercel (frontend) + Railway (backend)

### Risques

- Complexité backend (nouveau scope)
- Coûts hosting
- Offline-first compliqué (sync conflicts)

---

## ☁️ v2.1 - Août 2026

**Thème** : Cloud Sync (Optionnel)

### Features

- **Auto-sync** : Games synced cross-devices
- **Conflict resolution** : Last-write-wins
- **Selective sync** : Choisir games à sync
- **Backup** : Export all data JSON

### Stack

- **Backend** : Supabase (PostgreSQL + Storage)
- **Auth** : Supabase Auth
- **Offline** : IndexedDB remains primary, cloud = backup

---

## 📱 v2.2 - Septembre 2026

**Thème** : Mobile Apps Natives

### Features

- **iOS app** : App Store
- **Android app** : Play Store
- **Native camera** : OCR photo optimisé
- **Push notifications** : Game updates (multiplayer)

### Stack

- **Capacitor** : Wrapper PWA → native
- **Plugins** : Camera, Push, Filesystem

---

## 🧩 v3.0 - Octobre 2026

**Thème** : Tsumego Solver

### Features

- **Tsumego mode** : Mode résolution problèmes
- **Problems database** : 1000+ tsumego intégrés
- **Difficulty levels** : 5 kyu → 5 dan
- **Hints** : KataGo suggestions
- **Progress tracking** : Stats résolution

### Data

- **Source** : GoProblems.com (open data)
- **Storage** : IndexedDB local cache
- **Format** : SGF avec solutions

---

## 📚 v3.1 - Novembre 2026

**Thème** : Joseki Database

### Features

- **Joseki explorer** : Base 500+ joseki
- **Search** : Par position, tags
- **KataGo eval** : Évaluation moderne
- **Contributions** : User-submitted joseki
- **Annotations** : Commentaires communauté

### Data

- **Source** : Waltheri.net API
- **Hosting** : Supabase PostgreSQL

---

## 🏆 v3.2 - Décembre 2026

**Thème** : Tournament Management

### Features

- **Tournament creation** : Swiss, Round-robin, Knockout
- **Pairing algorithm** : Auto pairing rounds
- **Live results** : Real-time standings
- **Export results** : PDF, CSV
- **Handicap support** : Auto handicap calculation

### Use Case

Clubs de Go organisent tournois locaux via app.

---

## 🔮 Futur (2027+)

### Ideas Explorées

- **AI coaching** : Personnalized feedback on games
- **Video lessons** : Intégration YouTube lessons
- **Social features** : Friends, follows, activity feed
- **Monetization** : Premium features (cloud sync, advanced AI)
- **Localization** : Japonais, Chinois, Coréen
- **Game analysis reports** : PDF détaillé post-partie

---

## 📊 KPIs Produit

### Adoption

| Métrique | v1.0 Target | v2.0 Target | v3.0 Target |
|---|---|---|---|
| **Users actifs/mois** | 100 | 1,000 | 10,000 |
| **Parties créées** | 500 | 5,000 | 50,000 |
| **Retention 7j** | 30% | 40% | 50% |
| **Install rate (PWA)** | 20% | 30% | 40% |

### Qualité

| Métrique | v1.0 Target | v2.0 Target | v3.0 Target |
|---|---|---|---|
| **Lighthouse** | > 90 | > 95 | > 98 |
| **Crash rate** | < 1% | < 0.5% | < 0.1% |
| **Test coverage** | > 80% | > 85% | > 90% |
| **Bug rate** | < 5/release | < 3/release | < 1/release |

### Performance

| Métrique | v1.0 Target | v2.0 Target | v3.0 Target |
|---|---|---|---|
| **Bundle size** | < 2 MB | < 2.5 MB | < 3 MB |
| **FCP** | < 1.5s | < 1s | < 0.8s |
| **TTI** | < 3s | < 2s | < 1.5s |
| **KataGo analysis** | < 3s | < 2s | < 1s |

---

## 🎨 Design Evolution

### v1.0: Minimal & Functional
- Board-first layout
- Clean UI, no distractions
- Desktop + mobile responsive

### v2.0: Social & Collaborative
- Multiplayer rooms UI
- User avatars, online status
- Chat interface

### v3.0: Learning Platform
- Educational layout
- Lesson cards, progress bars
- Gamification (badges, levels)

---

## 🔧 Technical Debt Backlog

### Identifié Phase 1

Aucune dette technique identifiée (scaffold neuf).

### À Surveiller Phase 2

- **Canvas performance** : Profiling mobile requis
- **WASM size** : KataGo bundle peut être lourd (chunking?)
- **IndexedDB migrations** : Schema evolution strategy

### Remboursement Prévu

- v1.1 : Refactor BoardService (si nécessaire)
- v2.0 : Backend abstraction layer (multi-providers)
- v3.0 : Component library extraction (storybook?)

---

## 🚦 Release Process

### Critères Release

1. ✅ Tous tests E2E passent
2. ✅ Lighthouse > target
3. ✅ Offline mode validé
4. ✅ Documentation à jour
5. ✅ Changelog écrit
6. ✅ Git tag créé
7. ✅ Deploy staging validé
8. ✅ Deploy production

### Versioning

**Semantic Versioning** : MAJOR.MINOR.PATCH

- **MAJOR** : Breaking changes (v1 → v2)
- **MINOR** : New features (v1.0 → v1.1)
- **PATCH** : Bug fixes (v1.0.0 → v1.0.1)

### Branches

- `main` : Production stable
- `develop` : Integration branch
- `feature/*` : Feature branches
- `hotfix/*` : Urgent fixes

---

## 📣 Communication Roadmap

### Channels

- **Users** : In-app changelog, blog posts
- **Contributors** : GitHub releases, discussions
- **Stakeholders** : Monthly reports

### Cadence

- **Sprint reviews** : Bi-weekly (every 2 weeks)
- **Releases** : Monthly (v1.x)
- **Major versions** : Quarterly (v2.0, v3.0)

---

## 🤝 Contribution

### Open Source (v2.0+)

- **License** : MIT
- **Contributions** : Issues, PRs welcome
- **Governance** : Benevolent dictator (core team)

### Prioritization Process

1. **User feedback** : Issues GitHub, surveys
2. **Analytics** : Usage data (privacy-first)
3. **Strategic fit** : Roadmap alignment
4. **Effort estimation** : Dev team input
5. **Voting** : Community poll (major features)

---

**Dernière mise à jour** : 3 février 2026 par @orchestrator  
**Prochaine révision** : 15 mars 2026 (post-v1.0 launch)
