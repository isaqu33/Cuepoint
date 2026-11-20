<script lang="ts">
  import AudioPicker from '$lib/components/ui/AudioPicker.svelte';
  import ChipSelect from '$lib/components/ui/ChipSelect.svelte';
  import FormActions from '$lib/components/ui/FormActions.svelte';
  import Field from '$lib/components/ui/Field.svelte';
  import ImagePicker from '$lib/components/ui/ImagePicker.svelte';
  import type { SubmitFunction } from './$types.ts';
  import { FileButton, Toast, Autocomplete, InputChip } from '@skeletonlabs/skeleton';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { z } from 'zod';
  import type { CustomPageDataUpdate, ReturnSubmit } from '../../types.js';
  import LoadActionReturn from '$lib/components/LoadActionReturn.svelte';

  export let data: CustomPageDataUpdate;

  const toastStore = getToastStore();

  let selectedPhoto: string | Blob | null = null;

  let urlPrevilimg: string = '';

  let valueSeries: string[] = [];

  if (data.data) {
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
          urlPrevilimg = fileTarget?.result as string;
        }
      };

      fileReader.readAsDataURL(inputElement.files[0]);

      selectedPhoto = inputElement.files[0];
    }
  };

  let errors: Record<string, string> = {};

  const updateSchema = z.object({
    Title: z.string().trim().min(1, {
      message: 'O título é obrigatório',
    }),
    About: z.string().trim().min(1, {
      message: 'O campo Sobre é obrigatório',
    }),
    selectedSeries: z.string().refine((data) => data.trim().length > 0, {
      message: 'Selecione ao menos uma subcoleção',
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
  });

  $: isSubmictionInProcess = false;

  const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
    const title = formData.get('Title')?.toString().trim() ?? '';

    formData.set('Title', title);
    formData.append('selectedSeries', [valueSeries].toString());
    formData.append('image', selectedPhoto as string);
    formData.append('id', data.data.id.toString());

    const formDataObject = Object.fromEntries(
      Array.from(formData as unknown as [string, FormDataEntryValue][]),
    );
    const honeypot = formDataObject['honeypot']?.toString() ?? '';

    if (honeypot !== '') {
      cancel();
    }

    const validator = updateSchema.safeParse(formDataObject);

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
      if (result.type === 'success' && result.data) {
        let resultObtained = result.data as ReturnSubmit;
        if (resultObtained.status == 200) {
          await invalidateAll();

          toastStore.trigger({
            message: resultObtained.statusText,
            background: 'card',
            hideDismiss: true,
          });
          goto('/admin/courses');
        }
        if (resultObtained.status == 555) {
          isSubmictionInProcess = false;
          errors = {};
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

  let SeriesDataToList = data.allSeries.map((item) => ({
    label: item.title,
    value: item.id,
    id: item.id,
  }));

  let inputPopupDemoSerie: string = '';

  function onPopupDemoSelectSerie(item: { detail: { label: string } }) {
    if (valueSeries.includes(item.detail.label)) {
      return null;
    }

    valueSeries = [...valueSeries, item.detail.label];
  }
</script>

<Toast />
{#if data.data !== null}
<div class="form-page">
  <div class="form-title"><h1 class="page-title">Editar coleção</h1></div>
  <form class="form-shell" method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
    <div class="form-body">
      <Field label="Título" id="Title" required={true} error={errors.Title ?? ''}>
        <input class="input {errors.Title ? 'input-error' : ''}" type="text" name="Title" id="Title" placeholder="Nome da coleção" autocomplete="off" bind:value={data.data.title} />
      </Field>
      <Field label="Sobre" id="About" required error={errors.About ?? ''}>
        <textarea class="input {errors.About ? 'input-error' : ''}" name="About" id="About" rows="4" placeholder="Sobre esta coleção" bind:value={data.data.about}></textarea>
      </Field>
      <ChipSelect label="Subcoleções" placeholder="Clique e busque subcoleções" error={errors.selectedSeries ?? ''} options={SeriesDataToList} bind:value={valueSeries} bind:input={inputPopupDemoSerie} on:selection={onPopupDemoSelectSerie} />
      <Field label="Imagem" required error={errors.image ?? ''}>
        <ImagePicker preview={urlPrevilimg} on:change={handleChangePhoto} />
      </Field>
      <input class="absolute left-[-9999px]" type="text" name="honeypot" id="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
    </div>
    <FormActions cancelHref="/admin/courses?cancelled=1" formaction="?/updateCourseServer" submitLabel="Salvar" disabled={isSubmictionInProcess} />
  </form>
  {#if isSubmictionInProcess}<LoadActionReturn />{/if}
</div>
{/if}
