import { create } from "zustand";

interface StoryState {
  currentSubtitle: string | null;
  triggerDialogue: (text: string, duration?: number) => void;
  _timeoutRef: ReturnType<typeof setTimeout> | null;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  currentSubtitle: null,
  _timeoutRef: null,
  triggerDialogue: (text, duration = 4000) => {
    const state = get();
    // Protección contra race-conditions: Limpiamos timeouts superpuestos
    if (state._timeoutRef) {
      clearTimeout(state._timeoutRef);
    }
    const timeout = setTimeout(() => {
      set({ currentSubtitle: null, _timeoutRef: null });
    }, duration);
    set({ currentSubtitle: text, _timeoutRef: timeout });
  },
}));
