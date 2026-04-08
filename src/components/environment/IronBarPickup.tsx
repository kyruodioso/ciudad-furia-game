import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CuboidCollider } from "@react-three/rapier";
import { usePlayerStore } from "@/store/usePlayerStore";

interface IronBarPickupProps {
  position: [number, number, number];
}

export function IronBarPickup({ position }: IronBarPickupProps) {
  const [pickedUp, setPickedUp] = useState(false);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current && !pickedUp) {
      // Rotación y flotación sutil
      meshRef.current.rotation.y += 0.03;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  if (pickedUp) return null;

  return (
    <group position={position}>
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor
        onIntersectionEnter={(payload) => {
          // Si el jugador asume el intersection, recogemos el arma
          const ud = payload.other.rigidBodyObject?.userData as { type?: string };
          if (ud && ud.type === "player") {
            usePlayerStore.getState().pickupWeapon("iron_bar");
            setPickedUp(true);
          }
        }}
      />
      <group ref={meshRef}>
        <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.04, 0.05, 1.2, 16]} />
          <meshStandardMaterial
            color="#888888"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        <pointLight color="#ffcc00" intensity={15} distance={3} />
      </group>
    </group>
  );
}
