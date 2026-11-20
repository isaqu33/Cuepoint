<script lang="ts">
  interface dataInformationType {
    id: string;
    photo: string;
    language: string;
    title: string;
    router: string;
    about: string | undefined;
  }

  export let dataInformation: dataInformationType = {
    id: '',
    photo: '',
    router: '',
    language: '',
    title: '',
    about: '',
  };
</script>

<a
  href={dataInformation.router || '#'}
  class="panel card-hover group flex flex-col overflow-hidden"
  title={dataInformation.title}
>
  <div class="aspect-square w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
    <img
      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      src={dataInformation.photo}
      alt=""
      loading="lazy"
    />
  </div>
  <div class="p-3">
    <h3 class="line-clamp-2 text-sm font-semibold leading-snug">{dataInformation.title}</h3>
  </div>
</a>
