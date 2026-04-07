import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";

interface WeaponPickupProps {
  position: [number, number, number];
}

export function WeaponPickup({ position }: WeaponPickupProps) {
  const [pickedUp, setPickedUp] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Rotación constante sobre si misma (Eje Y global) y Levitación (Seno)
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  if (pickedUp) return null;

  return (
    <group position={position}>
      <RigidBody
        type="kinematicPosition"
        colliders="cuboid"
        sensor
        // Pasamos por metadata la orden de autodestrucción al jugador (Hitscan la decodificará)
        userData={{
          type: "pickup",
          item: "blaster",
          onPickup: () => setPickedUp(true),
        }}
      >
        <mesh ref={meshRef}>
          <boxGeometry args={[0.8, 0.2, 0.3]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={1.5}
            toneMapped={false}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </RigidBody>
    </group>
  );
}
