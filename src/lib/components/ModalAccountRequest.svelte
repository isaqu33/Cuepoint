<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import ModalShell from './ui/ModalShell.svelte';

  export let parent: { onClose: () => void };
  export let name: string;
  export let email: string;
  export let request: string;

  const modalStore = getModalStore();
</script>

{#if $modalStore[0]}
  <ModalShell title="Solicitação de acesso" onClose={parent.onClose}>
    <dl class="space-y-4 text-sm">
      <div>
        <dt class="muted text-xs font-medium uppercase tracking-wider">Nome</dt>
        <dd class="mt-1 font-medium">{name}</dd>
      </div>
      <div>
        <dt class="muted text-xs font-medium uppercase tracking-wider">E-mail</dt>
        <dd class="mt-1"><a class="anchor" href={`mailto:${email}`}>{email}</a></dd>
      </div>
      <div>
        <dt class="muted text-xs font-medium uppercase tracking-wider">Mensagem</dt>
        <dd class="mt-1 whitespace-pre-line leading-relaxed">{request}</dd>
      </div>
    </dl>
    <svelte:fragment slot="footer">
      <button type="button" class="btn btn-sm variant-filled-primary" on:click={parent.onClose}>Fechar</button>
    </svelte:fragment>
  </ModalShell>
{/if}
