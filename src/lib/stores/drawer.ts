import { writable } from 'svelte/store';

export interface DrawerState {
  open: boolean;
  title: string;
  /** Rota existente (ex.: /admin/series/create) exibida dentro do painel. */
  src: string;
}

export const drawer = writable<DrawerState>({ open: false, title: '', src: '' });

export const openDrawer = (title: string, src: string) => drawer.set({ open: true, title, src });
export const closeDrawer = () => drawer.update((d) => ({ ...d, open: false }));
