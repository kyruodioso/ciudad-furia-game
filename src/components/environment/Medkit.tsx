import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAudioStore } from "@/store/useAudioStore";

/**
 * Medkit — Objeto de recuperación de salud.
 * Visual: Caja blanca con cruz verde, levita y rota.
 * Lógica: Al entrar en contacto con el jugador recupera 30 HP y dispara sfx_heal.
 */
export function Medkit({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [collected, setCollected] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const { healPlayer } = usePlayerStore();
  const { play2D } = useAudioStore();

  useFrame((state) => {
    if (!meshRef.current || collected) return;
    const t = state.clock.elapsedTime;

    // Bobbing (levitación)
    meshRef.current.position.y = Math.sin(t * 2) * 0.15 + 0.5;
    // Rotación
    meshRef.current.rotation.y += 0.02;
  });

  if (collected) return null;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider
        args={[0.4, 0.4, 0.4]}
        sensor
        onIntersectionEnter={(payload) => {
          if (payload.other.rigidBodyObject?.userData?.type === "player") {
            setCollected(true);
            healPlayer(30);
            play2D("sfx_heal"); // Asegurarse de que este asset exista o se maneje en el store
          }
        }}
      />

      <group ref={meshRef}>
        {/* Cuerpo del botiquín */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.4, 0.3]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>

        {/* Cruz verde (Horizontal) */}
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[0.3, 0.08, 0.02]} />
          <meshStandardMaterial
            color="#00ff44"
            emissive="#00cc22"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Cruz verde (Vertical) */}
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[0.08, 0.3, 0.02]} />
          <meshStandardMaterial
            color="#00ff44"
            emissive="#00cc22"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Brillo inferior */}
        <pointLight
          color="#00ff44"
          intensity={1}
          distance={2}
          position={[0, -0.2, 0]}
        />
      </group>
    </RigidBody>
  );
}
