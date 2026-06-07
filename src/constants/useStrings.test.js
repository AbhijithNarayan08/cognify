import { t } from './useStrings';

describe('Translation Helper t()', () => {
  it('returns the key if the translation is missing', () => {
    const result = t('missing.key.example');
    expect(result).toBe('missing.key.example');
  });

  it('correctly retrieves a translation', () => {
    // Assuming 'home.appTitle' translates to 'Cognify'
    const result = t('home.appTitle');
    expect(result).toBe('Cognify');
  });

  it('interpolates variables correctly', () => {
    // Assuming 'home.streak.modalTitle' is '{{count}}-Day Streak!'
    const result = t('home.streak.modalTitle', { count: 5 });
    expect(result).toBe('5-Day Streak!');
  });
});
