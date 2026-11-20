<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  let dark = false;

  onMount(() => {
    dark = document.documentElement.classList.contains('dark');
  });

  function toggle() {
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('cuepoint-theme', dark ? 'dark' : 'light');
    } catch {
      /* sem armazenamento: o tema vale só nesta sessão */
    }
  }
</script>

<button
  type="button"
  class="icon-btn"
  on:click={toggle}
  aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
  title={dark ? 'Tema claro' : 'Tema escuro'}
>
  <Icon name={dark ? 'sun' : 'moon'} size={18} />
</button>
