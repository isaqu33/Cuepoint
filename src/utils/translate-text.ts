import { fail } from '@sveltejs/kit';
import { z } from 'zod';

type translateText = {
  text: string;
  targetLanguage: string;
};

import i18next from 'i18next';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function translateText(args: translateText, deps = { z, fail }) {
  if (!i18next.hasResourceBundle(args.targetLanguage, 'translation')) {
    throw new Error(`Translation for language '${args.targetLanguage}' not available.`);
  }

  return i18next.t(args.text, { lng: args.targetLanguage });
}
