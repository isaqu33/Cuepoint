<script lang="ts">
  import { z } from 'zod';
  import { invalidateAll } from '$app/navigation';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  import ModalShell from './ui/ModalShell.svelte';
  import Field from './ui/Field.svelte';

  export let parent: { onClose: () => void };

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  let name = '';
  let error = '';
  let busy = false;

  const schema = z.object({ name: z.string().trim().min(1, 'Informe o seu nome') });

  async function submit() {
    error = '';
    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      error = parsed.error.errors[0].message;
      return;
    }

    busy = true;
    const res = await fetch('/api/change-profile-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputsInfos: { name: parsed.data.name } }),
    });
    const message = await res.text();
    busy = false;

    if (res.status === 400) {
      error = message;
      return;
    }

    await invalidateAll();
    modalStore.close();
    toastStore.trigger({ message: 'Perfil atualizado', background: 'variant-filled-success', hideDismiss: true });
  }
</script>

{#if $modalStore[0]}
  <ModalShell title="Editar perfil" description="Este é o nome exibido para a sua equipe." onClose={parent.onClose}>
    <form on:submit|preventDefault={submit} id="form-editar-perfil">
      <Field label="Seu nome" id="perfil-nome" required {error}>
        <input id="perfil-nome" class="input {error ? 'input-error' : ''}" type="text" placeholder="Como você quer ser chamado" autocomplete="name" bind:value={name} />
      </Field>
    </form>
    <svelte:fragment slot="footer">
      <button type="button" class="btn btn-sm variant-ringed" on:click={parent.onClose}>Cancelar</button>
      <button type="submit" form="form-editar-perfil" class="btn btn-sm variant-filled-primary min-w-24" disabled={busy}>
        {#if busy}<span class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>{/if}Salvar
      </button>
    </svelte:fragment>
  </ModalShell>
{/if}
