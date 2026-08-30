import { describe, expect, it } from 'vitest';
import { getTranslation, SupportedLanguage, TRANSLATIONS } from '../src/locales/i18n';

describe("DON'T TAP IT! — i18n Localization Engine Tests", () => {
  const languages: SupportedLanguage[] = ['en', 'es', 'hi', 'te', 'ta', 'kn'];

  it('should have complete translation keys across all 6 supported languages', () => {
    const requiredKeys = Object.keys(TRANSLATIONS.en) as Array<keyof typeof TRANSLATIONS.en>;

    for (const lang of languages) {
      const dict = getTranslation(lang);
      expect(dict).toBeDefined();

      for (const key of requiredKeys) {
        expect(dict[key]).toBeDefined();
        expect(typeof dict[key]).toBe('string');
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('should provide correct localized play and daily challenge labels', () => {
    expect(getTranslation('en').play).toBe('PLAY');
    expect(getTranslation('es').play).toBe('JUGAR');
    expect(getTranslation('hi').play).toBe('खेलें');
    expect(getTranslation('te').play).toBe('ఆడండి');
    expect(getTranslation('ta').play).toBe('விளையாடு');
    expect(getTranslation('kn').play).toBe('ಆಡಿ');
  });
});
