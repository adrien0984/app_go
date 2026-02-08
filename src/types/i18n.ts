/**
 * Internationalization types
 */

export type Language = 'fr' | 'en';

export interface Translations {
  [key: string]: string | Record<string, any>;
}

export interface i18nNamespace {
  common: Record<string, string>;
  game: Record<string, string>;
  analysis: Record<string, string>;
  ocr: Record<string, string>;
  errors: Record<string, string>;
}
