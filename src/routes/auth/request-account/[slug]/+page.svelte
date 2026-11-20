<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
</script>

<div class="">
  <div class=" card flex h-full w-full">
    <section class="  w-full flex-col">
      <div class=" flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <div class="flex items-center justify-center gap-2">
          <h1 class="h1 font-extrabold"><Logo size={44} textClass="text-4xl font-extrabold" /></h1>
        </div>
        <div class="flex items-center space-x-4">
          <div class="space-y-2 text-lg">
            <p class=" mb-5 mt-2 font-medium leading-none">
              Seu e-mail foi verificado com sucesso!
            </p>
            <p>
              Volte para o <a href="/auth/login" class=" anchor">Cuepoint</a> website to
              login.Enjoy our resources!
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
