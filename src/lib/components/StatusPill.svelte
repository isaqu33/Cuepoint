<script lang="ts">
  export let status: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED' | string = 'IDLE';

  const map: Record<string, { cls: string; label: string }> = {
    IDLE: { cls: 'pill-idle', label: 'Sem transcrição' },
    QUEUED: { cls: 'pill-queued', label: 'Na fila' },
    PROCESSING: { cls: 'pill-processing', label: 'Processando' },
    READY: { cls: 'pill-ready', label: 'Pronto' },
    FAILED: { cls: 'pill-failed', label: 'Falhou' },
  };
  $: view = map[status] ?? map.IDLE;
</script>

<span class="pill {view.cls}">{view.label}</span>
