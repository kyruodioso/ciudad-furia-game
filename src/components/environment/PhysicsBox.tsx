import { RigidBody } from "@react-three/rapier";

interface PhysicsBoxProps {
  position: [number, number, number];
}

export function PhysicsBox({ position }: PhysicsBoxProps) {
  return (
    // Masa 10 le da un peso decente para sentir los impactos
    <RigidBody type="dynamic" colliders="cuboid" position={position} mass={10}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ff4400" // Naranja advertencia vibrante
          metalness={0.7}
          roughness={0.2}
          emissive="#330000" // Leve incandescencia para mezclarse bien con la atmósfera oscura
          emissiveIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}
