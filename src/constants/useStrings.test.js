import { t, useStrings } from './useStrings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('react-i18next', () => {
  const original = jest.requireActual('react-i18next');
  return {
    ...original,
    useTranslation: () => ({
      t: (key, vars = {}) => {
        const i18n = require('../i18n').default;
        return i18n.t(key, vars);
      }
    }),
  };
});

describe('Translation Helper t()', () => {
  it('returns the key if the translation is missing', () => {
    const result = t('missing.key.example');
    expect(result).toBe('missing.key.example');
  });

  it('correctly retrieves a translation', () => {
    const result = t('home.appTitle');
    expect(result).toBe('Cognify');
  });

  it('interpolates variables correctly', () => {
    const result = t('home.streak.modalTitle', { count: 5 });
    expect(result).toBe('5-Day Streak!');
  });
});

describe('useStrings Hook', () => {
  it('returns an object containing the translation function t', () => {
    // Mocking/Spying react-i18next's useTranslation is optional, but let's test the return type
    const strings = useStrings();
    expect(strings).toHaveProperty('t');
    expect(typeof strings.t).toBe('function');
  });

  it('correctly retrieves and interpolates using the hook t function', () => {
    const strings = useStrings();
    const result = strings.t('home.streak.modalTitle', { count: 10 });
    expect(result).toBe('10-Day Streak!');
  });
});
