<script lang="ts">
  import Logo from '$lib/components/Logo.svelte';
  import { AppShell, type ModalComponent, type ModalSettings, Toast } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import type { LayoutData } from './$types';
  import getI18nStore from '../../i18n/i18n';
  import { setContext } from 'svelte';
  import { getDrawerStore } from '@skeletonlabs/skeleton';
  import { goto } from '$app/navigation';
  import AppLoader from '$lib/components/AppLoader.svelte';
  import AppFrame from '$lib/components/shell/AppFrame.svelte';
  import { navFor } from '$lib/nav';
  import DrawerHost from '$lib/components/shell/DrawerHost.svelte';
  import { initializeStores, Modal, getModalStore } from '@skeletonlabs/skeleton';

  import UpArrow from '$lib/components/icons/UpArrow.svelte';
  import DownArrow from '$lib/components/icons/DownArrow.svelte';
  import ModalChangePassword from '../../lib/components/ModalChangePassword.svelte';
  import ModalChangeProfile from '../../lib/components/ModalChangeProfile.svelte';
  import { popup } from '@skeletonlabs/skeleton';
  import { TreeView, TreeViewItem } from '@skeletonlabs/skeleton';
  import AppIcon from '$lib/components/icons/AppIcon.svelte';
  import ChangePasswordIcon from '$lib/components/icons/ChangePasswordIcon.svelte';
  import ProfileIcon from '$lib/components/icons/ProfileIcon.svelte';
  import OutIcon from '$lib/components/icons/OutIcon.svelte';
  import UserGroupIcon from '$lib/components/icons/UserGroupIcon.svelte';
  import LessonIcon from '$lib/components/icons/LessonIcon.svelte';
  import SeriesIcon from '$lib/components/icons/SeriesIcon.svelte';
  import BookIcon from '$lib/components/icons/BookIcon.svelte';

  initializeStores();

  $: embed = $page.url.searchParams.has('embed');

  export let data: LayoutData | any;

  let loading = true;

  setContext('i18n', getI18nStore());

  let currentRoute = $page;
  let pathRouter: string = '';
  const handleRouteChange = () => {
    currentRoute = $page;

    pathRouter = currentRoute.route.id as string;
  };

  onMount(() => {
    const unsubscribe = page.subscribe(handleRouteChange);

    loading = false;
    return () => {
      unsubscribe();
    };
  });

  const drawerStore = getDrawerStore();

  function drawerClose(): void {
    drawerStore.close();
  }

  let isUserOptionsOpened = false;

  function handlePopupState(event: { state: boolean }) {
    isUserOptionsOpened = event.state;
  }
  const modalStore = getModalStore();

  const modalComponentRegistry: Record<string, ModalComponent> = {
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
</script>

<Toast />
<Modal components={modalComponentRegistry} />

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
  <div class={embed ? 'h-full' : 'mx-auto w-full max-w-[1400px] p-4 md:p-8'}>
    <slot />
  </div>
</AppFrame>

{#if !embed}<DrawerHost />{/if}
