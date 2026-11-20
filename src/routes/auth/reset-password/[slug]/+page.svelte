<script lang="ts">
  import { z } from 'zod';
  import ViewPasswordEyes from '$lib/components/icons/ViewPasswordEyes.svelte';
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { ReturnSubmitUsers, CustomPageData } from '../../../[admin]/users/types';
  import { goto } from '$app/navigation';

  export let data: CustomPageData;

  // Inputs
  let newPasswordInput: HTMLInputElement;
  let confirmPasswordInput: HTMLInputElement;

  // Validation Schema
  const resetPasswordSchema = z
    .object({
      password: z.string().min(1, 'Password Cannot be empty'),
      confirmPassword: z.string().min(1, 'Confirm Password Cannot be empty'),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        // @ts-ignore
        ctx.addIssue({
          path: ['confirmPassword'],
          message: "As senhas não conferem",
        });
      }
    });

  let errors: Record<string, string> = {};

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    formData.append('id', [data.iduser].toString());

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = resetPasswordSchema.safeParse(formDataObject);

    if (!validator.success) {
      errors = {};
      // Extract errors
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
          goto('/auth/login');
        }
      }
    };
  };
</script>

<div class=" mt-2 flex min-h-full items-center justify-center">
  <div class=" ">
    <div class="  w-full flex-col">
      <div class=" flex min-h-screen flex-col items-center justify-center">
        <h1 class="sr-only">Cuepoint</h1>
        <h2 class="mt-4 text-center text-2xl font-bold">Redefinir senha</h2>

        <div class="flex items-center space-x-4">
          <div class=" text">
            <div class="mb-5 sm:mx-auto sm:w-full sm:max-w-sm">
              <p class="mt-10">Crie uma nova senha e entre no Cuepoint.</p>
            </div>

            <form
              method="POST"
              enctype="multipart/form-data"
              action="?/resetPassword"
              use:enhance={handleSubmit}
            >
              <div class=" ">
                <label class=" flex-col items-end justify-end">
                  <strong class=""> * Senha </strong>

                  <div class="flex w-full items-center justify-between">
                    <div
                      class="input-group input-group-divider grid-cols-[1fr_auto] rounded-lg {`input mr-1  ${errors.password ? 'input-error' : 'input'}`}"
                    >
                      <input
                        class={`input mr-1 rounded-lg  ${errors.password ? 'input-error' : 'input'}`}
                        placeholder="Digite a senha"
                        type="password"
                        name="password"
                        id="password"
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
                  </div>
                </label>
                {#if errors.password}
                  <div class="text-sm text-error-600">{errors.password}</div>
                {/if}
                <label class="label mt-5">
                  <strong class=""> * Confirmar nova senha </strong>

                  <div class="flex w-full items-center justify-between">
                    <div
                      class="input-group input-group-divider grid-cols-[1fr_auto] rounded-lg {`input mr-1  ${errors.confirmPassword ? 'input-error' : 'input'}`}"
                    >
                      <input
                        class={`input mr-1 rounded-lg ${errors.confirmPassword ? 'input-error' : 'input'}`}
                        placeholder="Confirmar nova senha"
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        bind:this={confirmPasswordInput}
                      />
                      <button
                        type="button"
                        class="  input-group-shim"
                        on:click={() => {
                          if (confirmPasswordInput.value == '') {
                            return;
                          }

                          confirmPasswordInput.type == 'password'
                            ? (confirmPasswordInput.type = 'text')
                            : (confirmPasswordInput.type = 'password');
                        }}
                      >
                        <ViewPasswordEyes></ViewPasswordEyes>
                      </button>
                    </div>
                  </div>
                </label>
                {#if errors.confirmPassword}
                  <div class="text-sm text-error-600">{errors.confirmPassword}</div>
                {/if}

                <input
                  class="  absolute left-[-9999px]"
                  type="text"
                  name="honeypot"
                  id="honeypot"
                  placeholder="Digite aqui…"
                  aria-hidden="true"
                />
              </div>

              <div class="mt-7 flex w-full items-center justify-center">
                <button class="variant-filled-primary w-full rounded-lg p-2" type="submit">
                  Criar</button
                >
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
