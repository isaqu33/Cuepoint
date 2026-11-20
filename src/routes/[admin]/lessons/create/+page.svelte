<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import ImagePicker from '$lib/components/ui/ImagePicker.svelte';
  import type { SubmitFunction } from '../$types.ts';
  import { z } from 'zod';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { FileButton } from '@skeletonlabs/skeleton';
  import { Toast } from '@skeletonlabs/skeleton';
  import type { ReturnSubmitLessons } from '../types';
  import AudioAdminPlayer from '$lib/components/AudioAdminPlayer.svelte';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';
  import { uploadDirect } from '$lib/utils/direct-upload';

  const toastStore = getToastStore();

  let uploadLabel = '';

  let urlPrevilimg = '';
  let NameAudio = '';

  let selectedPhoto: string | Blob | null = null;
  let selectedAudio: string | Blob | null = null;

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
      NameAudio = audioFile.name;
      selectedAudio = audioFile;

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      audioUrl = URL.createObjectURL(audioFile);
    }
  };

  let errors: Record<string, string> = {};

  const createLessonSchema = z.object({
    Title: z.string().trim().min(1, {
      message: 'O título é obrigatório',
    }),
    description: z.string().trim().min(1, {
      message: 'A descrição é obrigatória',
    }),
    image: z
      .object({
        size: z.number(),
        type: z.string(),
        name: z.string(),
        lastModified: z.number(),
      })
      .or(z.string())
      .refine(
        (data) => {
          if (!data) {
            throw new Error('A imagem é obrigatória');
          }

          if (typeof data !== 'string') {
            const requiredFields = ['size', 'type', 'name', 'lastModified'];
            return requiredFields.every((field) =>
              Object.prototype.hasOwnProperty.call(data, field),
            );
          }
        },
        {
          message: 'A imagem é obrigatória',
        },
      ),
    audio: z
      .object({
        size: z.number(),
        type: z.string(),
        name: z.string(),
        lastModified: z.number(),
      })
      .or(z.string())
      .refine(
        (data) => {
          if (!data) {
            throw new Error('O áudio é obrigatório');
          }

          if (typeof data !== 'string') {
            const requiredFields = ['size', 'type', 'name', 'lastModified'];
            return requiredFields.every((field) =>
              Object.prototype.hasOwnProperty.call(data, field),
            );
          }
        },
        {
          message: 'O áudio é obrigatório',
        },
      ),
  });

  $: isSubmictionInProcess = false;

  const handleSubmit: SubmitFunction = async ({ formData, cancel }) => {
    const title = formData.get('Title')?.toString().trim() ?? '';

    formData.set('Title', title);
    formData.append('image', selectedPhoto as string);
    formData.append('audio', selectedAudio as string);

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );
    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = createLessonSchema.safeParse(formDataObject);

    if (!validator.success) {
      errors = {};
      // Extract errors
      validator.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      return cancel();
    }

    isSubmictionInProcess = true;

    try {
      const photo = selectedPhoto as File;
      const audio = selectedAudio as File;
      const imageKey = await uploadDirect('image', photo, (p) => (uploadLabel = `Enviando imagem: ${p}%`));
      const audioKey = await uploadDirect('audio', audio, (p) => (uploadLabel = `Enviando áudio: ${p}%`));
      // O arquivo já está no storage: o formulário leva só as chaves (nada pesado passa pelo servidor).
      formData.delete('image');
      formData.delete('audio');
      formData.set('imageKey', imageKey);
      formData.set('audioKey', audioKey);
      formData.set('imageName', photo.name);
      formData.set('audioName', audio.name);
    } catch (err) {
      isSubmictionInProcess = false;
      uploadLabel = '';
      errors = { audio: (err as Error).message };
      return cancel();
    }
    uploadLabel = '';

    return async ({ result }) => {
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

          if ((resultObtained.type === 'titleExists')) {
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
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Novo arquivo</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Título" id="Title" required={true} error={errors.Title ?? ''}>
        <input class="input {errors.Title ? 'input-error' : ''}" type="text" name="Title" id="Title" placeholder="Título do arquivo" autocomplete="off" />
      </Field>
      <Field label="Descrição" id="description" required error={errors.description ?? ''}>
        <textarea class="input {errors.description ? 'input-error' : ''}" name="description" id="description" rows="4" placeholder="Sobre este arquivo"></textarea>
      </Field>
      <div class="form-grid">
        <Field label="Imagem" required error={errors.image ?? ''}>
          <ImagePicker preview={urlPrevilimg} on:change={handleChangePhoto} />
        </Field>
        <Field label="Áudio" required error={errors.audio ?? ''}>
          <AudioPicker src={NameAudio == '' ? '' : String(audioUrl)} fileName={NameAudio} on:change={handleChangeAudio} />
        </Field>
      </div>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/lessons?cancelled=1" formaction="?/createLessonServer" submitLabel="Criar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
  {#if uploadLabel}<p class="upload-progress" role="status" aria-live="polite" data-testid="upload-progress">{uploadLabel}</p>{/if}
</div>
