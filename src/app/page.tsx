"use client";

import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Sky } from "@react-three/drei";
import { Player } from "@/components/player/Player";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
];

export default function GamePage() {
  return (
    <main className="w-full h-full relative">
      <KeyboardControls map={keyboardMap}>
        <Canvas camera={{ fov: 75 }}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />

          <Player />

          <gridHelper args={[100, 100]} position={[0, -1.5, 0]} />
        </Canvas>

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none text-2xl font-bold select-none mix-blend-difference">
          +
        </div>
      </KeyboardControls>
    </main>
  );
}
