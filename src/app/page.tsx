"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Player } from "@/components/player/Player";
import { SciFiRoom } from "@/components/environment/SciFiRoom";
import { SubtitlesUI } from "@/components/ui/SubtitlesUI";
import { SurvivalHUD } from "@/components/ui/SurvivalHUD";
import { AudioEngine } from "@/components/ui/AudioEngine";
import { VictoryOverlay } from "@/components/ui/VictoryScreen";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
];

export default function GamePage() {
  return (
    <main id="game-container" className="w-full h-full relative bg-black">
      <KeyboardControls map={keyboardMap}>
        <Canvas
          camera={{ fov: 75 }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
          }}
        >
          <color attach="background" args={["#000000"]} />

          {/* Motor de Físicas Maestro */}
          <Physics>
            <SciFiRoom />
            <Player />
          </Physics>

          <EffectComposer>
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </Canvas>

        {/* HUD Crosshair Minimalista */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none text-2xl font-bold select-none mix-blend-difference">
          +
        </div>

        {/* Narrative Subtitles Engine HUD */}
        <SubtitlesUI />

        {/* Player Survival HUD */}
        <SurvivalHUD />

        {/* Motor de Audio: precarga buffers y vigila subtítulos para SFX narrativo */}
        <AudioEngine />

        {/* Pantalla de victoria — se monta automáticamente al extraerse */}
        <VictoryOverlay />
      </KeyboardControls>
    </main>
  );
}
