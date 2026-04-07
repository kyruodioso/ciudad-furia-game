import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { BlasterModel } from "../player/BlasterModel";

interface WeaponPickupProps {
  position: [number, number, number];
}

export function WeaponPickup({ position }: WeaponPickupProps) {
  const [pickedUp, setPickedUp] = useState(false);
  const meshRef = useRef<THREE.Group>(null);

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
        <group ref={meshRef}>
          {/* El arma artística suspendida */}
          <BlasterModel
            position={[0, -0.1, 0]}
            rotation={[0, 0, 0]}
            scale={[0.015, 0.015, 0.015]}
          />

          {/* Holograma / Aura neón de contexto */}
          <pointLight color="#00ffcc" intensity={30} distance={4} />
        </group>
      </RigidBody>
    </group>
  );
}
