<script lang="ts">
  import { brand } from '$lib/brand';
  import Logo from '$lib/components/Logo.svelte';
  import Icon from '$lib/components/shell/Icon.svelte';
  import ThemeToggle from '$lib/components/shell/ThemeToggle.svelte';
</script>

<div class="h-full overflow-y-auto">
  <div class="mx-auto grid min-h-full max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_minmax(0,26rem)]">
    <!-- Marca + prévia do produto -->
    <section class="hidden lg:block">
      <Logo size={40} textClass="text-2xl" />
      <h2 class="mt-10 max-w-lg text-4xl font-semibold leading-[1.15] tracking-tight">
        {brand.tagline}
      </h2>
      <p class="muted mt-4 max-w-md text-base leading-relaxed">{brand.message}</p>

      <div class="relative mt-12 h-72 max-w-xl" aria-hidden="true">
        <div class="panel absolute left-0 top-0 w-72 p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">entrevista-episodio-12.mp3</p>
            <span class="pill pill-processing">Processando</span>
          </div>
          <div class="progress mt-4"><span style="width: 62%"></span></div>
          <p class="muted mt-2 text-xs">Transcrevendo · 62%</p>
        </div>

        <div class="panel absolute right-0 top-10 w-80 p-4">
          <p class="muted text-xs font-medium">Revisão</p>
          <ul class="mt-2 space-y-1.5 text-sm">
            <li class="flex gap-3"><span class="muted tabular-nums">00:00</span>Bem-vindos ao episódio de hoje.</li>
            <li
              class="-mx-2 flex gap-3 rounded-lg px-2 py-1"
              style="background: rgb(var(--color-primary-500) / .14)"
            >
              <span class="tabular-nums text-primary-500">00:08</span>Vamos falar sobre processos.
            </li>
            <li class="flex gap-3"><span class="muted tabular-nums">00:15</span>Primeiro, o planejamento.</li>
          </ul>
        </div>

        <div class="panel absolute bottom-0 left-16 flex w-64 items-center gap-3 p-4">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-success-500/15 text-success-500">
            <Icon name="check" size={16} />
          </span>
          <div>
            <p class="text-sm font-semibold">Transcrição pronta</p>
            <p class="muted text-xs">Exportar texto ou legendas</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Formulário -->
    <section class="relative">
      <div class="absolute -top-2 right-0"><ThemeToggle /></div>
      <div class="lg:hidden"><Logo size={36} textClass="text-2xl" /></div>
      <div class="panel p-2 sm:p-4"><slot /></div>
    </section>
  </div>
</div>
