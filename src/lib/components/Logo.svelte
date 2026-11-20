<script lang="ts">
  import { brand } from '$lib/brand';

  /** Altura do símbolo em px. */
  export let size = 32;
  /** Mostra o nome ao lado do símbolo. */
  export let wordmark = true;
  /** Classe do texto do nome (tamanho). */
  export let textClass = 'text-xl';
</script>

<span class="inline-flex items-center gap-2.5">
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    role={wordmark ? undefined : 'img'}
    aria-label={wordmark ? undefined : brand.name}
    aria-hidden={wordmark ? 'true' : undefined}
  >
    <defs>
      <linearGradient id="cpg" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#4F8CFF" />
        <stop offset="1" stop-color="#7C5CFF" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="18" fill="url(#cpg)" />
    <g fill="#fff">
      <rect x="9" y="29" width="6" height="14" rx="3" fill-opacity=".7" />
      <rect x="19" y="23" width="6" height="26" rx="3" fill-opacity=".85" />
      <rect x="29" y="17" width="6" height="38" rx="3" />
      <rect x="39" y="23" width="6" height="26" rx="3" fill-opacity=".85" />
      <rect x="49" y="29" width="6" height="14" rx="3" fill-opacity=".7" />
    </g>
    <circle cx="32" cy="10" r="4" fill="#fff" />
  </svg>
  {#if wordmark}
    <span class="{textClass} font-bold leading-none tracking-tight"
      >Cue<span class="font-medium opacity-60">point</span></span
    >
  {/if}
</span>
