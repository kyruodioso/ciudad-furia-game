import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useStoryStore } from "@/store/useStoryStore";

// ─── Dimensiones de la puerta (ajustables) ─────────────────────────────────
const DOOR_WIDTH = 2.0; // ancho del vano
const DOOR_HEIGHT = 3.0; // alto del vano
const JAMB_W = 0.25; // grosor de las jambas
const JAMB_D = 0.4; // profundidad de las jambas

/**
 * ExtractionZone — Puerta de extracción final.
 *
 * Visual: Dos jambas verticales + dintel horizontal + luz verde pulsante.
 * El jugador debe cruzar el umbral para activar la victoria.
 * Sensor: CuboidCollider delgado en el vano de la puerta.
 */
export function ExtractionZone({
  position = [0, 0, -22],
}: {
  position?: [number, number, number];
}) {
  const thresholdRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lintRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.5 + Math.sin(t * 2.5) * 0.4;

    if (thresholdRef.current) {
      (
        thresholdRef.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = pulse;
    }
    if (lintRef.current) {
      (
        lintRef.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = pulse;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3 + pulse * 4;
    }
  });

  return (
    <group position={position}>
      {/* ── Sensor de detección ── */}
      {/* IMPORTANTE: sin position prop — hereda el transform del <group position={position}> padre */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0.6]}
          sensor
          onIntersectionEnter={(payload) => {
            const type = payload.other.rigidBodyObject?.userData?.type;
            if (type !== "player") return;
            const { hasObjective } = useStoryStore.getState();
            if (!hasObjective) {
              console.log(
                "[ExtractionZone] ⚠️ Sensor OK, pero falta el Transceptor.",
              );
              return;
            }
            useStoryStore.getState().extractPlayer();
          }}
        />
      </RigidBody>

      {/* ── Luz puntual central (pulsa) ── */}
      <pointLight
        ref={lightRef}
        color="#00ff88"
        intensity={6}
        distance={8}
        position={[0, DOOR_HEIGHT / 2, 0]}
      />

      {/* ── Jamba izquierda ── */}
      <group position={[-(DOOR_WIDTH / 2 + JAMB_W / 2), DOOR_HEIGHT / 2, 0]}>
        <mesh>
          <boxGeometry args={[JAMB_W, DOOR_HEIGHT, JAMB_D]} />
          <meshStandardMaterial
            color="#111820"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Borde interior brillante */}
        <mesh position={[JAMB_W / 2 + 0.01, 0, 0]}>
          <boxGeometry args={[0.03, DOOR_HEIGHT, JAMB_D]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ── Jamba derecha ── */}
      <group position={[DOOR_WIDTH / 2 + JAMB_W / 2, DOOR_HEIGHT / 2, 0]}>
        <mesh>
          <boxGeometry args={[JAMB_W, DOOR_HEIGHT, JAMB_D]} />
          <meshStandardMaterial
            color="#111820"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Borde interior brillante */}
        <mesh position={[-(JAMB_W / 2 + 0.01), 0, 0]}>
          <boxGeometry args={[0.03, DOOR_HEIGHT, JAMB_D]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ── Dintel (parte superior) ── */}
      <mesh ref={lintRef} position={[0, DOOR_HEIGHT + JAMB_W / 2, 0]}>
        <boxGeometry args={[DOOR_WIDTH + JAMB_W * 2, JAMB_W, JAMB_D]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* ── Umbral de luz en el suelo ── */}
      <mesh
        ref={thresholdRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[DOOR_WIDTH, JAMB_D * 1.5]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
