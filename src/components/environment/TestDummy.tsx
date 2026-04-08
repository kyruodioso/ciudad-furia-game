import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";

export function TestDummy({
  position,
}: {
  position: [number, number, number];
}) {
  const [hp, setHp] = useState(100);
  const hitFlash = useRef(0);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (hitFlash.current > 0) {
      hitFlash.current -= delta;
      if (materialRef.current) {
        materialRef.current.emissive.setHex(0xff0000);
        // Desvanecimiento suave del efecto
        materialRef.current.emissiveIntensity = 2 * (hitFlash.current / 0.2);
      }
    } else {
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = 0;
      }
    }
  });

  // Zero re-render physics destruction loop
  // Al retornar null, react desechará el RigidBody y su malla
  if (hp <= 0) return null;

  return (
    <RigidBody
      type="dynamic"
      position={position}
      // Bloqueamos la rotación para darle el feeling de que es un pilar robusto y no cae
      enabledRotations={[false, false, false]}
      mass={60}
      userData={{
        type: "enemy",
        receiveDamage: (amount: number) => {
          setHp((prev) => Math.max(0, prev - amount));
          hitFlash.current = 0.2; // 200 milisegundos de flash rojo intenso
        },
      }}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      <mesh>
        <capsuleGeometry args={[0.5, 1, 16, 32]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#4a6fa5"
          metalness={0.5}
          roughness={0.7}
        />
      </mesh>
    </RigidBody>
  );
}
