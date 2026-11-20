<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Toast, getToastStore } from '@skeletonlabs/skeleton';
  import type { ToastSettings, ToastStore } from '@skeletonlabs/skeleton';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { z } from 'zod';

  initializeStores();
  const toastStore = getToastStore();

  const t: ToastSettings = {
    message: 'Não encontramos uma conta com esse e-mail.',
    background: 'variant-filled-error',
  };
  const s: ToastSettings = {
    message: 'E-mail enviado! Confira sua caixa de entrada.',
    background: 'variant-filled-success',
  };

  let errors: Record<string, string> = {};

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const formDataEntrada = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

    const schema = z.object({
      email: z.string().trim().min(1, { message: 'O e-mail é obrigatório' }),
    });

    const honeypot = formDataEntrada['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = schema.safeParse(formDataEntrada);

    if (!validator.success) {
      errors = {};
      // Extract errors
      validator.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });

      return cancel();
    }

    return async ({ result, update }) => {
      errors = {};
      if (result.type === 'success' && result.data) {
        if (result.data.status == 200) {
          toastStore.trigger({
            message: result.data.statusText,
            hideDismiss: true,
            background: 'card',
          });
          goto('/auth/login');
        } else {
          toastStore.trigger({
            message: result.data.statusText,
            hideDismiss: true,
            background: 'card',
          });
        }
      }
    };
  };
</script>

<div class="flex flex-col justify-center px-4 py-6 sm:px-6">
  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
    <h1 class="sr-only">Cuepoint</h1>
    <h2 class="text-2xl font-semibold tracking-tight">Esqueci a senha</h2>
  </div>
  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
    <p class="mt-10">Enviaremos um link para você criar uma nova senha</p>
  </div>
  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
    <form class="space-y-6" action="?/forgotPassword" method="POST" use:enhance={handleSubmit}>
      <div>
        <label for="email" class="">E-mail</label>
        <div class="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="Digite o e-mail"
            class={`input mr-1 rounded-lg  ${errors.email ? 'input-error' : 'input'}`}
          />
        </div>
        {#if errors.email}
          <div class="text-sm text-error-600">{errors.email}</div>
        {/if}
      </div>
      <div>
        <button type="submit" class="variant-filled-primary w-full rounded-lg p-2"
          >Enviar link de recuperação</button
        >
      </div>

      <input
        class="  absolute left-[-9999px]"
        type="text"
        name="honeypot"
        id="honeypot"
        placeholder="Digite aqui…"
        aria-hidden="true"
      />
    </form>
    <p class="mt-10 text-center">
      Lembrou a senha?
      <a href="/auth/login" class="leading-6 text-secondary-600 hover:text-secondary-500">Voltar</a
      >
    </p>
  </div>
</div>
<Toast />
