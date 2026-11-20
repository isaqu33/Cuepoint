<script lang="ts">
  import type { CustomPageData, ReturnSubmit } from './types';
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import CardApp from '$lib/components/CardApp.svelte';

  export let data: CustomPageData;

  let paginationSerie = 100;

  const handleSubmit: SubmitFunction = ({ formData }) => {
    formData.append('id', data.data.id.toString());
    formData.append('paginationSerie', paginationSerie.toString());

    return async ({ result }) => {
      if (result.type === 'success' && result.data) {
        let resultObtained = result.data as ReturnSubmit;
        data.data.lessons = resultObtained.data.lessons;
      }
    };
  };
</script>

<div class="mx-auto w-full max-w-[1400px] p-4 md:p-8">
  <nav class="muted mb-5 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Caminho">
    <a href="/app" class="hover:underline">Biblioteca</a>
    <span aria-hidden="true">/</span>
    <a href={`/app/course/byId/${data.idbook}`} class="hover:underline">{data.book}</a>
    <span aria-hidden="true">/</span>
    <span class="text-current">{data.data.title}</span>
  </nav>

  <header class="mb-8">
    <h1 class="page-title">{data.data.title}</h1>
    <p class="page-sub mt-1">Subcoleção de {data.book} · arquivos de áudio e vídeo.</p>
  </header>

  {#if !data.data.lessons.length}
    <div class="panel"><div class="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p class="text-base font-semibold">Nenhum arquivo ainda</p>
      <p class="page-sub">Quando houver arquivos publicados, eles aparecem aqui.</p>
    </div></div>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {#each data.data.lessons as item}
        <CardApp
          dataInformation={{
            id: item.id,
            router: `/app/lesson/${item.id}?book=${data.book}&idbook=${data.idbook}&studies=${data.data.title}&idstudies=${data.data.id}`,
            photo: item.photoLeson,
            language: data.language,
            title: item.title,
            about: item.description ? item.description : item.about,
          }}
        ></CardApp>
      {/each}
    </div>
    <form method="POST" use:enhance={handleSubmit} class="mt-8 flex justify-center">
      <button type="submit" on:click={() => { paginationSerie += 10; }} class="btn btn-sm variant-ringed" formaction="?/getMoreDataFromSerieById">
        Carregar mais
      </button>
    </form>
  {/if}
</div>
