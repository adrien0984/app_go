/**
 * Tests unitaires pour SGFService - Import/Export SGF
 */
import { describe, it, expect } from 'vitest';
import { SGFService } from '../../src/services/SGFService';
import type { Game, Move } from '../../src/types/game';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createTestGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'test-game-1',
    title: 'Test Game',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    blackPlayer: 'AlphaGo',
    whitePlayer: 'Lee Sedol',
    boardSize: 19,
    komi: 6.5,
    handicap: 0,
    rootMoves: [],
    variants: [],
    event: null,
    date: null,
    result: null,
    comment: null,
    evaluations: [],
    ...overrides,
  };
}

function createTestMove(overrides: Partial<Move> = {}): Move {
  return {
    id: 'move-1',
    moveNumber: 1,
    color: 'B',
    x: 15,
    y: 3,
    comment: null,
    symbols: null,
    variants: [],
    parentMoveId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Coordinate Conversion ────────────────────────────────────────────────────

describe('SGFService - Coordinate Conversion', () => {
  describe('sgfToPosition', () => {
    it('doit convertir "aa" en (0,0)', () => {
      expect(SGFService.sgfToPosition('aa')).toEqual({ x: 0, y: 0 });
    });

    it('doit convertir "ss" en (18,18)', () => {
      expect(SGFService.sgfToPosition('ss')).toEqual({ x: 18, y: 18 });
    });

    it('doit convertir "pd" en (15,3) — tengen-like', () => {
      expect(SGFService.sgfToPosition('pd')).toEqual({ x: 15, y: 3 });
    });

    it('doit convertir "dd" en (3,3) — hoshi standard', () => {
      expect(SGFService.sgfToPosition('dd')).toEqual({ x: 3, y: 3 });
    });

    it('doit convertir "jj" en (9,9) — tengen', () => {
      expect(SGFService.sgfToPosition('jj')).toEqual({ x: 9, y: 9 });
    });

    it('doit retourner null pour chaîne vide', () => {
      expect(SGFService.sgfToPosition('')).toBeNull();
    });

    it('doit retourner null pour une seule lettre', () => {
      expect(SGFService.sgfToPosition('a')).toBeNull();
    });

    it('doit retourner null pour coordonnées hors bornes', () => {
      // 'z' = charCode 122, 122 - 97 = 25 > 18
      expect(SGFService.sgfToPosition('za')).toBeNull();
    });
  });

  describe('positionToSGF', () => {
    it('doit convertir (0,0) en "aa"', () => {
      expect(SGFService.positionToSGF(0, 0)).toBe('aa');
    });

    it('doit convertir (18,18) en "ss"', () => {
      expect(SGFService.positionToSGF(18, 18)).toBe('ss');
    });

    it('doit convertir (15,3) en "pd"', () => {
      expect(SGFService.positionToSGF(15, 3)).toBe('pd');
    });

    it('doit convertir (3,3) en "dd"', () => {
      expect(SGFService.positionToSGF(3, 3)).toBe('dd');
    });
  });

  describe('sgfToHumanReadable', () => {
    it('doit convertir "pd" en "Q16"', () => {
      expect(SGFService.sgfToHumanReadable('pd')).toBe('Q16');
    });

    it('doit convertir "dd" en "D16"', () => {
      expect(SGFService.sgfToHumanReadable('dd')).toBe('D16');
    });

    it('doit convertir "aa" en "A19"', () => {
      expect(SGFService.sgfToHumanReadable('aa')).toBe('A19');
    });

    it('doit convertir "ss" en "T1"', () => {
      expect(SGFService.sgfToHumanReadable('ss')).toBe('T1');
    });

    it('doit retourner "" pour coordonnées invalides', () => {
      expect(SGFService.sgfToHumanReadable('')).toBe('');
    });
  });

  describe('roundtrip sgfToPosition ↔ positionToSGF', () => {
    it('doit être réversible pour toutes les coordonnées hoshi', () => {
      const hoshiCoords = ['dd', 'pd', 'dp', 'pp', 'jj', 'dj', 'jd', 'jp', 'pj'];
      for (const coord of hoshiCoords) {
        const pos = SGFService.sgfToPosition(coord);
        expect(pos).not.toBeNull();
        const back = SGFService.positionToSGF(pos!.x, pos!.y);
        expect(back).toBe(coord);
      }
    });
  });
});

// ─── Serialization (Game → SGF) ──────────────────────────────────────────────

describe('SGFService - Serialization', () => {
  it('doit sérialiser un Game vide avec les propriétés racine', () => {
    const game = createTestGame();
    const sgf = SGFService.serialize(game);

    expect(sgf).toContain('FF[4]');
    expect(sgf).toContain('GM[1]');
    expect(sgf).toContain('SZ[19]');
    expect(sgf).toContain('KM[6.5]');
    expect(sgf).toContain('PB[AlphaGo]');
    expect(sgf).toContain('PW[Lee Sedol]');
    expect(sgf).toContain('GN[Test Game]');
    expect(sgf.startsWith('(;')).toBe(true);
    expect(sgf.endsWith(')')).toBe(true);
  });

  it('doit sérialiser les métadonnées optionnelles', () => {
    const game = createTestGame({
      event: 'Test Championship',
      date: '2024-01-15',
      result: 'B+2.5',
      handicap: 3,
      comment: 'A great game',
    });
    const sgf = SGFService.serialize(game);

    expect(sgf).toContain('EV[Test Championship]');
    expect(sgf).toContain('DT[2024-01-15]');
    expect(sgf).toContain('RE[B+2.5]');
    expect(sgf).toContain('HA[3]');
    expect(sgf).toContain('C[A great game]');
  });

  it('doit sérialiser les coups', () => {
    const moves: Move[] = [
      createTestMove({ id: 'm1', moveNumber: 1, color: 'B', x: 15, y: 3 }),
      createTestMove({ id: 'm2', moveNumber: 2, color: 'W', x: 3, y: 3, parentMoveId: 'm1' }),
      createTestMove({ id: 'm3', moveNumber: 3, color: 'B', x: 3, y: 15, parentMoveId: 'm2' }),
    ];
    const game = createTestGame({ rootMoves: moves });
    const sgf = SGFService.serialize(game);

    expect(sgf).toContain(';B[pd]');  // (15,3)
    expect(sgf).toContain(';W[dd]');  // (3,3)
    expect(sgf).toContain(';B[dp]');  // (3,15)
  });

  it('doit sérialiser les commentaires des coups', () => {
    const moves: Move[] = [
      createTestMove({ id: 'm1', moveNumber: 1, color: 'B', x: 15, y: 3, comment: 'Good move' }),
    ];
    const game = createTestGame({ rootMoves: moves });
    const sgf = SGFService.serialize(game);

    expect(sgf).toContain(';B[pd]C[Good move]');
  });

  it('doit exclure les commentaires quand includeComments=false', () => {
    const moves: Move[] = [
      createTestMove({ id: 'm1', moveNumber: 1, color: 'B', x: 15, y: 3, comment: 'Hidden' }),
    ];
    const game = createTestGame({ rootMoves: moves, comment: 'Game comment' });
    const sgf = SGFService.serialize(game, { includeComments: false });

    expect(sgf).not.toContain('Hidden');
    expect(sgf).not.toContain('Game comment');
  });

  it('doit échapper les caractères spéciaux dans les valeurs', () => {
    const game = createTestGame({
      title: 'Game [with] brackets',
      comment: 'A\\B',
    });
    const sgf = SGFService.serialize(game);

    expect(sgf).toContain('GN[Game [with\\] brackets]');
    expect(sgf).toContain('C[A\\\\B]');
  });

  it('doit inclure AP[] avec le nom de l\'app', () => {
    const game = createTestGame();
    const sgf = SGFService.serialize(game, { appName: 'GoAI:2.0' });

    expect(sgf).toContain('AP[GoAI:2.0]');
  });

  it('ne doit pas inclure HA[] si handicap=0', () => {
    const game = createTestGame({ handicap: 0 });
    const sgf = SGFService.serialize(game);

    expect(sgf).not.toContain('HA[');
  });
});

// ─── Parsing (SGF → Game) ────────────────────────────────────────────────────

describe('SGFService - Parsing', () => {
  it('doit parser un SGF minimal', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[6.5]PB[Noir]PW[Blanc])';
    const { game, warnings } = SGFService.parse(sgf);

    expect(game.boardSize).toBe(19);
    expect(game.komi).toBe(6.5);
    expect(game.blackPlayer).toBe('Noir');
    expect(game.whitePlayer).toBe('Blanc');
    expect(game.rootMoves).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('doit parser les coups d\'une partie', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[6.5]PB[B]PW[W];B[pd];W[dd];B[dp])';
    const { game } = SGFService.parse(sgf);

    expect(game.rootMoves).toHaveLength(3);
    expect(game.rootMoves[0].color).toBe('B');
    expect(game.rootMoves[0].x).toBe(15);
    expect(game.rootMoves[0].y).toBe(3);
    expect(game.rootMoves[1].color).toBe('W');
    expect(game.rootMoves[1].x).toBe(3);
    expect(game.rootMoves[1].y).toBe(3);
    expect(game.rootMoves[2].color).toBe('B');
    expect(game.rootMoves[2].x).toBe(3);
    expect(game.rootMoves[2].y).toBe(15);
  });

  it('doit parser les métadonnées complètes', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[7.5]PB[Lee]PW[AlphaGo]EV[Match]DT[2016-03-09]RE[W+Resign]HA[0]GN[Game 1]C[Historic game])';
    const { game } = SGFService.parse(sgf);

    expect(game.blackPlayer).toBe('Lee');
    expect(game.whitePlayer).toBe('AlphaGo');
    expect(game.event).toBe('Match');
    expect(game.date).toBe('2016-03-09');
    expect(game.result).toBe('W+Resign');
    expect(game.komi).toBe(7.5);
    expect(game.title).toBe('Game 1');
    expect(game.comment).toBe('Historic game');
  });

  it('doit parser les commentaires de coups', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[6.5]PB[B]PW[W];B[pd]C[Opening move];W[dd]C[Response])';
    const { game } = SGFService.parse(sgf);

    expect(game.rootMoves).toHaveLength(2);
    expect(game.rootMoves[0].comment).toBe('Opening move');
    expect(game.rootMoves[1].comment).toBe('Response');
  });

  it('doit gérer les tailles 9 et 13', () => {
    const sgf9 = '(;FF[4]GM[1]SZ[9]KM[5.5])';
    const sgf13 = '(;FF[4]GM[1]SZ[13]KM[6.5])';

    expect(SGFService.parse(sgf9).game.boardSize).toBe(9);
    expect(SGFService.parse(sgf13).game.boardSize).toBe(13);
  });

  it('doit avertir pour taille non supportée et utiliser 19', () => {
    const sgf = '(;FF[4]GM[1]SZ[7]KM[5.5])';
    const { game, warnings } = SGFService.parse(sgf);

    expect(game.boardSize).toBe(19);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('7');
  });

  it('doit lever une erreur pour SGF invalide (pas de parenthèses)', () => {
    expect(() => SGFService.parse('invalid')).toThrow('Format SGF invalide');
  });

  it('doit lever une erreur pour SGF vide', () => {
    expect(() => SGFService.parse('')).toThrow('Format SGF invalide');
  });

  it('doit utiliser des valeurs par défaut quand propriétés absentes', () => {
    const sgf = '(;FF[4]GM[1])';
    const { game } = SGFService.parse(sgf);

    expect(game.boardSize).toBe(19);
    expect(game.komi).toBe(6.5);
    expect(game.blackPlayer).toBe('Noir');
    expect(game.whitePlayer).toBe('Blanc');
  });

  it('doit parser les caractères échappés dans les valeurs', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]C[Test \\] escaped])';
    const { game } = SGFService.parse(sgf);

    expect(game.comment).toBe('Test ] escaped');
  });

  it('doit parser un handicap', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[0.5]HA[4])';
    const { game } = SGFService.parse(sgf);

    expect(game.handicap).toBe(4);
    expect(game.komi).toBe(0.5);
  });
});

// ─── Roundtrip (Game → SGF → Game) ───────────────────────────────────────────

describe('SGFService - Roundtrip', () => {
  it('doit préserver les métadonnées dans un aller-retour', () => {
    const original = createTestGame({
      title: 'Roundtrip Test',
      blackPlayer: 'Player A',
      whitePlayer: 'Player B',
      komi: 7.5,
      event: 'Tournament',
      date: '2024-06-15',
      result: 'B+3.5',
    });

    const sgf = SGFService.serialize(original);
    const { game: parsed } = SGFService.parse(sgf);

    expect(parsed.title).toBe('Roundtrip Test');
    expect(parsed.blackPlayer).toBe('Player A');
    expect(parsed.whitePlayer).toBe('Player B');
    expect(parsed.komi).toBe(7.5);
    expect(parsed.event).toBe('Tournament');
    expect(parsed.date).toBe('2024-06-15');
    expect(parsed.result).toBe('B+3.5');
    expect(parsed.boardSize).toBe(19);
  });

  it('doit préserver les coups dans un aller-retour', () => {
    const moves: Move[] = [
      createTestMove({ id: 'm1', moveNumber: 1, color: 'B', x: 15, y: 3 }),
      createTestMove({ id: 'm2', moveNumber: 2, color: 'W', x: 3, y: 3, parentMoveId: 'm1' }),
      createTestMove({ id: 'm3', moveNumber: 3, color: 'B', x: 15, y: 15, parentMoveId: 'm2' }),
      createTestMove({ id: 'm4', moveNumber: 4, color: 'W', x: 3, y: 15, parentMoveId: 'm3' }),
    ];
    const original = createTestGame({ rootMoves: moves });

    const sgf = SGFService.serialize(original);
    const { game: parsed } = SGFService.parse(sgf);

    expect(parsed.rootMoves).toHaveLength(4);
    parsed.rootMoves.forEach((move, idx) => {
      expect(move.color).toBe(moves[idx].color);
      expect(move.x).toBe(moves[idx].x);
      expect(move.y).toBe(moves[idx].y);
      expect(move.moveNumber).toBe(moves[idx].moveNumber);
    });
  });

  it('doit préserver les commentaires de coups dans un aller-retour', () => {
    const moves: Move[] = [
      createTestMove({ id: 'm1', moveNumber: 1, color: 'B', x: 3, y: 3, comment: 'Joseki' }),
      createTestMove({ id: 'm2', moveNumber: 2, color: 'W', x: 15, y: 3, comment: null }),
    ];
    const original = createTestGame({ rootMoves: moves });

    const sgf = SGFService.serialize(original);
    const { game: parsed } = SGFService.parse(sgf);

    expect(parsed.rootMoves[0].comment).toBe('Joseki');
    expect(parsed.rootMoves[1].comment).toBeNull();
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('SGFService - Validation', () => {
  it('isValidSGF doit accepter un SGF valide', () => {
    expect(SGFService.isValidSGF('(;FF[4]GM[1]SZ[19])')).toBe(true);
  });

  it('isValidSGF doit refuser une chaîne sans parenthèses', () => {
    expect(SGFService.isValidSGF('FF[4]GM[1]')).toBe(false);
  });

  it('isValidSGF doit refuser une chaîne vide', () => {
    expect(SGFService.isValidSGF('')).toBe(false);
  });

  it('isValidSGF doit accepter un SGF avec espaces autour', () => {
    expect(SGFService.isValidSGF('  (;FF[4]GM[1])  ')).toBe(true);
  });
});

// ─── SGF réels (parties connues) ──────────────────────────────────────────────

describe('SGFService - SGF professionnels', () => {
  it('doit parser le début d\'une partie professionnelle', () => {
    // Début simplifié d'une partie pro (premiers coups)
    const sgf = `(;FF[4]GM[1]SZ[19]KM[6.5]
PB[Shin Jinseo]PW[Ke Jie]
DT[2024-02-15]EV[LG Cup]RE[B+Resign]
;B[pd];W[dd];B[pq];W[dp];B[qk];W[nc];B[pf];W[jd])`;

    const { game, warnings } = SGFService.parse(sgf);

    expect(game.blackPlayer).toBe('Shin Jinseo');
    expect(game.whitePlayer).toBe('Ke Jie');
    expect(game.event).toBe('LG Cup');
    expect(game.result).toBe('B+Resign');
    expect(game.rootMoves).toHaveLength(8);

    // Vérifier quelques coups
    expect(game.rootMoves[0]).toMatchObject({ color: 'B', x: 15, y: 3 }); // pd → Q16
    expect(game.rootMoves[1]).toMatchObject({ color: 'W', x: 3, y: 3 });  // dd → D16
    expect(game.rootMoves[4]).toMatchObject({ color: 'B', x: 16, y: 10 }); // qk → R9
  });

  it('doit parser un SGF avec whitespace et newlines', () => {
    const sgf = `(;FF[4]
GM[1]
SZ[19]
KM[6.5]
PB[Test]PW[Test2]
;B[pd]
;W[dd]
;B[dp]
)`;

    const { game } = SGFService.parse(sgf);
    expect(game.rootMoves).toHaveLength(3);
    expect(game.boardSize).toBe(19);
  });
});
