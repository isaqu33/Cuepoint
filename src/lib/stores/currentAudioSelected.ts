import { writable } from 'svelte/store';

interface AudioSelection {
  src: string | undefined;
  nameLesson: string | undefined;
  idLessonAudio: string | undefined;
  srcImg: string | undefined;
  bookName: string | undefined;
  studiesName: string | undefined;
}

function createCurrentAudioSelected(initialSelection: AudioSelection) {
  const { subscribe, set, update } = writable(initialSelection);

  return {
    subscribe,
    set,
    update: (updater: (value: AudioSelection) => AudioSelection) => {
      update((current) => updater(current));
    },
    clear: () =>
      set({
        src: undefined,
        nameLesson: undefined,
        idLessonAudio: undefined,
        srcImg: undefined,
        bookName: undefined,
        studiesName: undefined,
      }),
  };
}
export const currentAudioSelected = createCurrentAudioSelected({
  src: undefined,
  nameLesson: undefined,
  idLessonAudio: undefined,
  srcImg: undefined,
  bookName: undefined,
  studiesName: undefined,
});
