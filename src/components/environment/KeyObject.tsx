import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useStoryStore } from "@/store/useStoryStore";

/**
 * Transceptor — El objeto clave del MVP.
 * Visual: octaedro negro con luz azul eléctrica pulsante.
 * Mecánica: Al recogerlo activa la condición de objetivo y triggerDialogue.
 */
export function KeyObject({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [collected, setCollected] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!meshRef.current || !lightRef.current) return;
    // Levitación suave
    meshRef.current.position.y = Math.sin(t * 1.8) * 0.12;
    // Rotación constante
    meshRef.current.rotation.y += 0.015;
    meshRef.current.rotation.x += 0.005;
    // Pulso de la emisión
    const pulse = 0.8 + Math.sin(t * 3) * 0.6;
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      pulse;
    lightRef.current.intensity = pulse * 3;
  });

  if (collected) return null;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider
        args={[0.45, 0.45, 0.45]}
        sensor
        onIntersectionEnter={(payload) => {
          if (collected) return;
          if (payload.other.rigidBodyObject?.userData?.type !== "player")
            return;
          setCollected(true);
          useStoryStore.getState().collectObjective();
        }}
      />

      {/* Luz puntual azul eléctrico */}
      <pointLight ref={lightRef} color="#00aaff" intensity={3} distance={5} />

      {/* Octaedro — forma angular alienígena */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.35]} />
        <meshStandardMaterial
          color="#050510"
          emissive="#00aaff"
          emissiveIntensity={1}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </RigidBody>
  );
}
