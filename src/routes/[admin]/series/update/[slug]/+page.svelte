<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import ImagePicker from '$lib/components/ui/ImagePicker.svelte';
  import type { SubmitFunction } from './$types.ts';
  import { z } from 'zod';
  import { Toast, Autocomplete, InputChip } from '@skeletonlabs/skeleton';
  import { FileButton } from '@skeletonlabs/skeleton';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import type { CustomPageDataUpdate, ReturnSubmit } from '../../types.js';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';

  export let data: CustomPageDataUpdate;

  const toastStore = getToastStore();

  let selectedPhoto: string | Blob | null = null;
  let urlPrevilimg: string = '';

  let valueLessons: string[] = [];
  let valueSeries: string[] = [];

  if (data.data) {
    valueLessons = data.data.lessons.map((item: { title: string }) => item.title);
    valueSeries = data.data.series.map((item: { title: string }) => item.title);

    urlPrevilimg = data.data.photoLeson;
    selectedPhoto = data.data.photoLeson;
  }

  const handleChangePhoto = (event: Event) => {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement?.files && inputElement.files.length > 0) {
      let fileReader = new FileReader();
      fileReader.onload = (fileEvent: ProgressEvent<FileReader>) => {
        const fileTarget = fileEvent.target;
        if (fileTarget?.result) {
          urlPrevilimg = fileTarget.result as string;
        }
      };
      fileReader.readAsDataURL(inputElement.files[0]);
      selectedPhoto = inputElement.files[0];
    }
  };

  const serieSchema = z.object({
    title: z.string().min(1, {
      message: 'O título é obrigatório',
    }),
    about: z.string().min(1, {
      message: 'A descrição é obrigatória',
    }),
    lessons: z.array(z.string()).min(1, {
      message: 'Selecione ao menos um arquivo',
    }),
  });

  $: isSubmictionInProcess = false;

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    errors = {};

    try {
      const validation = serieSchema.safeParse({
        title: data.data.title?.trim(),
        about: data.data.about?.trim(),
        lessons: valueLessons,
      });

      if (!validation.success) {
        validation.error.issues.forEach((issue) => {
          switch (issue.path[0]) {
            case 'title':
              errors.Title = issue.message;
              break;
            case 'about':
              errors.About = issue.message;
              break;
            case 'lessons':
              errors.selectedLessons = issue.message;
              break;
          }
        });

        cancel();
        return;
      }

      const fieldsToDelete = ['Title', 'About', 'selectedLessons', 'selectedSeries', 'image', 'id'];
      fieldsToDelete.forEach((field) => formData.delete(field));

      formData.append('Title', data.data.title);
      formData.append('About', data.data.about);
      formData.append('selectedLessons', valueLessons.join(','));
      formData.append('selectedSeries', valueSeries.join(','));
      formData.append('id', data.data.id);

      // Importante: adicionar a imagem ao FormData se ela for alterada
      if (selectedPhoto instanceof File) {
        formData.append('image', selectedPhoto);
      } else {
        // Enviar a URL atual da imagem se não for alterada
        formData.append('image', data.data.photoLeson);
      }
    } catch (error) {
      cancel();
      return;
    }

    isSubmictionInProcess = true;

    return async ({ result }) => {
      if (result.type === 'success' && result.data) {
        let resultObtained = result.data as ReturnSubmit;
        isSubmictionInProcess = false;

        if (resultObtained.status === 500) {
          isSubmictionInProcess = false;
          errors.Title = resultObtained.statusText;
          return;
        }

        toastStore.trigger({
          message: resultObtained.statusText,
          background: 'card',
          hideDismiss: true,
        });

        if (resultObtained.hasChanges) {
          await invalidateAll();
          goto('/admin/series');
        }
      }
    };
  };

  let lessonsDataToList = data.lessons.map((item: { title: string; id: string }) => ({
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

  let errors: Record<string, string> = {};
</script>

<Toast />
{#if data.data}
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Editar subcoleção</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Título" id="Title" required={true} error={errors.Title ?? ''}>
        <input class="input {errors.Title ? 'input-error' : ''}" type="text" name="Title" id="Title" placeholder="Título da subcoleção" autocomplete="off" bind:value={data.data.title} />
      </Field>
      <Field label="Descrição" id="About" required error={errors.About ?? ''}>
        <textarea class="input {errors.About ? 'input-error' : ''}" name="About" id="About" rows="4" placeholder="Sobre esta subcoleção" bind:value={data.data.about}></textarea>
      </Field>
      <ChipSelect label="Arquivos" placeholder="Clique e busque arquivos" error={errors.selectedLessons ?? ''} options={lessonsDataToList} bind:value={valueLessons} bind:input={inputPopupDemoLessons} on:selection={onPopupDemoSelectLesson} />
      <Field label="Imagem" required error={errors.image ?? ''}>
        <ImagePicker preview={urlPrevilimg} on:change={handleChangePhoto} />
      </Field>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/series?cancelled=1" formaction="?/updateSerieServer" submitLabel="Salvar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
</div>
{/if}
