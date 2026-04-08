import { create } from "zustand";

interface StoryState {
  currentSubtitle: string | null;
  triggerDialogue: (text: string, duration?: number) => void;
  _timeoutRef: ReturnType<typeof setTimeout> | null;
  // Sistema de victoria
  hasObjective: boolean;
  isExtracted: boolean;
  collectObjective: () => void;
  extractPlayer: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  currentSubtitle: null,
  _timeoutRef: null,
  hasObjective: false,
  isExtracted: false,

  triggerDialogue: (text, duration = 4000) => {
    const state = get();
    if (state._timeoutRef) {
      clearTimeout(state._timeoutRef);
    }
    const timeout = setTimeout(() => {
      set({ currentSubtitle: null, _timeoutRef: null });
    }, duration);
    set({ currentSubtitle: text, _timeoutRef: timeout });
  },

  collectObjective: () => {
    set({ hasObjective: true });
    get().triggerDialogue(
      "Ya lo tenés. Ahora salí de ahí antes de que lleguen más.",
      6000,
    );
  },

  extractPlayer: () => {
    const { hasObjective } = get();
    if (!hasObjective) return; // Guard: sin el transceptor no hay extracción
    set({ isExtracted: true });
  },
}));
