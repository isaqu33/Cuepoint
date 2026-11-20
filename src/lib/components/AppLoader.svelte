<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
</script>

<div class="">
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
    <section class=" w-full flex-col">
      <div class=" flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <div class="text-center">
          <div class="mx-auto flex justify-center animate-pulse"><Logo size={64} wordmark={false} /></div>
          <h2 class="mt-4 font-bold text-black">Loading Cuepoint...</h2>
        </div>
      </div>
    </section>
  </div>
</div>
