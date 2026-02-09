/**
 * Tests unitaires pour la sécurité du Service Worker
 * Vérifie : origins autorisées, rejet opaque, fallback offline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Lire le code source du SW pour tester sa logique
const swSourcePath = path.resolve(__dirname, '../../public/sw.ts');
const swSource = fs.readFileSync(swSourcePath, 'utf-8');

describe('Service Worker - Sécurité (analyse statique)', () => {
  describe('Filtrage des origines', () => {
    it('devrait contenir une allowlist d\'origines', () => {
      expect(swSource).toContain('allowedOrigins');
      expect(swSource).toContain('self.location.origin');
      expect(swSource).toContain('https://cdn.jsdelivr.net');
    });

    it('devrait vérifier isAllowedOrigin avant de cacher', () => {
      expect(swSource).toContain('isAllowedOrigin');
      // Le code devrait retourner (ne pas cacher) si l'origine n'est pas autorisée
      expect(swSource).toContain('if (!isAllowedOrigin)');
    });

    it('devrait parser l\'URL pour extraire l\'origin', () => {
      expect(swSource).toContain('new URL(request.url)');
      expect(swSource).toContain('requestUrl.origin');
    });
  });

  describe('Filtrage des méthodes HTTP', () => {
    it('devrait rejeter les requêtes non-GET', () => {
      expect(swSource).toContain("request.method !== 'GET'");
    });
  });

  describe('Filtrage des réponses', () => {
    it('devrait rejeter les réponses opaques', () => {
      expect(swSource).toContain("response.type === 'opaque'");
    });

    it('devrait rejeter les réponses en erreur', () => {
      expect(swSource).toContain("response.type === 'error'");
    });

    it('devrait n\'accepter que les réponses 200', () => {
      expect(swSource).toContain('response.status !== 200');
    });
  });

  describe('Gestion des erreurs réseau', () => {
    it('devrait avoir un catch pour les erreurs fetch', () => {
      expect(swSource).toContain('.catch(');
    });

    it('devrait retourner une réponse 503 en cas d\'erreur', () => {
      expect(swSource).toContain('503');
      expect(swSource).toContain('Service Unavailable');
    });
  });

  describe('Stratégie de cache', () => {
    it('devrait utiliser cache-first (caches.match avant fetch)', () => {
      const matchIndex = swSource.indexOf('caches.match(request)');
      const fetchIndex = swSource.indexOf('fetch(request)');
      expect(matchIndex).toBeGreaterThan(-1);
      expect(fetchIndex).toBeGreaterThan(-1);
      // cache.match doit apparaître avant fetch dans le code
      expect(matchIndex).toBeLessThan(fetchIndex);
    });

    it('devrait clone la réponse avant mise en cache', () => {
      expect(swSource).toContain('response.clone()');
    });
  });

  describe('Nettoyage de caches', () => {
    it('devrait supprimer les anciens caches lors de l\'activation', () => {
      expect(swSource).toContain('caches.keys()');
      expect(swSource).toContain('caches.delete(cacheName)');
    });

    it('devrait garder uniquement le cache courant', () => {
      expect(swSource).toContain('cacheName !== CACHE_NAME');
    });
  });
});

describe('Service Worker - Logique filtrage origines (simulation)', () => {
  const allowedOrigins = ['http://localhost:5173', 'https://cdn.jsdelivr.net'];

  function isAllowedOrigin(url: string, selfOrigin: string): boolean {
    const allowed = [selfOrigin, 'https://cdn.jsdelivr.net'];
    const requestUrl = new URL(url);
    return allowed.some(origin => requestUrl.origin === origin);
  }

  it('devrait autoriser les requêtes same-origin', () => {
    expect(isAllowedOrigin('http://localhost:5173/index.html', 'http://localhost:5173')).toBe(true);
  });

  it('devrait autoriser les requêtes vers cdn.jsdelivr.net', () => {
    expect(isAllowedOrigin('https://cdn.jsdelivr.net/npm/package@1.0/file.js', 'http://localhost:5173')).toBe(true);
  });

  it('devrait rejeter les requêtes vers des origines inconnues', () => {
    expect(isAllowedOrigin('https://evil.com/malicious.js', 'http://localhost:5173')).toBe(false);
  });

  it('devrait rejeter les origines similaires mais différentes', () => {
    expect(isAllowedOrigin('https://cdn.jsdelivr.net.evil.com/payload', 'http://localhost:5173')).toBe(false);
  });

  it('devrait gérer les URLs avec ports différents', () => {
    expect(isAllowedOrigin('http://localhost:3000/api', 'http://localhost:5173')).toBe(false);
  });

  it('devrait gérer les protocoles différents', () => {
    expect(isAllowedOrigin('http://cdn.jsdelivr.net/file.js', 'http://localhost:5173')).toBe(false);
  });
});
