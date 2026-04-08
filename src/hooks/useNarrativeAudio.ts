"use client";

import { useEffect, useRef } from "react";
import { useStoryStore } from "@/store/useStoryStore";
import { useAudioStore } from "@/store/useAudioStore";

/**
 * Hook de Audio Narrativo 2D.
 *
 * Se monta una única vez en la raíz de la UI (fuera del Canvas). Vigila
 * `currentSubtitle` en useStoryStore y dispara el efecto de estática/glitch
 * cuando "La Voz" comienza a hablar. No tiene JSX de retorno.
 *
 * Política de Autoplay: Sólo reproduce si `isAudioUnlocked === true`.
 */
export function useNarrativeAudio() {
  const currentSubtitle = useStoryStore((state) => state.currentSubtitle);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Si el subtítulo desaparece, detenemos la estática
    if (currentSubtitle === null) {
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch {
          // El nodo ya terminó de reproducirse, ignorar el error
        }
        activeSourceRef.current = null;
      }
      return;
    }

    // Nuevo subtítulo activo: disparar el efecto de glitch/estática 2D
    const { isAudioUnlocked, play2D } = useAudioStore.getState();
    if (!isAudioUnlocked) return;

    // Detener cualquier estática previa antes de iniciar la nueva
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        // Nodo ya expirado
      }
    }

    // Reproducir el SFX de estática (sin loop, es un one-shot de entrada)
    const source = play2D("sfx_glitch", { loop: false, volume: 0.6 });
    activeSourceRef.current = source;
  }, [currentSubtitle]);
}
