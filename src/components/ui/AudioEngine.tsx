"use client";

import { useEffect } from "react";
import { useAudioStore, type AudioManifest } from "@/store/useAudioStore";
import { useNarrativeAudio } from "@/hooks/useNarrativeAudio";

/**
 * Componente invisible que activa el motor de audio.
 *
 * Responsabilidades:
 * 1. Precargar todos los buffers de audio al montar (sin bloquear el render).
 * 2. Montar el hook useNarrativeAudio para vigilar los subtítulos de La Voz.
 *
 * Debe montarse UNA SOLA VEZ, fuera del <Canvas>, junto a los demás overlays de UI.
 */

const AUDIO_MANIFEST: AudioManifest[] = [
  // Capa 2D: Efecto de entrada de diálogo de La Voz
  { id: "sfx_glitch", url: "/audio/ui_glitch.mp3", type: "2d" },
  // Capa 3D: Loop de gruñido posicional del Oportunista
  { id: "enemy_growl", url: "/audio/enemy_growl_loop.mp3", type: "3d" },
];

export function AudioEngine() {
  // Precarga paralela de buffers al montar la app
  useEffect(() => {
    useAudioStore.getState().preloadSounds(AUDIO_MANIFEST);
  }, []);

  // Vigilar subtítulos y disparar SFX narrativo 2D
  useNarrativeAudio();

  // Sin JSX: este componente es puramente lógico
  return null;
}
