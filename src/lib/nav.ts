export interface NavItem {
  href: string;
  label: string;
  icon: string;
  match?: string;
  exact?: boolean;
}
export interface NavGroup {
  title?: string;
  items: NavItem[];
}

/**
 * Estrutura do produto: biblioteca → processamento → revisão, e a equipe.
 * (Os nomes legados Curso/Série/Aula agora são "Coleção", "Subcoleção" e "Arquivo".)
 */
export function navFor(isAdmin: boolean, isSystem = false): NavGroup[] {
  const groups: NavGroup[] = [
    {
      items: [{ href: '/app', label: 'Biblioteca', icon: 'library', exact: true }],
    },
  ];
  if (isAdmin) {
    groups.push(
      {
        title: 'Mídia',
        items: [
          { href: '/admin/processing', label: 'Processamento', icon: 'activity' },
          { href: '/admin/lessons', label: 'Arquivos', icon: 'file' },
          { href: '/admin/courses', label: 'Coleções', icon: 'folder' },
          { href: '/admin/series', label: 'Subcoleções', icon: 'series' },
        ],
      },
      {
        title: 'Equipe',
        items: [
          { href: '/admin/users', label: 'Membros', icon: 'users', exact: true },
          { href: '/admin/users/requests', label: 'Solicitações', icon: 'inbox' },
        ],
      },
    );
  }
  if (isSystem) {
    groups.push({ title: 'Plataforma', items: [{ href: '/admin/workspaces', label: 'Espaços', icon: 'folder' }] });
  }
  return groups;
}
