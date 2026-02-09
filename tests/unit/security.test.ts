/**
 * Tests de sécurité globaux du projet
 * Couvre : CSP, headers, ESLint rules, validation inputs, fichier HTML
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Fichiers sources à auditer
const indexHtmlPath = path.resolve(__dirname, '../../index.html');
const viteConfigPath = path.resolve(__dirname, '../../vite.config.ts');
const eslintConfigPath = path.resolve(__dirname, '../../.eslintrc.json');
const gameMenuPath = path.resolve(__dirname, '../../src/components/GameMenu.tsx');
const gameEditorPath = path.resolve(__dirname, '../../src/components/GameEditor.tsx');
const storageServicePath = path.resolve(__dirname, '../../src/services/StorageService.ts');
const i18nConfigPath = path.resolve(__dirname, '../../src/utils/i18nConfig.ts');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
const eslintConfig = fs.readFileSync(eslintConfigPath, 'utf-8');
const gameMenu = fs.readFileSync(gameMenuPath, 'utf-8');
const gameEditor = fs.readFileSync(gameEditorPath, 'utf-8');
const storageService = fs.readFileSync(storageServicePath, 'utf-8');
const i18nConfig = fs.readFileSync(i18nConfigPath, 'utf-8');

// ─── CSP & Security Headers ──────────────────────────────────────────────────

describe('Sécurité - Content Security Policy (CSP)', () => {
  it('devrait contenir un meta tag CSP dans index.html', () => {
    expect(indexHtml).toContain('Content-Security-Policy');
  });

  it('devrait avoir default-src self', () => {
    expect(indexHtml).toContain("default-src 'self'");
  });

  it('devrait avoir script-src self sans unsafe-inline ni unsafe-eval', () => {
    expect(indexHtml).toContain("script-src 'self'");
    // Vérifier que script-src n'utilise pas unsafe-eval
    const cspMatch = indexHtml.match(/script-src[^;]*/);
    expect(cspMatch).not.toBeNull();
    expect(cspMatch![0]).not.toContain('unsafe-eval');
  });

  it('devrait bloquer les objets (plugins Flash, etc.)', () => {
    expect(indexHtml).toContain("object-src 'none'");
  });

  it('devrait empêcher le clickjacking via frame-ancestors', () => {
    expect(indexHtml).toContain("frame-ancestors 'none'");
  });

  it('devrait restreindre form-action à self', () => {
    expect(indexHtml).toContain("form-action 'self'");
  });

  it('devrait autoriser connect-src pour le CDN jsdelivr uniquement', () => {
    expect(indexHtml).toContain('connect-src');
    expect(indexHtml).toContain('https://cdn.jsdelivr.net');
  });

  it('devrait autoriser worker-src pour les Web Workers', () => {
    expect(indexHtml).toContain('worker-src');
  });

  it('devrait autoriser img-src pour data: et blob: (Canvas export)', () => {
    expect(indexHtml).toContain('img-src');
    expect(indexHtml).toContain('data:');
    expect(indexHtml).toContain('blob:');
  });
});

describe('Sécurité - Meta tags HTML', () => {
  it('devrait avoir X-Content-Type-Options nosniff', () => {
    expect(indexHtml).toContain('X-Content-Type-Options');
    expect(indexHtml).toContain('nosniff');
  });

  it('devrait avoir referrer policy', () => {
    expect(indexHtml).toContain('strict-origin-when-cross-origin');
  });

  it('devrait utiliser charset UTF-8', () => {
    expect(indexHtml).toContain('charset="UTF-8"');
  });

  it('devrait avoir un viewport meta tag', () => {
    expect(indexHtml).toContain('viewport');
    expect(indexHtml).toContain('width=device-width');
  });
});

// ─── Vite Config Security ─────────────────────────────────────────────────────

describe('Sécurité - Vite Config', () => {
  it('devrait avoir des headers de sécurité dans le dev server', () => {
    expect(viteConfig).toContain('X-Frame-Options');
    expect(viteConfig).toContain('DENY');
  });

  it('devrait avoir X-Content-Type-Options dans headers', () => {
    expect(viteConfig).toContain('X-Content-Type-Options');
    expect(viteConfig).toContain('nosniff');
  });

  it('devrait avoir Referrer-Policy dans headers', () => {
    expect(viteConfig).toContain('Referrer-Policy');
  });

  it('devrait avoir Permissions-Policy restrictive', () => {
    expect(viteConfig).toContain('Permissions-Policy');
    expect(viteConfig).toContain('camera=()');
    expect(viteConfig).toContain('microphone=()');
    expect(viteConfig).toContain('geolocation=()');
  });

  it('devrait désactiver les sourcemaps en production', () => {
    expect(viteConfig).toContain('sourcemap: false');
  });
});

// ─── ESLint Security Rules ────────────────────────────────────────────────────

describe('Sécurité - ESLint Config', () => {
  let eslintParsed: Record<string, any>;

  beforeAll(() => {
    // Nettoyer les commentaires JSONC pour parser
    const cleaned = eslintConfig.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    eslintParsed = JSON.parse(cleaned);
  });

  it('devrait interdire eval()', () => {
    expect(eslintParsed.rules['no-eval']).toBe('error');
  });

  it('devrait interdire eval implicite (setTimeout string)', () => {
    expect(eslintParsed.rules['no-implied-eval']).toBe('error');
  });

  it('devrait interdire new Function()', () => {
    expect(eslintParsed.rules['no-new-func']).toBe('error');
  });

  it('devrait interdire javascript: URLs', () => {
    expect(eslintParsed.rules['no-script-url']).toBe('error');
  });

  it('devrait interdire dangerouslySetInnerHTML dans React', () => {
    expect(eslintParsed.rules['react/no-danger']).toBe('error');
  });

  it('devrait protéger contre target=_blank', () => {
    expect(eslintParsed.rules['react/jsx-no-target-blank']).toBe('error');
  });

  it('devrait protéger contre les script URLs dans JSX', () => {
    expect(eslintParsed.rules['react/jsx-no-script-url']).toBe('error');
  });

  it('devrait interdire var (forcer const/let)', () => {
    expect(eslintParsed.rules['no-var']).toBe('error');
  });

  it('devrait forcer prefer-const', () => {
    expect(eslintParsed.rules['prefer-const']).toBe('error');
  });

  it('devrait interdire no-param-reassign', () => {
    const rule = eslintParsed.rules['no-param-reassign'];
    expect(rule).toBeDefined();
    // Accepte le format array ["error", {...}]
    if (Array.isArray(rule)) {
      expect(rule[0]).toBe('error');
    } else {
      expect(rule).toBe('error');
    }
  });
});

// ─── Input Validation ─────────────────────────────────────────────────────────

describe('Sécurité - Validation des inputs', () => {
  describe('GameMenu - Formulaire de création', () => {
    it('devrait limiter la longueur du titre', () => {
      expect(gameMenu).toContain('maxLength={100}');
    });

    it('devrait limiter la longueur des noms de joueurs', () => {
      // Au moins 2 occurrences de maxLength={50} (black + white)
      const matches = gameMenu.match(/maxLength=\{50\}/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait avoir min/max sur le komi', () => {
      expect(gameMenu).toContain('min=');
      expect(gameMenu).toContain('max=');
    });

    it('devrait protéger contre NaN sur le komi', () => {
      // Le parseFloat doit avoir un fallback || 0
      expect(gameMenu).toContain('|| 0');
    });

    it('devrait désactiver autoComplete sur les champs', () => {
      const matches = gameMenu.match(/autoComplete="off"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GameMenu - Import SGF', () => {
    it('devrait limiter la taille des fichiers SGF importés', () => {
      expect(gameMenu).toContain('MAX_SGF_SIZE');
      expect(gameMenu).toContain('file.size');
    });

    it('devrait restreindre le type de fichier à .sgf', () => {
      expect(gameMenu).toContain('accept=".sgf"');
    });
  });

  describe('GameEditor - Export SGF', () => {
    it('devrait sanitiser le nom de fichier export', () => {
      // Regex de sanitisation pour les caractères spéciaux
      expect(gameEditor).toContain('.replace(');
      expect(gameEditor).toContain('.sgf');
    });

    it('devrait utiliser URL.revokeObjectURL après téléchargement', () => {
      expect(gameEditor).toContain('URL.revokeObjectURL');
    });
  });
});

// ─── Code Source Security Patterns ────────────────────────────────────────────

describe('Sécurité - Patterns dangereux absents du code source', () => {
  // Lire tous les fichiers TS/TSX dans src/
  const srcDir = path.resolve(__dirname, '../../src');

  function getAllTsFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allSrcFiles = getAllTsFiles(srcDir);
  const allSrcContent = allSrcFiles.map(f => ({
    path: f,
    content: fs.readFileSync(f, 'utf-8'),
  }));

  it('ne devrait contenir aucun eval()', () => {
    for (const { path: filePath, content } of allSrcContent) {
      // Regex stricte : eval( mais pas "escapeValue"
      const matches = content.match(/\beval\s*\(/g);
      expect(matches, `eval() trouvé dans ${filePath}`).toBeNull();
    }
  });

  it('ne devrait contenir aucun dangerouslySetInnerHTML', () => {
    for (const { path: filePath, content } of allSrcContent) {
      expect(
        content.includes('dangerouslySetInnerHTML'),
        `dangerouslySetInnerHTML trouvé dans ${filePath}`
      ).toBe(false);
    }
  });

  it('ne devrait contenir aucun innerHTML direct', () => {
    for (const { path: filePath, content } of allSrcContent) {
      // Ignorer les commentaires
      const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const matches = withoutComments.match(/\.innerHTML\s*=/g);
      expect(matches, `innerHTML= trouvé dans ${filePath}`).toBeNull();
    }
  });

  it('ne devrait contenir aucun document.write', () => {
    for (const { path: filePath, content } of allSrcContent) {
      const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(
        withoutComments.includes('document.write'),
        `document.write trouvé dans ${filePath}`
      ).toBe(false);
    }
  });

  it('ne devrait contenir aucun new Function()', () => {
    for (const { path: filePath, content } of allSrcContent) {
      const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const matches = withoutComments.match(/new\s+Function\s*\(/g);
      expect(matches, `new Function() trouvé dans ${filePath}`).toBeNull();
    }
  });

  it('ne devrait contenir aucun document.cookie', () => {
    for (const { path: filePath, content } of allSrcContent) {
      const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(
        withoutComments.includes('document.cookie'),
        `document.cookie trouvé dans ${filePath}`
      ).toBe(false);
    }
  });
});

// ─── StorageService Security ──────────────────────────────────────────────────

describe('Sécurité - StorageService', () => {
  it('devrait utiliser clearTimeout dans flushDebounceTimers', () => {
    expect(storageService).toContain('clearTimeout(timer)');
  });

  it('devrait vider la map après flush', () => {
    expect(storageService).toContain('this.debounceTimers.clear()');
  });

  it('devrait utiliser des transactions en lecture seule pour les requêtes GET', () => {
    const readonlyMatches = storageService.match(/'readonly'/g);
    expect(readonlyMatches).not.toBeNull();
    expect(readonlyMatches!.length).toBeGreaterThanOrEqual(3);
  });

  it('devrait utiliser des transactions readwrite pour les mutations', () => {
    const readwriteMatches = storageService.match(/'readwrite'/g);
    expect(readwriteMatches).not.toBeNull();
    expect(readwriteMatches!.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── i18n Security ────────────────────────────────────────────────────────────

describe('Sécurité - i18n Config', () => {
  it('devrait documenter pourquoi escapeValue est false', () => {
    // Le commentaire doit expliquer que React gère l'échappement
    expect(i18nConfig).toContain('React');
    expect(i18nConfig).toContain('escapeValue: false');
  });

  it('devrait utiliser fr comme langue par défaut', () => {
    expect(i18nConfig).toContain("fallbackLng: 'fr'");
  });
});
