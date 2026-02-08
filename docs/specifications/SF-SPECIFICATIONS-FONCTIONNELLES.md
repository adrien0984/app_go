# Spécification Fonctionnelle (SF) - GoAI Editor v1.0

**Date** : 4 février 2026  
**Version** : v1.0 MVP (Phase 3 en cours)  
**Statut** : Phase 2A/2B ✅ Complétées | Phase 3 🚧 En cours  

---

## 1. VUE D'ENSEMBLE

### Objectif
Créer une application web progressive (PWA) permettant aux joueurs de Go de :
- Créer, éditer et gérer des parties (Kifu) via un éditeur intuitif
- Importer/exporter des fichiers SGF (Smart Game Format)
- Analyser des positions avec une IA locale (KataGo)
- Reconnaître des plateaux à partir de photos (OCR offline)
- Jouer complètement offline avec sauvegarde locale

### Utilisateurs Cibles
- Joueurs Go (tous niveaux : débutant à professionnel)
- Géographie : France prioritaire, international (EN secondaire)
- Appareils : Desktop + Mobile (iOS, Android)
- Connexion : Zéro dépendance réseau (MVP) → sync cloud (futur v2.0)

### Principes de Conception
- **Offline-first** : tous les coups doivent fonctionner sans Internet
- **Intuitive** : interface simple et épurée inspirée de jeudego.org
- **Modulaire** : features indépendantes, faciles à étendre
- **Performance** : OCR et IA < 3s par action

---

## 2. USER STORIES & CAS D'USAGE PRINCIPAUX

### US-1 : Créer une nouvelle partie
**En tant que** joueur,  
**Je veux** créer une partie vierge (19×19),  
**Afin que** je puisse commencer à enregistrer mes coups.

**Critères d'acceptation** :
- ✅ Écran "Nouvelle Partie" → saisie titre, joueurs Noir/Blanc, komi
- ✅ Plateau 19×19 vierge généré et affiché
- ✅ Partie stockée en IndexedDB avec UUID
- ✅ Utilisateur revient au menu après création

---

### US-2 : Jouer des coups et éditer variantes
**En tant que** joueur,  
**Je veux** cliquer sur le plateau pour placer des coups,  
**Afin que** je puisse créer et éditer des variantes de jeu.

**Critères d'acceptation** :
- ✅ Clic sur une intersection → coup placé (alternance Noir/Blanc)
- ✅ Numéros de coup affichés en séquence (1, 2, 3...)
- ✅ Annulation (Ctrl+Z ou bouton Retour)
- ✅ Variantes : créer branche à partir de n'importe quel coup
- ✅ Editer annotations (commentaires texte par coup)
- ✅ Affichage arborescence variantes dans panneaux latéraux

---

### US-3 : Importer un fichier SGF
**En tant que** joueur,  
**Je veux** charger un SGF depuis mon ordinateur,  
**Afin que** je puisse étudier des parties existantes.

**Critères d'acceptation** :
- ✅ Menu → "Importer SGF" (drag-drop ou file picker)
- ✅ Parser SGF : décode coups, variantes, propriétés (BR, WR, RE, SZ...)
- ✅ Validation : sgf valide ou message d'erreur clair
- ✅ Partie chargée en mémoire et IndexedDB
- ✅ Affichage plate-forme 19×19 avec tous les coups

---

### US-4 : Exporter en SGF
**En tant que** joueur,  
**Je veux** télécharger ma partie en SGF,  
**Afin que** je puisse la partager ou analyser ailleurs.

**Critères d'acceptation** :
- ✅ Menu → "Exporter SGF"
- ✅ Sérialisation complète : coups, variantes, annotations, propriétés
- ✅ Format SGF standard (RFC compatible v4)
- ✅ Fichier téléchargé avec nom automatique (Titre_YYYYMMDD.sgf)

---

### US-5 : Analyser une position avec KataGo
**En tant que** joueur,  
**Je veux** cliquer sur "Analyser" pour voir le % de victoire de chaque couleur,  
**Afin que** je puisse évaluer la force d'une position.

**Critères d'acceptation** :
- 🚧 KataGo.js WASM chargé et initialisé au démarrage
- 🚧 Bouton "Analyser" dans AnalysisPanel (sidebar)
- 🚧 Panneau "Analyse IA" affiche :
  - Pourcentage victoire Noir (%) avec barre de progression
  - Pourcentage victoire Blanc (%) avec couleurs
  - Écart en points estimé (scoreLeadPV)
  - Winrate global (Noir/Blanc)
  - Policy globale (distribution des coups)
  - Top 5 meilleurs coups proposés avec :
    * Coordonnées (notation SGF et grille)
    * Winrate par coup
    * Nombre de visites (visits)
    * Prior (probabilité a priori)
- 🚧 Analyse < 3 secondes (20 visits par défaut, configurable)
- 🚧 Permet d'analyser position par position en naviguant la variante
- 🚧 Cliquer sur coup recommandé → affiche preview sur plateau
- 🚧 Résultats persistent en IndexedDB (evaluations store)
- 🚧 Cache analyses : éviter re-calcul même position
- 🚧 Loading state : spinner + texte "Analyse en cours..."
- 🚧 Gestion erreurs : timeout, WASM crash, position invalide
- 🚧 Badge "Ancienne" si analyse > 7 jours (option refresh)

**Exemple d’affichage utilisateur (simplifié)** :

```
Analyse IA
- Winrate : Noir 58% | Blanc 42%
- Score estimé : +2.3 (Noir)
- Policy (top 3) : D4 (0.08), Q16 (0.06), C3 (0.05)
- Top coups :
  1. D4 — winrate 61% — visits 280 — prior 0.08
  2. Q16 — winrate 59% — visits 240 — prior 0.06
```

**Contraintes techniques Phase 3** :
- KataGo.js via Web Worker (katagoWorker.ts)
- Communication postMessage (non-bloquant)
- Default config : 20 visits, température 1.0, max time 5s
- Format output : JSON compatible avec Evaluation type
- Service Worker cache WASM (~15-30 MB) pour offline

---

### US-6 : Prendre une photo et reconnaître le plateau (OCR)
**En tant que** joueur,  
**Je veux** photographier un plateau Go réel,  
**Afin que** la position soit automatiquement importée dans l'app.

**Critères d'acceptation** :
- ✅ Menu → "OCR Photo"
- ✅ Accès caméra (permission utilisateur)
- ✅ Aperçu live, capture bouton
- ✅ Sélecteur couleur à jouer (Noir ou Blanc)
- ✅ Détection pierres (empty/black/white) par TensorFlow.js
- ✅ Mapping pixel→coordonnées plateau (19×19)
- ✅ Affichage position reconnaissable, éditable manuellement
- ✅ Créer partie à partir de position OCR
- ✅ Taux succès acceptable (>70% estimé pour plateau bien éclairé)

---

### US-7 : Sauvegarder et charger parties locales
**En tant que** joueur,  
**Je veux** que mes parties soient sauvegardées automatiquement,  
**Afin que** je ne perde jamais mon travail.

**Critères d'acceptation** :
- ✅ Save automatique après chaque coup (debounce 500ms)
- ✅ ListListe parties dans "Mes Parties" (index IndexedDB)
- ✅ Charger partie existante depuis menu
- ✅ Supprimer partie (confirmation)
- ✅ Synchronisation future (v2.0) → cloud avec IndexedDB Sync API

---

### US-8 : Voir l'interface en français et en anglais
**En tant que** joueur anglophone,  
**Je veux** choisir la langue de l'interface,  
**Afin que** j'utilise l'app dans ma langue préférée.

**Critères d'acceptation** :
- ✅ Sélecteur langue visible (icon drapeau ou menu)
- ✅ Toutes labels, menus, messages traduits (FR/EN)
- ✅ Détection langue système par défaut
- ✅ Préférence sauvegardée en localStorage

---

## 2.1 ÉTAT D'AVANCEMENT PAR PHASE

### ✅ Phase 2A : Plateau Go 19×19 (Complétée - 3 février 2026)
**Objectif** : Afficher un plateau Go interactif 19×19 fonctionnel

**Réalisations** :
- ✅ Composant Board.tsx avec Canvas API (7 layers de rendu)
- ✅ Grille 19×19 avec hoshi (points étoiles)
- ✅ Placement coups (alternance Noir/Blanc)
- ✅ Numérotation coups
- ✅ Highlight dernier coup
- ✅ Hover preview avec transparence
- ✅ Support souris + tactile
- ✅ Responsive (360px - 1920px)
- ✅ 60 FPS requestAnimationFrame
- ✅ Tests unitaires canvasUtils (45+ tests, 99% coverage)
- ✅ Tests E2E Playwright (32 scénarios)

### ✅ Phase 2B : Optimisations & Qualité (Complétée - 4 février 2026)
**Objectif** : Améliorer performance, accessibilité et mobile

**Réalisations** :
- ✅ Navigation clavier complète (flèches, Enter, Ctrl+Z)
- ✅ Auto-save debounced (500ms)
- ✅ Hook useAutoSave personnalisé
- ✅ Mobile responsive 360-480px optimisé
- ✅ Accessibilité WCAG AA (contraste, touch targets 44px)
- ✅ Audit code (0 bugs critiques/majeurs)
- ✅ Goban en entité principale (ratio 1:1 parfait)
- ✅ TypeScript 0 erreurs
- ✅ ESLint 0 warnings

### 🚧 Phase 3 : Analyse IA avec KataGo (En cours - 4 février 2026)
**Objectif** : Intégrer KataGo.js pour analyse de position

**User Stories Phase 3** :
- US-5 : Analyser une position avec KataGo ✅ (spec ci-dessous)
- US-11 : Visualiser variations recommandées 🚧
- US-12 : Comparer plusieurs positions 🚧
- US-13 : Historique analyses persistant 🚧

---

### US-9 : Utiliser l'app complètement offline
**En tant que** joueur sans connexion,  
**Je veux** que toutes les fonctionnalités marchent sans Internet,  
**Afin que** je puisse jouer partout.

**Critères d'acceptation** :
- ✅ PWA installable (icône, manifest.json)
- ✅ Service Worker cache assets (JS, CSS, images)
- ✅ KataGo WASM : pré-chargé, zéro appel réseau
- ✅ OCR TensorFlow.js : modèle téléchargé une fois, utilisé localement
- ✅ IndexedDB : toutes parties en stockage persistant
- ✅ Teste offline (DevTools → offline mode) → app fonctionnelle

---

### US-10 : Affichage responsive sur mobile et desktop
**En tant que** joueur sur mobile,  
**Je veux** que le plateau et menus s'adaptent à l'écran,  
**Afin que** l'app soit utilisable sur tous appareils.

**Critères d'acceptation** :
- ✅ Plateau responsive : redimensionne selon viewport
- ✅ Panneaux colonnables (desktop côte-à-côte, mobile empilés)
- ✅ Boutons/inputs tactiles (hit-target > 44px)
- ✅ Texte lisible sans zoom (base 16px)
- ✅ Test responsive design (Chrome DevTools) → valide

---

## 3. DONNÉES CLÉS (MODÈLES)

### Game (Partie)
```
{
  id: UUID,
  title: string,
  createdAt: ISO8601,
  updatedAt: ISO8601,
  
  // Joueurs
  blackPlayer: string,
  whitePlayer: string,
  
  // Règles
  boardSize: 19,  // (futures extensions : 9, 13)
  komi: 6.5,
  handicap: 0,
  
  // Arbre de coups
  moves: Move[],
  variants: Variant[],
  
  // Métadonnées SGF
  event: string | null,
  date: string | null,
  result: string | null,  // "B+5.5" | "W+3" | "0"
  comment: string | null,
  
  // Analyses (cached)
  evaluations: Evaluation[],
}
```

### Move (Coup)
```
{
  id: UUID,
  moveNumber: int,  // 1, 2, 3...
  color: "B" | "W",
  x: 0-18,
  y: 0-18,
  
  // Annotations
  comment: string | null,
  symbols: "triangle" | "square" | "circle" | null,
  
  // Variantes
  variants: Variant[],
  parentMoveId: UUID | null,
}
```

### Variant (Variante)
```
{
  id: UUID,
  moveId: UUID,  // Coup d'origine
  moves: Move[],
  name: string | null,  // "Var. principale", "Alternative"
}
```

### Evaluation (Analyse IA)
```
{
  moveId: UUID,
  timestamp: ISO8601,
  
  // KataGo résultats
  winrate: {
    black: 0.0-1.0,
    white: 0.0-1.0,
  },
  scoreLeadPV: number,  // Points d'écart
  movePV: Move[],  // Line principale estimée
  
  // Top coups alternatifs
  topMoves: {
    move: { x, y },
    visits: int,
    winrate: float,
    lcb: float,
    prior: float,
  }[],
  
  confidence: 0.0-1.0,
}
```

### SGF Properties (Sous-ensemble Support MVP)
- **GM** : Game type (1 = Go)
- **FF** : File Format (4)
- **SZ** : Board size (19)
- **BR, WR** : Black/White rank
- **BN, WN** : Black/White name
- **EV** : Event
- **DT** : Date (YYYY-MM-DD)
- **RE** : Result (B+pts ou W+pts)
- **C** : Comment (par coup)
- **TR, SQ, CR** : Symboles (triangle, square, circle)
- **B, W** : Coups (positions)

### OCRResult
```
{
  imageId: UUID,
  processedAt: ISO8601,
  stones: {
    [x: y]: "empty" | "black" | "white",
  },
  confidence: 0.0-1.0,
  errors: string[],  // Liste problèmes détectés
}
```

---

## 4. WORKFLOWS PRINCIPAUX

### Workflow 1 : Créer et éditer une partie
```
1. Menu principal → "Nouvelle partie"
2. Saisie titre, joueurs, komi
3. Créer & ouvrir éditeur
4. Clic plateau → ajouter coup
5. (Optionnel) Analyser position → voir IA panneaux
6. (Optionnel) Créer variante → continuer édition
7. Auto-save IndexedDB chaque coup
8. Quitter → retour menu ("Parties sauvées" liste)
```

### Workflow 2 : Importer SGF et éditer
```
1. Menu → "Importer SGF"
2. Drag-drop ou file picker
3. Parser SGF → Game object
4. Afficher plateau avec coups
5. Utilisateur peut éditer, analyser, ajouter variantes
6. Exporter → télécharger SGF modifié
```

### Workflow 3 : Analyser une partie
```
1. Ouvrir partie (créée ou importée)
2. Navigation coups (prev/next ou slider)
3. Clic "Analyser position"
4. KataGo.js compute → 1-3 secondes
5. Afficher :
   - % victoire N/B (gauche panneaux)
   - Top 5 coups recommandés (droit panneaux)
   - Écart points estimé
6. Cliquer "coup recommandé" → affiche sa variante sur plateau
7. Analyses cachées → rejouer offline
```

### Workflow 4 : OCR photo → partie
```
1. Menu → "OCR Photo"
2. Accès caméra, préview live
3. Utilisateur capture
4. TensorFlow.js : détect stones
5. Sélecteur : "Couleur à jouer" (N ou B)
6. Afficher plateau reconnu, éditable manuellement
7. "Créer partie" → nouvelle Game, load OCRResult
8. Éditeur ouvre, utilisateur continue avec coups suivants
```

---

## 5. RÈGLES MÉTIER

### Règles Plateau Go
- **19×19** : standard international (futures : 9×13 en v2.0)
- **Coups légaux** : intersection vide uniquement
- **Capture** : groupes sans libertés sont supprimés (futur : implémentation rules)
- **Ko** : pas supporté v1.0 (ajout v1.1)
- **Handicap** : prise en compte nombre coups (future)

### Règles SGF
- Parse variantes `(;B[dd](;B[ee];W[ff]);W[gg])`
- Propriétés case-sensitive (GM, FF, SZ, BR, WR, RE, C, ...)
- Gère arbres profonds (100+ coups)
- Export format RFC 5234 compliant

### Règles Analyse IA
- KataGo : résultats déterministes (même position = même résultat)
- Stockage analyses (IndexedDB) pour rejeu offline
- Freshness : analyses > 1j → badge "ancien"

### Règles OCR
- Détection ≥ 70% de confiance avant affichage
- Affichage "Mode édition" si confiance 50-70% (correction manuel)
- Rejet si confiance < 50%

---

## 6. CONTRAINTES & ACCEPTABILITÉ

| Contrainte | MVP | Détail |
|---|---|---|
| **Offline** | ✅ | 100% offline (zéro dépendance réseau) |
| **Mobile** | ✅ | PWA, responsive, touch-friendly |
| **SGF import** | ✅ | Variantes, propriétés standard |
| **SGF export** | ✅ | Format RFC compliant, téléchargeable |
| **OCR** | ✅ | TensorFlow.js, >70% confiance |
| **Analyse IA** | ✅ | KataGo WASM, < 3s/position |
| **Langues** | ✅ | FR (priorité) + EN |
| **Stockage** | ✅ | IndexedDB (limit ~50 MB) |
| **Coûts** | ✅ | Zéro (hébergement gratuit) |
| **Jeu multi** | ❌ | Futur v2.0 (chat, matchmaking) |
| **Authentif.** | ❌ | Futur (sync cloud) |
| **Payments** | ❌ | Hors scope |
| **Ko, Capture** | ❌ | v1.1+ (édition manuelle ok v1.0) |

---

## 7. ÉVOLUTIONS FUTURES (ROADMAP)

### Synthèse Feature → Axe → Version

| Feature | Axe | Version cible |
|---|---|---|
| Profils d’analyse KataGo (rapide/standard/pro) | Axe 1 | v1.1 (Mars 2026) |
| Gestion visites/temps par profil | Axe 1 | v1.1 (Mars 2026) |
| ScoreLead + estimation territoires | Axe 2 | v1.1 (Mars 2026) |
| Heatmap ownership (361 cases) | Axe 2 | v1.1 (Mars 2026) |
| Arbre de variations navigable | Axe 4 | v1.1 (Mars 2026) |
| Comparaison A/B des lignes | Axe 4 | v1.1 (Mars 2026) |
| Import/Export SGF enrichi (variantes/annotations) | Axe 5 | v1.1 (Mars 2026) |
| Cache multi‑positions (IndexedDB) | Axe 1 | v1.2 (Juin 2026) |
| Priorités d’analyse (par coup/variation) | Axe 1 | v1.2 (Juin 2026) |
| Komi dynamique + réglages | Axe 2 | v1.2 (Juin 2026) |
| Indicateur d’incertitude (LCB) | Axe 2 | v1.2 (Juin 2026) |
| Marquage favoris + tags de lignes | Axe 4 | v1.2 (Juin 2026) |
| Export annotations enrichies (symboles) | Axe 5 | v1.2 (Juin 2026) |
| Feedback par coup + explications | Axe 3 | v2.0 (T1 2027) |
| Résumé pédagogique de partie | Axe 3 | v2.0 (T1 2027) |
| Modes d’analyse par niveau | Axe 3 | v2.0 (T1 2027) |

### Glossaire (termes d’analyse)

- **ownership** : estimation d’appartenance des intersections (valeur -1 à 1) indiquant l’influence noir/blanc.
- **scoreLead** : estimation d’avance en points (Noir - Blanc).
- **LCB (Lower Confidence Bound)** : marge basse de confiance sur le gain estimé d’un coup.
- **visits** : nombre de simulations/visites MCTS pour un coup ou une position.
- **winrate** : probabilité estimée de victoire (par couleur).
- **policy** : distribution de probabilité des coups proposée par le réseau de neurones.

### Acronymes

- **MCTS** : Monte Carlo Tree Search.
- **WASM** : WebAssembly.
- **PWA** : Progressive Web App.
- **NN** : Neural Network (réseau de neurones).
- **GPU** : Graphics Processing Unit.
- **SGF** : Smart Game Format.

### v1.1 (Mars 2026)
- **Axe 1 — Moteur d’analyse robuste (KataGo “production‑grade”)**
  - Profils d’analyse (rapide/standard/pro)
  - Gestion visites/temps par profil
  - Monitoring erreurs + fallback local
- **Axe 2 — Score & territoire explicites (ownership)**
  - ScoreLead consolidé + estimation territoires
  - Heatmap ownership (361 cases)
  - Affichage impact coup (Δ score)
- **Axe 4 — Exploration des variations (arbre d’analyse)**
  - Arbre de variations navigable
  - Comparaison A/B des lignes
- **Axe 5 — Compatibilité SGF avancée**
  - Import/export complet (variantes, commentaires, symboles)
  - Compatibilité stricte SGF v4
- ✨ Règles Go intégrées (légalité coups, captures)
- ✨ Détection Ko, sugo
- 🐛 Corrections OCR confiance basse
- 🎨 Thèmes (clair/sombre)

### v1.2 (Juin 2026)
- **Axe 1 — Moteur d’analyse robuste (optimisations)**
  - Cache multi‑positions (IndexedDB)
  - Priorités d’analyse (par coup, par variation)
- **Axe 2 — Score & territoire explicites (avancé)**
  - Komi dynamique + réglages
  - Indicateur d’incertitude (LCB)
- **Axe 4 — Exploration des variations**
  - Marquage favoris + tags de lignes
- **Axe 5 — Compatibilité SGF avancée**
  - Export annotations enrichies (triangles/carrés/cercles)

### v2.0 (T1 2027)
- **Axe 3 — Coaching & pédagogie**
  - Feedback par coup (erreur, suggestion, explication)
  - Résumé pédagogique de la partie
- **Axe 3 — Coaching & pédagogie (modes d’analyse)**
  - Débutant/Intermédiaire/Avancé
  - Seuils de tolérance et objectifs d’étude
- 🔄 Sync cloud (Google Drive, Dropbox)
- 👥 Multiplayer local (2 joueurs, 1 device)
- 📚 Bibliothèque parties publiques
- 🔔 Notifications (PWA push)
- 🌐 Plus de langues (JP, ZH, ...)

### v3.0+ (Futur)
- ☁️ Backend central (comptes, chat, matchmaking)
- 🎮 Jeu multiplayer online
- 📊 Statistiques joueur
- 🧠 Apprentissage (exercices)

---

## 8. CRITÈRES DE SUCCÈS MVP (v1.0)

| Critère | État | Notes |
|---|---|---|
| SF/ST v1.0 rédigées | ✅ | Ce document + ST-TECH.md |
| Scaffold PWA | ✅ | React + Vite + TypeScript |
| Créer/éditer partie | ✅ | Plateau 19×19 interactif |
| Variantes & annotations | ✅ | Édition complète |
| SGF import/export | ✅ | Parser + sérializer |
| KataGo analyse | ✅ | Win%, top coups, points |
| OCR photo | ✅ | TensorFlow.js, >70% |
| IndexedDB save | ✅ | Auto-save chaque coup |
| i18n FR/EN | ✅ | Toutes traductions |
| Offline-first | ✅ | Service Worker + cache |
| Mobile responsive | ✅ | Tous breakpoints |
| Tests e2e | ✅ | Playwright : offline, OCR, SGF |
| Docs code | ✅ | TSDoc, architecture.md |
| Déploiement | ✅ | GitHub Pages / Netlify |

**MVP réussi** = 13/13 critères validés + 0 bugs critiques

---

## 9. HISTORIQUE & CHANGELOG

**v1.0** (2026-02-03)
- 🎉 Initialisation specs SF/ST
- ✨ 10 user stories principales
- 📊 Modèles de données définis
- 🗓️ Roadmap v1.1-v3.0

---

**Fin SF v1.0**
