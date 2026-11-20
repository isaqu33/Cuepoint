<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
  import {
    AppBar,
    AppShell,
    type ModalComponent,
    type ModalSettings,
    Toast,
  } from '@skeletonlabs/skeleton';
  import getI18nStore from '../../i18n/i18n';
  import { setContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { initializeStores, Modal, getModalStore } from '@skeletonlabs/skeleton';
  import { enhance } from '$app/forms';
  import { currentAudioSelected } from '$lib/stores/currentAudioSelected';
  import type { CustomPageData } from './types';
  import AppLoader from '$lib/components/AppLoader.svelte';
  import AppFrame from '$lib/components/shell/AppFrame.svelte';
  import { navFor } from '$lib/nav';
  import DrawerHost from '$lib/components/shell/DrawerHost.svelte';
  import { popup } from '@skeletonlabs/skeleton';
  import DownArrow from '$lib/components/icons/DownArrow.svelte';
  import UpArrow from '$lib/components/icons/UpArrow.svelte';
  import MusicPlayer from '../../lib/components/MusicPlayer.svelte';
  import ModalChangePassword from '../../lib/components/ModalChangePassword.svelte';
  import ModalChangeProfile from '../../lib/components/ModalChangeProfile.svelte';
  import { page } from '$app/stores';
  import AdminIcon from '$lib/components/icons/AdminIcon.svelte';
  import ChangePasswordIcon from '$lib/components/icons/ChangePasswordIcon.svelte';
  import ProfileIcon from '$lib/components/icons/ProfileIcon.svelte';
  import OutIcon from '$lib/components/icons/OutIcon.svelte';

  export let data: CustomPageData;

  initializeStores();

  $: embed = $page.url.searchParams.has('embed');

  const modalStore = getModalStore();

  const modalRegistry: Record<string, ModalComponent> = {
    modalComponentOne: { ref: ModalChangePassword },
    modalComponentTwo: { ref: ModalChangeProfile },
  };

  const modalChangePassword: ModalSettings = {
    type: 'component',
    component: 'modalComponentOne',
    meta: data.language,
  };

  const modalChangeProfile: ModalSettings = {
    type: 'component',
    component: 'modalComponentTwo',
    meta: data.language,
  };

  setContext('i18n', getI18nStore());

  let loading = true;
  let isUserOptionsOpened = false;

  function handlePopupState(event: { state: boolean }) {
    isUserOptionsOpened = event.state;
  }

  let count: {
    bookName: string | undefined;
    studiesName: string | undefined;
    src?: string | undefined;
    nameLesson?: string | undefined;
  } = {
    bookName: undefined,
    studiesName: undefined,
  };

  currentAudioSelected.subscribe((value) => {
    count = value;
  });

  let currentRoute = $page;
  let pathRouter: string = '';

  const handleRouteChange = () => {
    currentRoute = $page;
    pathRouter = currentRoute.route.id?.split('/')[2]
      ? currentRoute.route.id?.split('/')[2]
      : 'Dashboard';

    if (pathRouter !== 'lesson') {
      currentAudioSelected.clear();
    }
  };

  onMount(() => {
    const unsubscribe = page.subscribe(handleRouteChange);

    loading = false;

    return () => {
      unsubscribe();
    };
  });
</script>

<Toast />
<Modal components={modalRegistry} />

{#if loading}
  <AppLoader />
{/if}

<AppFrame
  groups={navFor(!!(data.data.isAdmin || data.data.isSystem), !!data.data.isSystem)}
  showNew={!!(data.data.isAdmin || data.data.isSystem)}
  bare={embed}
  userName={data.data.name}
  isAdmin={!!(data.data.isAdmin || data.data.isSystem)}
  switchTo={null}
  onChangePassword={() => modalStore.trigger(modalChangePassword)}
  onProfile={() => modalStore.trigger(modalChangeProfile)}
>
  <slot />

  <svelte:fragment slot="footer">
    {#if count.src !== undefined}
      <MusicPlayer
        nameLesson={count.nameLesson}
        studiesName={count.studiesName}
        bookName={count.bookName}
      />
    {/if}
  </svelte:fragment>
</AppFrame>

{#if !embed}<DrawerHost />{/if}
