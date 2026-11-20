import { writable } from 'svelte/store';

interface AudionOnProcessProp {
  lessonId?: string;
  porcentagem?: number;
}

function createCurrentAudionOnProcess() {
  const { subscribe, set, update } = writable<AudionOnProcessProp[]>([]);

  return {
    subscribe,
    set,
    addOrUpdate: (newEntry: AudionOnProcessProp) => {
      update((lessonsIdList) => {
        const index = lessonsIdList.findIndex((item) => item.lessonId === newEntry.lessonId);

        if (index !== -1) {
          const updated = [...lessonsIdList];
          updated[index] = { ...updated[index], porcentagem: newEntry.porcentagem };
          return updated;
        }

        return [...lessonsIdList, newEntry];
      });
    },
    clear: () => set([]),
  };
}

export const currentAudionsOnTranscribe = createCurrentAudionOnProcess();
