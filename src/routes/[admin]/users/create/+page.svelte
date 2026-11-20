<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import { getToastStore, Toast } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { z } from 'zod';
  import type { SubmitFunction } from '../$types.ts';
  import type { ReturnSubmitUsers } from '../types';
  import ViewPasswordEyes from '$lib/components/icons/ViewPasswordEyes.svelte';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';

  const toastStore = getToastStore();

  let selectedGroup: boolean = false;
  let errors: Record<string, string> = {};

  const createUserSchema = z
    .object({
      Name: z.string().trim().min(1, {
        message: 'O nome é obrigatório',
      }),
      email: z.string().trim().email('Invalid email').min(1, 'O e-mail é obrigatório'),
      password: z.string().trim().min(2, 'Password cannot be empty'),
      confirmPassword: z.string().min(1, {
        message: 'Confirme a senha',
      }),
      selectedGroup: z.string().refine((data) => data.trim().length > 0, {
        message: 'O perfil é obrigatório',
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'As senhas não conferem',
    });

  $: isSubmictionInProcess = false;

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const Name = formData.get('Name')?.toString().trim() ?? '';

    formData.set('Name', Name);

    const email = formData.get('email')?.toString().trim() ?? '';

    formData.set('email', email);

    formData.append('selectedGroup', [selectedGroup].toString());

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = createUserSchema.safeParse(formDataObject);

    if (!validator.success) {
      errors = {};
      // Extract errors
      validator.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      return cancel();
    }
    isSubmictionInProcess = true;

    return async ({ result }) => {
      errors = {};
      if (result.type === 'success' && result.data) {
        let resultObtained = result.data as ReturnSubmitUsers;
        if (resultObtained.status === 200) {
          await invalidateAll();

          toastStore.trigger({
            message: resultObtained.statusText,
            background: 'card',
            hideDismiss: true,
          });
          goto('/admin/users');
        }
        if (resultObtained.status == 555) {
          isSubmictionInProcess = false;

          if (resultObtained.existingUserEmail !== null) {
            isSubmictionInProcess = false;

            errors.email = resultObtained.existingUserEmail;
          }
        }
      }
    };
  };

  let inputPassword: HTMLInputElement;
  let inputConfirmPassword: HTMLInputElement;
  let formElement: HTMLFormElement;
</script>

<Toast />
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Novo membro</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" bind:this={formElement} action="?/createUserServer" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Nome" id="Name" required={true} error={errors.Name ?? ''}>
        <input class="input {errors.Name ? 'input-error' : ''}" type="text" name="Name" id="Name" placeholder="Digite o nome" autocomplete="off" />
      </Field>
      <Field label="E-mail" id="email" required={true} error={errors.email ?? ''}>
        <input class="input {errors.email ? 'input-error' : ''}" type="email" name="email" id="email" placeholder="Digite o e-mail" autocomplete="off" />
      </Field>
      <Field label="Senha" id="password" required error={errors.password ?? ''}>
        <div class="relative">
          <input class="input pr-11 {errors.password ? 'input-error' : ''}" type="password" name="password" id="password" autocomplete="new-password" placeholder="Digite a senha" bind:this={inputPassword} />
          <button type="button" class="icon-btn absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" aria-label="Mostrar ou ocultar a senha"
            on:click={() => { if (inputPassword.value == '') return; inputPassword.type = inputPassword.type == 'password' ? 'text' : 'password'; }}>
            <ViewPasswordEyes />
          </button>
        </div>
      </Field>
      <Field label="Confirmar senha" id="confirmPassword" required error={errors.confirmPassword ?? ''}>
        <div class="relative">
          <input class="input pr-11 {errors.confirmPassword ? 'input-error' : ''}" type="password" name="confirmPassword" id="confirmPassword" autocomplete="new-password" placeholder="Repita a senha" bind:this={inputConfirmPassword} />
          <button type="button" class="icon-btn absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" aria-label="Mostrar ou ocultar a senha"
            on:click={() => { if (inputConfirmPassword.value == '') return; inputConfirmPassword.type = inputConfirmPassword.type == 'password' ? 'text' : 'password'; }}>
            <ViewPasswordEyes />
          </button>
        </div>
      </Field>
      <Field label="Perfil" required>
        <div class="flex flex-wrap gap-3">
          <label class="profile-opt"><input type="radio" value={false} bind:group={selectedGroup} /> Membro</label>
          <label class="profile-opt"><input type="radio" value={true} bind:group={selectedGroup} /> Administrador</label>
        </div>
      </Field>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/users?cancelled=1" submitLabel="Criar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
</div>
