<script lang="ts">
  export let label = '';
  export let id = '';
  export let required = false;
  export let error = '';
  export let hint = '';
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={id || undefined}>
      {label}{#if required}<span class="text-error-500" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}
  <slot />
  {#if hint && !error}<p class="muted mt-1.5 text-xs">{hint}</p>{/if}
  {#if error}<p class="mt-1.5 text-sm text-error-500" role="alert">{error}</p>{/if}
</div>
