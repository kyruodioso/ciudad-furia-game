import { useRef } from "react";
import * as THREE from "three";

export function HandsModel() {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, -0.2, -0.5]}>
      {/* Mano Izquierda */}
      <mesh position={[-0.4, -0.2, 0]} rotation={[0.4, 0.4, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.4]} />
        <meshStandardMaterial color="#d4b49c" />
      </mesh>
      {/* Mano Derecha */}
      <mesh position={[0.4, -0.2, 0]} rotation={[0.4, -0.4, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.4]} />
        <meshStandardMaterial color="#d4b49c" />
      </mesh>
    </group>
  );
}
