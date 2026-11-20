<script lang="ts">
  import { z } from 'zod';
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  import ModalShell from './ui/ModalShell.svelte';
  import PasswordField from './ui/PasswordField.svelte';

  export let parent: { onClose: () => void };

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let errors: Record<string, string> = {};
  let busy = false;

  const schema = z
    .object({
      currentPassword: z.string().min(1, 'Informe a senha atual'),
      newPassword: z.string().min(1, 'Informe a nova senha'),
      confirmPassword: z.string().min(1, 'Confirme a nova senha'),
    })
    .superRefine((d, ctx) => {
      if (d.newPassword !== d.confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não conferem' });
      }
    });

  async function submit() {
    errors = {};
    const values = { currentPassword, newPassword, confirmPassword };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      parsed.error.errors.forEach((e) => (errors[String(e.path[0])] = e.message));
      return;
    }

    busy = true;
    const res = await fetch('/api/chande-password-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputsInfos: values }),
    });
    const message = await res.text();
    busy = false;

    if (res.status === 400) {
      // A API só devolve 400 para senha atual incorreta ou falha geral.
      if (message.includes('senha atual')) errors.currentPassword = message;
      else errors.global = message;
      return;
    }

    modalStore.close();
    toastStore.trigger({ message: 'Senha alterada com sucesso', background: 'variant-filled-success', hideDismiss: true });
  }
</script>

{#if $modalStore[0]}
  <ModalShell title="Alterar senha" description="Use uma senha forte que você não usa em outros lugares." onClose={parent.onClose}>
    <form class="space-y-5" on:submit|preventDefault={submit} id="form-alterar-senha">
      <PasswordField label="Senha atual" placeholder="Digite a senha atual" autocomplete="current-password" bind:value={currentPassword} error={errors.currentPassword ?? ''} />
      <PasswordField label="Nova senha" placeholder="Digite a nova senha" bind:value={newPassword} error={errors.newPassword ?? ''} />
      <PasswordField label="Confirmar nova senha" placeholder="Repita a nova senha" bind:value={confirmPassword} error={errors.confirmPassword ?? ''} />
      {#if errors.global}
        <p class="rounded-lg border px-3 py-2 text-sm text-error-500" style="border-color: rgb(var(--color-error-500) / .35); background: rgb(var(--color-error-500) / .08)" role="alert">{errors.global}</p>
      {/if}
    </form>
    <svelte:fragment slot="footer">
      <button type="button" class="btn btn-sm variant-ringed" on:click={parent.onClose}>Cancelar</button>
      <button type="submit" form="form-alterar-senha" class="btn btn-sm variant-filled-primary min-w-24" disabled={busy}>
        {#if busy}<span class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>{/if}Salvar
      </button>
    </svelte:fragment>
  </ModalShell>
{/if}
