<script lang="ts">
  import { enhance } from '$app/forms';
  import CardApp from '$lib/components/CardApp.svelte';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { CustomPageData, ReturnSubmit } from './types';

  export let data: CustomPageData;

  let getMoreCoursesPagination = 100;

  const handleSubmit: SubmitFunction = ({ formData }) => {
    formData.append('id', data.data.id.toString());
    formData.append('coursesPagination', getMoreCoursesPagination.toString());

    return async ({ result }) => {
      if (result.type === 'success' && result.data) {
        let resultObtained = result.data as ReturnSubmit;
        data.data.series = resultObtained.data.series;
      }
    };
  };
</script>

<div class="mx-auto w-full max-w-[1400px] p-4 md:p-8">
  <nav class="muted mb-5 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Caminho">
    <a href="/app" class="hover:underline">Biblioteca</a>
    <span aria-hidden="true">/</span>
    <span class="text-current">{data.data.title}</span>
  </nav>

  <header class="mb-8">
    <h1 class="page-title">{data.data.title}</h1>
    <p class="page-sub mt-1">Coleção · escolha uma subcoleção para ver os arquivos.</p>
  </header>

  {#if !data.data.series.length}
    <div class="panel"><div class="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p class="text-base font-semibold">Nenhuma subcoleção ainda</p>
      <p class="page-sub">Quando houver subcoleções publicadas, elas aparecem aqui.</p>
    </div></div>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {#each data.data.series as item}
        <CardApp
          dataInformation={{
            id: item.id,
            router: `/app/series/byId/${item.id}?book=${data.data.title}&idbook=${data.data.id}`,
            photo: item.photoLeson,
            language: data.language,
            title: item.title,
            about: item.description ? item.description : item.about,
          }}
        ></CardApp>
      {/each}
    </div>
    <form method="POST" use:enhance={handleSubmit} class="mt-8 flex justify-center">
      <button type="submit" on:click={() => { getMoreCoursesPagination += 10; }} class="btn btn-sm variant-ringed" formaction="?/getMoreDataFromCourseById">
        Carregar mais
      </button>
    </form>
  {/if}
</div>
