import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FlickeringLightProps {
  position: [number, number, number];
  color: string;
  intensity: number;
}

function FlickeringLight({ position, color, intensity }: FlickeringLightProps) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    // Zero-Rerenders: Parpadeo errático matemático
    // mutado nativamente sobre la instancia THREE.PointLight
    const isFlickering = Math.random() > 0.95;
    lightRef.current.intensity = isFlickering ? intensity * 0.1 : intensity;
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      distance={20}
      intensity={intensity}
    />
  );
}

export function Atmosphere() {
  return (
    <>
      <fogExp2 attach="fog" args={["#0a0a10", 0.05]} />
      <ambientLight intensity={0.1} color="#0d111a" />
      <directionalLight
        position={[10, 20, 5]}
        intensity={0.2}
        color="#1f2335"
        castShadow
      />

      {/* Luces de emergencia / post-apagón */}
      <FlickeringLight position={[0, 4, 3]} color="#ffaa00" intensity={150} />
      <FlickeringLight position={[-5, 3, -8]} color="#00ffcc" intensity={100} />
    </>
  );
}
