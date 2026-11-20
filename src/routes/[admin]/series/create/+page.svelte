<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import ImagePicker from '$lib/components/ui/ImagePicker.svelte';
  import type { SubmitFunction } from '../$types.ts';
  import { z } from 'zod';
  import { Toast, InputChip, Autocomplete } from '@skeletonlabs/skeleton';
  import { FileButton } from '@skeletonlabs/skeleton';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import type { CustomPageData, ReturnSubmit } from '../types';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';

  export let data: CustomPageData;

  const toastStore = getToastStore();

  let errors: Record<string, string> = {};

  let selectedPhoto: string | Blob | null = null;

  let urlPrevilimg: string = '';
  let valueLessons: string[] = [];

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

  const createSeriesSchema = z.object({
    Title: z.string().trim().min(1, {
      message: 'O título é obrigatório',
    }),
    About: z.string().trim().min(1, {
      message: 'A descrição é obrigatória',
    }),
    selectedLessons: z.string().refine((data) => data.trim().length > 0, {
      message: 'Selecione ao menos um arquivo',
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
            return false;
          }

          if (typeof data === 'string') {
            return data.trim().length > 0;
          }

          const requiredFields = ['size', 'type', 'name', 'lastModified'];
          return requiredFields.every((field) => field in data);
        },
        {
          message: 'A imagem é obrigatória',
        },
      ),
  });

  $: isSubmictionInProcess = false;

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    formData.append('selectedLessons', [valueLessons].toString());
    formData.append('image', selectedPhoto ? selectedPhoto : '');

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );
    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = createSeriesSchema.safeParse(formDataObject);

    if (!validator.success) {
      errors = {};
      validator.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });

      return cancel();
    }

    isSubmictionInProcess = true;

    return async ({ result }) => {
      if (result.type === 'success' && result.data) {
        errors = {};
        let resultObtained = result.data as ReturnSubmit;

        if (resultObtained.status === 200) {
          await invalidateAll();

          toastStore.trigger({
            message: resultObtained.statusText,
            background: 'card',
            hideDismiss: true,
          });
          goto('/admin/series');
        } else {
          isSubmictionInProcess = false;

          if (resultObtained.status === 555) {
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

  let lessonsDataToList = data.lessons.map((item) => ({
    label: item.title,
    value: item.id,
    id: item.id,
  }));

  let inputPopupDemoLessons: string = '';

  function onPopupDemoSelectLesson(item: { detail: { label: string } }) {
    if (valueLessons.includes(item.detail.label)) {
      return null;
    }
    valueLessons = [...valueLessons, item.detail.label];
  }
</script>

<Toast />
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Nova subcoleção</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Título" id="Title" required={true} error={errors.Title ?? ''}>
        <input class="input {errors.Title ? 'input-error' : ''}" type="text" name="Title" id="Title" placeholder="Título da subcoleção" autocomplete="off" />
      </Field>
      <Field label="Descrição" id="About" required error={errors.About ?? ''}>
        <textarea class="input {errors.About ? 'input-error' : ''}" name="About" id="About" rows="4" placeholder="Sobre esta subcoleção"></textarea>
      </Field>
      <ChipSelect label="Arquivos" placeholder="Clique e busque arquivos" error={errors.selectedLessons ?? ''} options={lessonsDataToList} bind:value={valueLessons} bind:input={inputPopupDemoLessons} on:selection={onPopupDemoSelectLesson} />
      <Field label="Imagem" required error={errors.image ?? ''}>
        <ImagePicker preview={urlPrevilimg} on:change={handleChangePhoto} />
      </Field>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/series?cancelled=1" formaction="?/createSerieServer" submitLabel="Criar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
</div>
