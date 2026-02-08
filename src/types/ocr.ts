/**
 * OCR recognition types
 */

export interface OCRResult {
  id: string;
  imageId: string;
  processedAt: Date;
  stones: Record<string, 'empty' | 'black' | 'white'>;
  confidence: number;
  errors: string[];
}

export interface OCRStoneMap {
  [key: string]: 'empty' | 'black' | 'white';
}

export interface OCRProcessingOptions {
  boardSize?: 19 | 13 | 9;
  colorToPlay?: 'B' | 'W';
  confidenceThreshold?: number;
}
