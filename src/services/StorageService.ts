import type { Game } from '@/types/game';
import type { Evaluation } from '@/types/game';
import type { OCRResult } from '@/types/ocr';

const DB_NAME = 'GoAIEditor';
const DB_VERSION = 1;

class StorageService {
  private db: IDBDatabase | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Games store
        if (!db.objectStoreNames.contains('games')) {
          const gameStore = db.createObjectStore('games', { keyPath: 'id' });
          gameStore.createIndex('createdAt', 'createdAt', { unique: false });
          gameStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Evaluations store
        if (!db.objectStoreNames.contains('evaluations')) {
          const evalStore = db.createObjectStore('evaluations', { keyPath: 'id' });
          evalStore.createIndex('gameId', 'gameId', { unique: false });
          evalStore.createIndex('moveId', 'moveId', { unique: false });
        }

        // OCR Results store
        if (!db.objectStoreNames.contains('ocrResults')) {
          const ocrStore = db.createObjectStore('ocrResults', { keyPath: 'id' });
          ocrStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }

  async saveGame(game: Game): Promise<string> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['games'], 'readwrite');
      const store = tx.objectStore('games');
      const request = store.put(game);

      request.onsuccess = () => {
        resolve(game.id);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Sauvegarde auto-debouncée (300ms par défaut)
   * Idéal pour auto-sauver lors de chaque coup sans surcharger IDB
   * @param game - Jeu à sauvegarder
   * @param delayMs - Délai debounce en ms (défaut 300ms)
   */
  async saveGameDebounced(game: Game, delayMs: number = 300): Promise<void> {
    const gameId = game.id;

    // Annuler timer précédent si existe
    if (this.debounceTimers.has(gameId)) {
      clearTimeout(this.debounceTimers.get(gameId)!);
    }

    // Créer nouveau timer debounced
    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          await this.saveGame(game);
          this.debounceTimers.delete(gameId);
          resolve();
        } catch (error) {
          console.error('Auto-save failed:', error);
          this.debounceTimers.delete(gameId);
          resolve(); // Ne pas rejeter pour ne pas bloquer le flux
        }
      }, delayMs);

      this.debounceTimers.set(gameId, timer);
    });
  }

  async loadGame(id: string): Promise<Game | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['games'], 'readonly');
      const store = tx.objectStore('games');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async listGames(): Promise<Game[]> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['games'], 'readonly');
      const store = tx.objectStore('games');
      const index = store.index('updatedAt');
      const request = index.getAll();

      request.onsuccess = () => {
        // Sort by updatedAt descending
        const games = (request.result as Game[]).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(games);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteGame(id: string): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['games'], 'readwrite');
      const store = tx.objectStore('games');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Evaluations
  async saveEvaluation(evaluation: Evaluation): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['evaluations'], 'readwrite');
      const store = tx.objectStore('evaluations');
      const request = store.put(evaluation);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getEvaluation(moveId: string): Promise<Evaluation | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['evaluations'], 'readonly');
      const store = tx.objectStore('evaluations');
      const index = store.index('moveId');
      const request = index.get(moveId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // OCR Results
  async saveOCRResult(result: OCRResult): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['ocrResults'], 'readwrite');
      const store = tx.objectStore('ocrResults');
      const request = store.put(result);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getOCRResult(id: string): Promise<OCRResult | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['ocrResults'], 'readonly');
      const store = tx.objectStore('ocrResults');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  /**
   * Flush tous les debounce timers en attente
   * Utile au unmount d'un composant pour garantir la sauvegarde
   */
  async flushDebounceTimers(): Promise<void> {
    // Annuler tous les timers en attente pour éviter des fuites mémoire
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}

export default new StorageService();
