import i18next from 'i18next';
import { createI18nStore } from 'svelte-i18next';
import en from './en.i18n.json';
import ptBR from './pt-BR.i18n.json';

i18next.init({
  lng: 'en',
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
  },
  interpolation: {
    escapeValue: false, // not needed for svelte as it escapes by default
  },
});

export default () => createI18nStore(i18next);
