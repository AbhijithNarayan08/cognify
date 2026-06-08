import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export function t(key, vars = {}) {
  return i18n.t(key, vars);
}

export function useStrings() {
  const { t: i18nt } = useTranslation();
  return {
    t: (key, vars = {}) => i18nt(key, vars),
  };
}
