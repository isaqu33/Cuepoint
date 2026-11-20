<script lang="ts">
  export let cancelHref: string;
  export let submitLabel = 'Salvar';
  /** Action do SvelteKit (ex.: ?/createSerieServer); omita se o <form> já tem action. */
  export let formaction: string | undefined = undefined;
  export let disabled = false;
</script>

<footer class="form-footer">
  <a href={cancelHref} class="btn btn-sm variant-ringed">Cancelar</a>
  <button class="btn btn-sm variant-filled-primary min-w-24" {formaction} {disabled}>
    {#if disabled}<span class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>{/if}
    {submitLabel}
  </button>
</footer>
