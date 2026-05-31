import { useMemo } from 'react';
import { STRINGS_MAP } from './stringsData';

export function t(key, vars = {}) {
  let value = STRINGS_MAP[key];
  if (value === undefined) {
    console.warn(`[strings] missing key: ${key}`);
    return key;
  }
  Object.entries(vars).forEach(([k, v]) => {
    value = value.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
  });
  return value;
}

export function useStrings() {
  return useMemo(() => ({ t }), []);
}
