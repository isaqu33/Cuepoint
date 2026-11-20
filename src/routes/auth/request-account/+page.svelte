<script lang="ts">
  import { enhance } from '$app/forms';
  import { z } from 'zod';
  import type { ReturnSubmitUsers } from './types';
  import { getToastStore, initializeStores, Toast } from '@skeletonlabs/skeleton';
  import type { SubmitFunction } from './$types.ts';

  initializeStores();

  const toastStore = getToastStore();

  let errors: Record<string, string> = {};

  const requestAccountSchema = z.object({
    name: z.string().trim().min(1, {
      message: 'O nome é obrigatório',
    }),
    email: z
      .string()
      .trim()
      .email({
        message: 'E-mail inválido',
      })
      .min(1, {
        message: 'O e-mail é obrigatório',
      }),
    request: z.string().trim().min(2, {
      message: 'Dê mais detalhes',
    }),
  });

  let formRef: HTMLFormElement | null = null;

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = requestAccountSchema.safeParse(formDataObject);

    if (!validator.success) {
      errors = {};
      validator.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });

      return cancel();
    }

    return async ({ result }) => {
      errors = {};
      if (result.type === 'success' && result.data) {
        let resultObtained = result.data as ReturnSubmitUsers;

        if (resultObtained.status == 200) {
          toastStore.trigger({
            message: resultObtained.responseText,
            hideDismiss: true,
            background: 'card',
          });

          if (formRef) {
            formRef.reset();
          }
        }
      }
    };
  };
</script>

<Toast />

<div class=" mt-2 flex min-h-full items-center justify-center">
  <div>
    <h1 class="sr-only">Cuepoint</h1>
    <h2 class="Reset Password mt-6 text-center text-2xl font-bold">Solicitar acesso</h2>
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <p class="mt-10">Conte quem você é. Entraremos em contato em breve!</p>
    </div>
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form
        class="space-y-6"
        action="?/requestAccount"
        method="POST"
        use:enhance={handleSubmit}
        bind:this={formRef}
      >
        <div>
          <label for="name" class="">Nome</label>
          <div class="mt-2">
            <input
              id="name"
              name="name"
              type="text"
              class={`input rounded-lg ${errors.name ? 'input-error' : 'input'}`}
            />
          </div>
          {#if errors.name}
            <div class="text-sm text-error-600">{errors.name}</div>
          {/if}
        </div>
        <div>
          <label for="email" class="">E-mail</label>
          <div class="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              class={`input rounded-lg ${errors.email ? 'input-error' : 'input'}`}
            />
          </div>
          {#if errors.email}
            <div class="text-sm text-error-600">{errors.email}</div>
          {/if}
        </div>
        <div>
          <label for="request" class="">Mensagem (por que você quer acesso?)</label>
          <div class="mt-2">
            <textarea
              class="{`textarea rounded-lg ${errors.request ? 'input-error' : 'textarea'}`} scroll-mt-24"
              name="request"
              id="request"
              rows="4"
              placeholder="Conte um pouco mais sobre você"
            ></textarea>
          </div>
          {#if errors.request}
            <div class="text-sm text-error-600">{errors.request}</div>
          {/if}
        </div>
        <div>
          <button type="submit" class="variant-filled-primary btn w-full rounded-lg"
            >Solicitar acesso</button
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
        Voltar para o login
        <a href="/auth/login" class="leading-6 text-secondary-600 hover:text-secondary-500"
          >Voltar</a
        >
      </p>
    </div>
  </div>
</div>
