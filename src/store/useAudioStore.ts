import { create } from "zustand";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioManifest {
  id: string;
  url: string;
  type: "2d" | "3d";
}

interface AudioState {
  /** Verdadero sólo después de un gesto explícito del usuario. Guarda de Autoplay Policy. */
  isAudioUnlocked: boolean;
  /** Buffers precargados indexados por id semántico. */
  audioBuffers: Map<string, AudioBuffer>;
  /** El AudioContext compartido de Three.js/Web Audio API. */
  audioContext: AudioContext | null;

  /** Desbloquea el motor de audio. Debe llamarse desde el primer gesto del usuario. */
  unlockAudio: () => void;
  /** Precarga todos los archivos de audio del manifiesto en memoria. */
  preloadSounds: (manifest: AudioManifest[]) => Promise<void>;
  /** Reproduce un sonido 2D por su id, retornando el nodo fuente activo. */
  play2D: (
    id: string,
    options?: { loop?: boolean; volume?: number },
  ) => AudioBufferSourceNode | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAudioStore = create<AudioState>((set, get) => ({
  isAudioUnlocked: false,
  audioBuffers: new Map(),
  audioContext: null,

  unlockAudio: () => {
    const state = get();
    if (state.isAudioUnlocked) return;

    // Guard de SSR: No intentar crear AudioContext en el servidor
    if (typeof window === "undefined") return;

    let ctx = state.audioContext;
    if (!ctx) {
      // Soporte para navegadores antiguos y normalización
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error(
          "[AudioStore] AudioContext no soportado en este navegador.",
        );
        return;
      }
      ctx = new AudioContextClass();
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    set({ isAudioUnlocked: true, audioContext: ctx });
    console.log(
      "[AudioStore] Motor de audio desbloqueado. AudioContext state:",
      ctx.state,
    );
  },

  preloadSounds: async (manifest: AudioManifest[]) => {
    const state = get();
    // Guard de SSR: No precargar en el servidor
    if (typeof window === "undefined") return;

    let ctx = state.audioContext;
    if (!ctx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      ctx = new AudioContextClass();
      set({ audioContext: ctx });
    }

    const buffers = new Map(state.audioBuffers);

    const loadPromises = manifest.map(async ({ id, url }) => {
      if (buffers.has(id)) return; // Ya precargado, skip
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx!.decodeAudioData(arrayBuffer);
        buffers.set(id, audioBuffer);
        console.log(`[AudioStore] ✓ Precargado: ${id}`);
      } catch (err) {
        console.warn(
          `[AudioStore] ✗ Error al precargar "${id}" desde "${url}":`,
          err,
        );
      }
    });

    await Promise.all(loadPromises);
    // Actualizar el Map en el store (nueva referencia para reactividad si se necesita)
    set({ audioBuffers: new Map(buffers) });
  },

  play2D: (id, options = {}) => {
    const { isAudioUnlocked, audioBuffers, audioContext } = get();
    if (!isAudioUnlocked || !audioContext) {
      console.warn(
        `[AudioStore] play2D("${id}") bloqueado: audio no desbloqueado.`,
      );
      return null;
    }

    const buffer = audioBuffers.get(id);
    if (!buffer) {
      console.warn(
        `[AudioStore] play2D("${id}"): buffer no encontrado. ¿Fue precargado?`,
      );
      return null;
    }

    const gainNode = audioContext.createGain();
    gainNode.gain.value = options.volume ?? 1.0;
    gainNode.connect(audioContext.destination);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;
    source.connect(gainNode);
    source.start(0);

    return source;
  },
}));
