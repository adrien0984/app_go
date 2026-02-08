# QUICK START GUIDE - GoAI Editor

## ⚡ 5 Minutes Setup

### 1️⃣ Installation

```bash
# Navigate to workspace
cd c:\Users\Adrien\workspace

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Résultat** : App ouvre sur http://localhost:5173 ✅

---

### 2️⃣ Tester l'App

**Menu Parties** :
1. Cliquez "+ Nouvelle Partie"
2. Remplissez le form (titre, joueurs)
3. Cliquez "Enregistrer"
4. ✅ Vous êtes en éditeur !

**Sélecteur Langue** :
- Top-right header : cliquez FR/EN
- Interface change immédiatement
- Préférence sauvegardée (localStorage)

**Créer 2 parties** :
- Partie 1 : "Mon Problème" (Noir vs Blanc)
- Partie 2 : "Exercice" (Noir vs Blanc)
- Revenez au menu → listées avec dates

---

### 3️⃣ Commandes Utiles

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run type-check      # Check TypeScript errors
npm run lint            # Run ESLint
npm run format          # Format code with Prettier

# Building
npm run build           # Optimized production build
npm run preview         # Preview production build locally

# Testing (après Phase 2)
npm test                # Run unit tests
npm run test:ui         # Visual test runner
npm run test:e2e        # End-to-end tests
```

---

### 4️⃣ Fichiers Importants à Connaître

**Configurations** :
- `package.json` → Dépendances + scripts
- `vite.config.ts` → Vite + PWA
- `tsconfig.json` → TypeScript strict
- `.eslintrc.json` → ESLint rules

**Source Code** :
- `src/App.tsx` → Root component
- `src/components/` → Composants React
- `src/store/` → Redux store
- `src/services/StorageService.ts` → IndexedDB

**Documentation** :
- `README.md` → Guide principal
- `ARCHITECTURE.md` → Détails techniques
- `SF-SPECIFICATIONS-FONCTIONNELLES.md` → Features
- `ST-SPECIFICATIONS-TECHNIQUES.md` → Architecture

---

### 5️⃣ Structure Dossiers

```
workspace/
├── src/
│   ├── components/          # Composants React
│   │   ├── GameMenu.tsx
│   │   ├── GameEditor.tsx
│   │   └── LanguageSelector.tsx
│   ├── services/            # Business logic
│   │   └── StorageService.ts
│   ├── store/               # Redux
│   │   ├── slices/
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   ├── locales/             # Traductions
│   │   ├── fr.json
│   │   └── en.json
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.ts                # Service Worker
├── package.json             # Dépendances
├── vite.config.ts           # Vite config
├── index.html               # HTML
└── [Documentation files]
```

---

## 🎯 Next Phase (Phase 2)

**Après ce scaffold, implémenter** :

1. **Board Interactif** (Canvas 19×19)
   - Plateau clickable
   - Placer coups (noir/blanc alternance)
   - Numérotation

2. **SGF Parser**
   - Importer fichiers SGF
   - Exporter vers SGF
   - Variantes support

3. **KataGo IA**
   - Web Worker wrapper
   - Analyse position
   - Win rate affichage

4. **OCR Photos**
   - TensorFlow.js
   - Détection stones
   - Board extraction

5. **Tests & Deploy**
   - E2E tests (Playwright)
   - Offline validation
   - GitHub Pages deploy

---

## 🚨 Troubleshooting

### ❌ Erreur : "npm: command not found"
```bash
# Installer Node.js 18+ depuis https://nodejs.org
node --version  # Doit être v18+
```

### ❌ Erreur Port 5173 déjà utilisé
```bash
# Vite utilisera le prochain port disponible automatiquement
# Ou spécifier un port :
npm run dev -- --port 3000
```

### ❌ Erreur TypeScript
```bash
npm run type-check
# Fix avec ESLint :
npm run lint:fix
```

### ❌ Cache issue (ancien code)
```bash
# Clear cache + reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🧪 Test Offline Mode

```
1. Démarrer l'app (npm run dev)
2. Créer une partie
3. Chrome DevTools → Network tab
4. Cochez "Offline"
5. Rechargez la page (Ctrl+R)
6. ✅ App doit être fonctionnelle (menu + parties sauvegardées)
```

---

## 📱 Test Mobile Responsive

```
Chrome DevTools → Device Toolbar (Ctrl+Shift+M)
- iPhone 12
- iPad
- Samsung Galaxy

Vérifier :
- Menu responsive
- Buttons > 44px
- Text readable sans zoom
```

---

## 🚀 Deployer sur GitHub Pages

```bash
# 1. Build
npm run build

# 2. Commit
git add .
git commit -m "v1.0: Initial MVP scaffold"

# 3. Push (GitHub Actions auto-deploy)
git push origin main

# ✅ App accessible sur :
# https://your-username.github.io/go-ai-editor
```

---

## 📊 Bundle Size Check

```bash
npm run build
# Résultat : dist/ folder

# Check sizes :
ls -lh dist/
# index.html    ~5 KB
# assets/*.js   ~1.5 MB (React + Redux + i18n)
# assets/*.css  ~50 KB
```

---

## ❓ Questions ?

**Relire** :
- `README.md` → Overview + installation
- `ARCHITECTURE.md` → Flux données + optimisations
- `SF-SPECIFICATIONS-FONCTIONNELLES.md` → Features
- `ST-SPECIFICATIONS-TECHNIQUES.md` → Stack details

---

## ✅ Checklist Start

- [ ] `npm install` completed
- [ ] `npm run dev` working (localhost:5173)
- [ ] Menu "Nouvelle Partie" creates game
- [ ] Language selector (FR/EN) works
- [ ] Create 2 test games
- [ ] Reload page → games persist ✅
- [ ] Read ARCHITECTURE.md
- [ ] Ready for Phase 2 ✅

**Once completed** → Start implementing Board.tsx (Canvas 19×19) ! 🚀

---

**GoAI Editor Quick Start**  
v1.0 MVP Scaffold
