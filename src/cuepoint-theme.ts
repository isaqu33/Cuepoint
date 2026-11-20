import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

/**
 * Tokens de cor do Cuepoint. Cada cor-base gera a escala 50–900 do Skeleton
 * (mistura com branco/preto), para que os componentes existentes herdem a marca.
 */
type RGB = [number, number, number];

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): string =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(' ');

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

function scale(name: string, base: string, onColor: 'white' | 'black') {
  const b = hex(base);
  const tints: Record<number, string> = {
    50: mix(b, WHITE, 0.92),
    100: mix(b, WHITE, 0.82),
    200: mix(b, WHITE, 0.66),
    300: mix(b, WHITE, 0.48),
    400: mix(b, WHITE, 0.26),
    500: b.join(' '),
    600: mix(b, BLACK, 0.18),
    700: mix(b, BLACK, 0.36),
    800: mix(b, BLACK, 0.54),
    900: mix(b, BLACK, 0.7),
  };
  const out: Record<string, string> = {
    [`--on-${name}`]: onColor === 'white' ? '255 255 255' : '0 0 0',
  };
  for (const [k, v] of Object.entries(tints)) out[`--color-${name}-${k}`] = v;
  return out;
}

// `as`: o Skeleton aceita --body-background-color em tempo de execução, mas o tipo ThemeProperties não a lista.
export const cuepointTheme = {
  name: 'cuepoint',
  properties: {
    '--theme-font-family-base':
      "'Geist Variable', Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    '--theme-font-family-heading':
      "'Geist Variable', Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    '--theme-font-color-base': '24 24 27',
    '--theme-font-color-dark': '244 244 245',
    '--body-background-color': '244 244 245',
    '--body-background-color-dark': '9 9 11',
    '--theme-rounded-base': '10px',
    '--theme-rounded-container': '14px',
    '--theme-border-base': '1px',
    // Índigo: ação principal. Contraste com branco >= 7:1 (AA/AAA).
    ...scale('primary', '#2563EB', 'white'),
    ...scale('secondary', '#7C5CFF', 'white'),
    ...scale('tertiary', '#06B6D4', 'black'),
    ...scale('success', '#1FA45B', 'white'),
    ...scale('warning', '#F59E0B', 'black'),
    ...scale('error', '#EF4444', 'white'),
    ...scale('surface', '#71717A', 'white'),
  },
} as unknown as CustomThemeConfig;
