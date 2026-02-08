/**
 * Service SGF - Import/Export au format Smart Game Format
 * Supporte SGF FF[4] avec propriétés standard du Go
 * @module services/SGFService
 */

import { v4 as uuidv4 } from 'uuid';
import type { Game, Move, Color, BoardSize } from '@/types/game';

/**
 * Nœud SGF parsé (représentation intermédiaire)
 */
interface SGFNode {
  properties: Record<string, string[]>;
  children: SGFNode[];
}

/**
 * Résultat du parsing SGF
 */
export interface SGFParseResult {
  game: Game;
  warnings: string[];
}

/**
 * Options d'export SGF
 */
export interface SGFExportOptions {
  /** Inclure les commentaires */
  includeComments?: boolean;
  /** Inclure les annotations/symboles */
  includeAnnotations?: boolean;
  /** Application name pour AP[] */
  appName?: string;
}

const DEFAULT_EXPORT_OPTIONS: SGFExportOptions = {
  includeComments: true,
  includeAnnotations: true,
  appName: 'GoAI Editor:1.1',
};

/**
 * Service SGF statique pour import/export de parties Go
 *
 * @example
 * // Import
 * const { game, warnings } = SGFService.parse(sgfString);
 *
 * // Export
 * const sgf = SGFService.serialize(game);
 */
export class SGFService {
  // =========================================================================
  // PARSING (SGF → Game)
  // =========================================================================

  /**
   * Parse une chaîne SGF et retourne un objet Game
   *
   * @param sgfContent - Contenu SGF brut
   * @returns Résultat avec Game parsé et warnings éventuels
   * @throws Error si le SGF est invalide (syntaxe)
   */
  static parse(sgfContent: string): SGFParseResult {
    const warnings: string[] = [];
    const trimmed = sgfContent.trim();

    if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
      throw new Error('Format SGF invalide : doit commencer par "(" et finir par ")"');
    }

    // Parser l'arbre SGF
    const rootNode = SGFService.parseTree(trimmed);

    if (!rootNode) {
      throw new Error('Format SGF invalide : arbre vide');
    }

    // Extraire métadonnées du nœud racine
    const props = rootNode.properties;

    // Taille du plateau
    let boardSize: BoardSize = 19;
    if (props['SZ']) {
      const sz = parseInt(props['SZ'][0], 10);
      if (sz === 9 || sz === 13 || sz === 19) {
        boardSize = sz;
      } else {
        warnings.push(`Taille de plateau ${sz} non supportée, défaut 19×19`);
      }
    }

    // Komi
    let komi = 6.5;
    if (props['KM']) {
      const km = parseFloat(props['KM'][0]);
      if (!isNaN(km)) {
        komi = km;
      }
    }

    // Handicap
    let handicap = 0;
    if (props['HA']) {
      const ha = parseInt(props['HA'][0], 10);
      if (!isNaN(ha)) {
        handicap = ha;
      }
    }

    // Créer le Game
    const game: Game = {
      id: uuidv4(),
      title: SGFService.getProperty(props, 'GN', 'Partie importée'),
      createdAt: new Date(),
      updatedAt: new Date(),
      blackPlayer: SGFService.getProperty(props, 'PB', 'Noir'),
      whitePlayer: SGFService.getProperty(props, 'PW', 'Blanc'),
      boardSize,
      komi,
      handicap,
      rootMoves: [],
      variants: [],
      event: SGFService.getPropertyOrNull(props, 'EV'),
      date: SGFService.getPropertyOrNull(props, 'DT'),
      result: SGFService.getPropertyOrNull(props, 'RE'),
      comment: SGFService.getPropertyOrNull(props, 'C'),
      evaluations: [],
    };

    // Extraire les coups depuis les nœuds enfants
    const moves = SGFService.extractMoves(rootNode, boardSize, warnings);
    game.rootMoves = moves;

    return { game, warnings };
  }

  /**
   * Parse l'arbre SGF récursivement
   */
  private static parseTree(sgf: string): SGFNode {
    // Retirer les parenthèses externes
    let content = sgf.slice(1, -1).trim();

    const root: SGFNode = { properties: {}, children: [] };
    let currentNode: SGFNode = root;
    let i = 0;

    while (i < content.length) {
      const ch = content[i];

      if (ch === ';') {
        // Nouveau nœud
        if (Object.keys(currentNode.properties).length > 0 || currentNode !== root) {
          const newNode: SGFNode = { properties: {}, children: [] };
          currentNode.children.push(newNode);
          currentNode = newNode;
        }
        i++;
        // Parser les propriétés de ce nœud
        i = SGFService.parseNodeProperties(content, i, currentNode);
      } else if (ch === '(') {
        // Sous-arbre (variation)
        const endIdx = SGFService.findMatchingParen(content, i);
        const subtree = content.slice(i, endIdx + 1);
        const childNode = SGFService.parseTree(subtree);
        currentNode.children.push(childNode);
        i = endIdx + 1;
      } else {
        i++;
      }
    }

    return root;
  }

  /**
   * Parse les propriétés d'un nœud SGF à partir de la position i
   * @returns Nouvelle position dans la chaîne
   */
  private static parseNodeProperties(content: string, start: number, node: SGFNode): number {
    let i = start;

    while (i < content.length) {
      // Skip whitespace
      while (i < content.length && /\s/.test(content[i])) i++;

      // Vérifier si on arrive à un nouveau nœud ou sous-arbre
      if (i >= content.length || content[i] === ';' || content[i] === '(') {
        break;
      }

      // Lire le nom de propriété (lettres majuscules)
      let propName = '';
      while (i < content.length && /[A-Z]/.test(content[i])) {
        propName += content[i];
        i++;
      }

      if (!propName) {
        i++;
        continue;
      }

      // Lire les valeurs entre crochets
      const values: string[] = [];
      while (i < content.length && content[i] === '[') {
        i++; // skip '['
        let value = '';
        while (i < content.length && content[i] !== ']') {
          // Gestion des caractères échappés
          if (content[i] === '\\' && i + 1 < content.length) {
            i++;
            value += content[i];
          } else {
            value += content[i];
          }
          i++;
        }
        if (i < content.length) i++; // skip ']'
        values.push(value);
      }

      if (propName && values.length > 0) {
        node.properties[propName] = values;
      }
    }

    return i;
  }

  /**
   * Trouve la parenthèse fermante correspondante
   */
  private static findMatchingParen(content: string, start: number): number {
    let depth = 0;
    let inBracket = false;

    for (let i = start; i < content.length; i++) {
      const ch = content[i];

      if (ch === '\\' && inBracket) {
        i++; // skip escaped char
        continue;
      }

      if (ch === '[') inBracket = true;
      else if (ch === ']') inBracket = false;
      else if (!inBracket) {
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }

    return content.length - 1;
  }

  /**
   * Extrait les coups depuis l'arbre SGF
   */
  private static extractMoves(
    node: SGFNode,
    boardSize: BoardSize,
    warnings: string[]
  ): Move[] {
    const moves: Move[] = [];
    let moveNumber = 1;

    const traverse = (n: SGFNode): void => {
      // Vérifier si ce nœud contient un coup
      const blackMove = n.properties['B'];
      const whiteMove = n.properties['W'];

      if (blackMove || whiteMove) {
        const color: Color = blackMove ? 'B' : 'W';
        const sgfCoord = (blackMove || whiteMove)![0];

        // Pass move (chaîne vide ou 'tt' pour 19×19)
        if (!sgfCoord || sgfCoord === '' || (boardSize === 19 && sgfCoord === 'tt')) {
          // Ignorer les pass moves (pas de position)
          warnings.push(`Coup ${moveNumber} : pass move ignoré`);
        } else {
          const pos = SGFService.sgfToPosition(sgfCoord);
          if (pos && pos.x >= 0 && pos.x < boardSize && pos.y >= 0 && pos.y < boardSize) {
            const comment = SGFService.getPropertyOrNull(n.properties, 'C');
            moves.push({
              id: uuidv4(),
              moveNumber,
              color,
              x: pos.x,
              y: pos.y,
              comment,
              symbols: null,
              variants: [],
              parentMoveId: moves.length > 0 ? moves[moves.length - 1].id : null,
              createdAt: new Date(),
            });
            moveNumber++;
          } else {
            warnings.push(`Coup ${moveNumber} : coordonnées SGF invalides "${sgfCoord}"`);
          }
        }
      }

      // Parcourir le premier enfant (ligne principale)
      if (n.children.length > 0) {
        traverse(n.children[0]);
      }
    };

    traverse(node);
    return moves;
  }

  // =========================================================================
  // SERIALIZATION (Game → SGF)
  // =========================================================================

  /**
   * Sérialise un objet Game en chaîne SGF
   *
   * @param game - Partie à exporter
   * @param options - Options d'export
   * @returns Chaîne SGF valide
   */
  static serialize(game: Game, options: SGFExportOptions = {}): string {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    let sgf = '(;';

    // Propriétés racine
    sgf += `FF[4]`; // File Format 4
    sgf += `GM[1]`; // Game type: Go
    sgf += `SZ[${game.boardSize}]`;
    sgf += `KM[${game.komi}]`;

    if (opts.appName) {
      sgf += `AP[${SGFService.escapeValue(opts.appName)}]`;
    }

    // Métadonnées
    if (game.title) {
      sgf += `GN[${SGFService.escapeValue(game.title)}]`;
    }
    if (game.blackPlayer) {
      sgf += `PB[${SGFService.escapeValue(game.blackPlayer)}]`;
    }
    if (game.whitePlayer) {
      sgf += `PW[${SGFService.escapeValue(game.whitePlayer)}]`;
    }
    if (game.date) {
      sgf += `DT[${SGFService.escapeValue(game.date)}]`;
    }
    if (game.event) {
      sgf += `EV[${SGFService.escapeValue(game.event)}]`;
    }
    if (game.result) {
      sgf += `RE[${SGFService.escapeValue(game.result)}]`;
    }
    if (game.handicap > 0) {
      sgf += `HA[${game.handicap}]`;
    }
    if (game.comment && opts.includeComments) {
      sgf += `C[${SGFService.escapeValue(game.comment)}]`;
    }

    // Coups
    for (const move of game.rootMoves) {
      const sgfCoord = SGFService.positionToSGF(move.x, move.y);
      sgf += `;${move.color}[${sgfCoord}]`;

      if (move.comment && opts.includeComments) {
        sgf += `C[${SGFService.escapeValue(move.comment)}]`;
      }
    }

    sgf += ')';
    return sgf;
  }

  // =========================================================================
  // COORDINATE CONVERSION
  // =========================================================================

  /**
   * Convertit des coordonnées SGF (ex: "pd") en Position {x, y}
   * SGF: a=0, b=1, ... s=18 (pour 19×19)
   *
   * @param sgfCoord - Coordonnées SGF (2 lettres minuscules)
   * @returns Position ou null si invalide
   */
  static sgfToPosition(sgfCoord: string): { x: number; y: number } | null {
    if (!sgfCoord || sgfCoord.length < 2) return null;

    const x = sgfCoord.charCodeAt(0) - 97; // 'a' = 0
    const y = sgfCoord.charCodeAt(1) - 97;

    if (x < 0 || x > 18 || y < 0 || y > 18) return null;

    return { x, y };
  }

  /**
   * Convertit une Position {x, y} en coordonnées SGF (2 lettres)
   *
   * @param x - Colonne (0-18)
   * @param y - Ligne (0-18)
   * @returns Chaîne SGF (ex: "pd", "dd")
   */
  static positionToSGF(x: number, y: number): string {
    return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
  }

  /**
   * Convertit une position SGF en notation humaine (ex: "D4", "Q16")
   * Convention Go : colonnes A-T (sans I), lignes 1-19 (bas=1)
   *
   * @param sgfCoord - Coordonnées SGF (2 lettres minuscules)
   * @param boardSize - Taille du plateau (défaut 19)
   * @returns Notation humaine (ex: "D4") ou chaîne vide si invalide
   */
  static sgfToHumanReadable(sgfCoord: string, boardSize: number = 19): string {
    const pos = SGFService.sgfToPosition(sgfCoord);
    if (!pos) return '';

    const columns = 'ABCDEFGHJKLMNOPQRST'; // Skip I
    const col = columns[pos.x] || '?';
    const row = boardSize - pos.y;

    return `${col}${row}`;
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  /**
   * Échappe les caractères spéciaux SGF dans une valeur
   */
  private static escapeValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
  }

  /**
   * Obtient une propriété avec valeur par défaut
   */
  private static getProperty(
    props: Record<string, string[]>,
    key: string,
    defaultValue: string
  ): string {
    return props[key]?.[0] || defaultValue;
  }

  /**
   * Obtient une propriété ou null
   */
  private static getPropertyOrNull(
    props: Record<string, string[]>,
    key: string
  ): string | null {
    return props[key]?.[0] || null;
  }

  /**
   * Valide si une chaîne ressemble à du SGF
   */
  static isValidSGF(content: string): boolean {
    const trimmed = content.trim();
    return trimmed.startsWith('(;') && trimmed.endsWith(')');
  }
}

export default SGFService;
