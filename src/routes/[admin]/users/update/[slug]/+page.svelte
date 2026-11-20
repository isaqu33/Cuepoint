<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import { getToastStore, Toast } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { z } from 'zod';
  import type { SubmitFunction } from './$types.ts';
  import type { ReturnSubmitUsers, CustomPageDataUpdate } from '../../types';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';

  export let data: CustomPageDataUpdate;

  const toastStore = getToastStore();

  let selectedGroup: boolean = data.data.isAdmin !== null ? data.data.isAdmin : false;
  let errors: Record<string, string> = {};

  const editUserSchema = z.object({
    name: z.string().trim().min(1, {
      message: 'O nome é obrigatório',
    }),
    email: z
      .string()
      .trim()
      .email({
        message: 'Invalid email',
      })
      .min(1, {
        message: 'O e-mail é obrigatório',
      }),
    selectedGroup: z.string().refine((data) => data.trim().length > 0, {
      message: 'O perfil é obrigatório',
    }),
  });

  $: isSubmictionInProcess = false;

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const name = formData.get('name')?.toString().trim() ?? '';

    formData.set('name', name);

    const email = formData.get('email')?.toString().trim() ?? '';

    formData.set('email', email);

    formData.append('selectedGroup', [selectedGroup].toString());
    formData.append('id', data.data.id.toString());

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = editUserSchema.safeParse(formDataObject);

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
          errors = {};
          if (resultObtained.type == 'generalError') {
            isSubmictionInProcess = false;

            return toastStore.trigger({
              message: String(resultObtained.statusText),
              timeout: 10000,
              hideDismiss: true,
              background: 'card',
            });
          }
          isSubmictionInProcess = false;

          if (resultObtained.type == 'existingUserEmail') {
            isSubmictionInProcess = false;

            errors.email = String(resultObtained.statusText);
          }
          if (resultObtained.type == 'existingUserName') {
            isSubmictionInProcess = false;

            errors.name = String(resultObtained.statusText);
          }
        }
      }
    };
  };
  let formElement: HTMLFormElement;
</script>

<Toast />
{#if data.data}
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Editar membro</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" bind:this={formElement} action="?/updateUserServer" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Nome" id="name" required={true} error={errors.name ?? ''}>
        <input class="input {errors.name ? 'input-error' : ''}" type="text" name="name" id="name" placeholder="Digite o nome" autocomplete="off" bind:value={data.data.name} />
      </Field>
      <Field label="E-mail" id="email" required={true} error={errors.email ?? ''}>
        <input class="input {errors.email ? 'input-error' : ''}" type="email" name="email" id="email" placeholder="Digite o e-mail" autocomplete="off" bind:value={data.data.email} />
      </Field>
      <Field label="Perfil" required>
        <div class="flex flex-wrap gap-3">
          <label class="profile-opt"><input type="radio" value={false} bind:group={selectedGroup} /> Membro</label>
          <label class="profile-opt"><input type="radio" value={true} bind:group={selectedGroup} /> Administrador</label>
        </div>
      </Field>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/users?cancelled=1" submitLabel="Salvar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
</div>
{/if}
