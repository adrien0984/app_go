/**
 * Hook personnalisé pour auto-save debounced
 * Utile pour sauvegarder automatiquement les parties à chaque coup
 * @module hooks/useAutoSave
 */

import { useEffect, useRef } from 'react';
import { Game } from '@/types/game';
import StorageService from '@/services/StorageService';

/**
 * Hook auto-save avec debounce
 * @param game - Partie à sauvegarder
 * @param enabled - Activer auto-save (par défaut true)
 * @param delayMs - Délai debounce en ms (par défaut 500ms)
 *
 * @example
 * useAutoSave(currentGame, true, 500);
 */
export function useAutoSave(
  game: Game | null,
  enabled: boolean = true,
  delayMs: number = 500
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!game || !enabled) return;

    // Nettoyer timer précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Créer nouveau timer debounced
    timeoutRef.current = setTimeout(async () => {
      try {
        await StorageService.saveGame(game);
        console.debug('Auto-save: Partie sauvegardée', game.title);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, delayMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [game, enabled, delayMs]);

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
