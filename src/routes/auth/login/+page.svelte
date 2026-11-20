<script lang="ts">
  import { z } from 'zod';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Toast, getToastStore } from '@skeletonlabs/skeleton';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import ViewPasswordEyes from '$lib/components/icons/ViewPasswordEyes.svelte';

  initializeStores();

  const toastStore = getToastStore();

  const schema = z.object({
    email: z.string().trim().min(1, { message: 'O e-mail é obrigatório' }),
    password: z.string().trim().min(1, { message: 'A senha é obrigatória' }),
  });

  let errors: Record<string, string> = {};

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const formDataEntrada = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

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
      if (result.type === 'success' && result.data) {
        if (result.data.status == 200) {
          goto('/app');
        } else {
          errors = {};

          if (result.data.status === 500) {
            errors.password = result.data.statusText;
            return;
          }
          if (result.data.status === 400) {
            errors.email = result.data.statusText;
            return;
          }
          toastStore.trigger({
            message: result.data.statusText,
            hideDismiss: true,
            background: 'card',
          });
        }
      }
    };
  };

  let newPasswordInput: HTMLInputElement;
</script>

<div class="flex flex-col justify-center px-4 py-6 sm:px-6">
  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
    <h1 class="sr-only">Cuepoint</h1>
    <h2 class="text-2xl font-semibold tracking-tight">Entrar no Cuepoint</h2>
  </div>
  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
    <form class="space-y-6" method="POST" action="?/login" use:enhance={handleSubmit}>
      <div>
        <label for="email" class="font-semibold">* E-mail</label>
        <div class="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="Digite o e-mail"
            class={`input mr-1 rounded-lg ${errors.email ? 'input-error' : 'input'}`}
          />
        </div>
        {#if errors.email}
          <div class="text-sm text-error-600">{errors.email}</div>
        {/if}
      </div>
      <div>
        <div class=" flex items-center justify-between">
          <label for="password" class="font-semibold">* Senha</label>
          <div class="">
            <a href="/auth/forgot-password" class="text-secondary-600 hover:text-secondary-500"
              >Esqueceu a senha?</a
            >
          </div>
        </div>
        <div
          class=" input-group input-group-divider mt-2 grid-cols-[1fr_auto] rounded-lg {`input mr-1  ${errors.password ? 'input-error' : 'input'}`}"
        >
          <input
            class={`input mr-1 rounded-lg  ${errors.password ? 'input-error' : 'input'}`}
            name="password"
            type="password"
            id="password"
            placeholder="Digite a senha"
            bind:this={newPasswordInput}
          />

          <button
            type="button"
            class="  input-group-shim"
            on:click={() => {
              if (newPasswordInput.value == '') {
                return;
              }

              newPasswordInput.type == 'password'
                ? (newPasswordInput.type = 'text')
                : (newPasswordInput.type = 'password');
            }}
          >
            <ViewPasswordEyes></ViewPasswordEyes>
          </button>
        </div>
        {#if errors.password}
          <div class="text-sm text-error-600">{errors.password}</div>
        {/if}
      </div>
      <div>
        <button type="submit" class="variant-filled-primary w-full rounded-lg p-2">Entrar</button>
      </div>
    </form>
    <p class="mt-10 text-center">
      Ainda não tem acesso?
      <a href="/auth/request-account" class="leading-6 text-secondary-600 hover:text-secondary-500"
        >Solicitar acesso</a
      >
    </p>
  </div>
</div>
<Toast />
