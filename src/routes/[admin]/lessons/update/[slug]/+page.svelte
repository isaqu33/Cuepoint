<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import ImagePicker from '$lib/components/ui/ImagePicker.svelte';
  import type { SubmitFunction } from './$types.ts';
  import { onMount } from 'svelte';
  import { Toast } from '@skeletonlabs/skeleton';
  import { z } from 'zod';
  import { uploadDirect } from '$lib/utils/direct-upload';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { FileButton } from '@skeletonlabs/skeleton';
  import type { CustomPageDataUpdate, ReturnSubmitLessons } from '../../types.js';
  import AudioAdminPlayer from '$lib/components/AudioAdminPlayer.svelte';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';

  export let data: CustomPageDataUpdate;

  const toastStore = getToastStore();

  let urlPrevilimg = '';
  let nameAudio = '';

  let selectedPhoto: string | Blob | null = null;
  let selectedAudio: string | Blob | null = null;

  onMount(async () => {
    if (data.data) {
      urlPrevilimg = data.data.photoLeson;
      selectedPhoto = data.data.photoLeson;
      selectedAudio = data.data.audiofile;
    }
  });

  const handleChangePhoto = (event: Event) => {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement?.files && inputElement.files.length > 0) {
      let fileReader = new FileReader();

      fileReader.onload = (fileEvent: ProgressEvent<FileReader>) => {
        const fileTarget = fileEvent.target;

        if (fileTarget?.result) {
          urlPrevilimg = fileTarget?.result as string;
        }
      };

      fileReader.readAsDataURL(inputElement.files[0]);

      selectedPhoto = inputElement.files[0];
    }
  };

  let audioUrl: string | null = null;

  const handleChangeAudio = (event: Event) => {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement?.files && inputElement.files.length > 0) {
      audioUrl = null;
      const audioFile = inputElement.files[0];
      nameAudio = audioFile.name;
      selectedAudio = audioFile;

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      audioUrl = URL.createObjectURL(audioFile);
    }
  };

  let errors: Record<string, string> = {};
  const updateLessonSchema = z.object({
    Title: z.string().trim().min(1, {
      message: 'O título é obrigatório',
    }),
    description: z.string().trim().min(1, {
      message: 'A descrição é obrigatória',
    }),
    image: z
      .string()
      .trim()
      .min(1, { message: 'O texto é obrigatório' })
      .or(
        z.object({
          size: z.number(),
          type: z.string(),
          name: z.string(),
          lastModified: z.number(),
        }),
      ),
    audio: z
      .string()
      .trim()
      .min(1, { message: 'O áudio é obrigatório' })
      .or(
        z.object({
          size: z.number(),
          type: z.string(),
          name: z.string(),
          lastModified: z.number(),
        }),
      ),
  });

  $: isSubmictionInProcess = false;
  let uploadLabel = '';

  const handleSubmit: SubmitFunction = async ({ formData, cancel }) => {
    const title = formData.get('Title')?.toString().trim() ?? '';

    formData.set('Title', title);

    formData.append('id', data.data.id.toString());

    formData.append('image', selectedPhoto as string);
    formData.append('audio', selectedAudio as string);

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );

    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = updateLessonSchema.safeParse(formDataObject);

    if (!validator.success) {
      errors = {};
      // Extract errors
      validator.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      return cancel();
    }

    isSubmictionInProcess = true;

    // Arquivos novos vão DIRETO ao storage (com progresso); o formulário leva só as chaves.
    try {
      if (selectedPhoto instanceof File) {
        formData.set('imageKey', await uploadDirect('image', selectedPhoto, (p) => (uploadLabel = `Enviando imagem: ${p}%`)));
        formData.set('imageName', selectedPhoto.name);
        formData.delete('image');
      }
      if (selectedAudio instanceof File) {
        formData.set('audioKey', await uploadDirect('audio', selectedAudio, (p) => (uploadLabel = `Enviando arquivo: ${p}%`)));
        formData.set('audioName', selectedAudio.name);
        formData.delete('audio');
      }
    } catch (err) {
      isSubmictionInProcess = false;
      uploadLabel = '';
      errors = { audio: (err as Error).message };
      return cancel();
    }
    uploadLabel = '';

    return async ({ result, update }) => {
      if (result.type === 'success' && result.data) {
        errors = {};
        let resultObtained = result.data as ReturnSubmitLessons;
        if (resultObtained.status == 200) {
          await invalidateAll();

          toastStore.trigger({
            message: resultObtained.statusText,
            background: 'card',
            hideDismiss: true,
          });
          goto('/admin/lessons');
        }
        if (resultObtained.status == 555) {
          isSubmictionInProcess = false;

          if (resultObtained.type == 'existingTitleName') {
            isSubmictionInProcess = false;
            return (errors.Title = resultObtained.statusText);
          }
          toastStore.trigger({
            message: resultObtained.statusText,
            background: 'card',
            hideDismiss: true,
          });
        }
      }
    };
  };
</script>

<Toast />
{#if data.data}
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Editar arquivo</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Título" id="Title" required={true} error={errors.Title ?? ''}>
        <input class="input {errors.Title ? 'input-error' : ''}" type="text" name="Title" id="Title" placeholder="Título do arquivo" autocomplete="off" bind:value={data.data.title} />
      </Field>
      <Field label="Descrição" id="description" required error={errors.description ?? ''}>
        <textarea class="input {errors.description ? 'input-error' : ''}" name="description" id="description" rows="4" placeholder="Sobre este arquivo" bind:value={data.data.description}></textarea>
      </Field>
      <div class="form-grid">
        <Field label="Imagem" required error={errors.image ?? ''}>
          <ImagePicker preview={urlPrevilimg} on:change={handleChangePhoto} />
        </Field>
        <Field label="Áudio" required error={errors.audio ?? ''}>
          <AudioPicker src={nameAudio == '' ? String(data.data.audiofile ?? '') : String(audioUrl)} fileName={nameAudio} on:change={handleChangeAudio} />
        </Field>
      </div>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/lessons?cancelled=1" formaction="?/updateLessonServer" submitLabel="Salvar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
  {#if uploadLabel}<p class="upload-progress" role="status" aria-live="polite">{uploadLabel}</p>{/if}
</div>
{/if}
