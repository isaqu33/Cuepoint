/** "Igreja São José!" → "igreja-sao-jose" (sem acentos, só a-z, 0-9 e hífen). */
export function slugify(name: string): string {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return base || 'espaco';
}

/** Primeiro slug livre: "igreja", "igreja-2", "igreja-3"… */
export function uniqueSlug(name: string, taken: ReadonlySet<string>): string {
  const base = slugify(name);
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}
