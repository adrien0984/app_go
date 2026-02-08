/**
 * SGF format types
 */

export interface SGFNode {
  properties: Map<string, string[]>;
  children: SGFNode[];
}

export interface SGFGame {
  root: SGFNode;
  variations: SGFGame[];
}

export interface SGFParseResult {
  success: boolean;
  game: any | null;
  errors: string[];
}

export type SGFProperty =
  | 'GM'
  | 'FF'
  | 'SZ'
  | 'BR'
  | 'WR'
  | 'BN'
  | 'WN'
  | 'EV'
  | 'DT'
  | 'RE'
  | 'C'
  | 'B'
  | 'W'
  | 'TR'
  | 'SQ'
  | 'CR';
