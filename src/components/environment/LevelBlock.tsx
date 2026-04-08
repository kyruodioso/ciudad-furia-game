import { RigidBody } from "@react-three/rapier";

export function LevelBlock() {
  return (
    <group>
      {/* 1. Asfalto Principal Destruido */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        rotation={[-Math.PI / 2, 0, 0]}
        friction={0.8}
      >
        <mesh>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial
            color="#111111"
            metalness={0.1}
            roughness={0.9}
          />
        </mesh>
      </RigidBody>

      {/* 2. Barricadas / Autos Abandonados (Impiden línea visual y atascan) */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[-3, 1, 0]}
        rotation={[0, 0.4, 0]}
      >
        <mesh>
          <boxGeometry args={[4, 1.5, 2]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[4, 1, -2]}
        rotation={[0, -0.2, 0]}
      >
        <mesh>
          <boxGeometry args={[4, 1.5, 2]} />
          <meshStandardMaterial color="#332222" roughness={0.8} />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[-1, 1, -12]}
        rotation={[0, 0.7, 0]}
      >
        <mesh>
          <boxGeometry args={[3, 1.5, 2]} />
          <meshStandardMaterial color="#1a2a2a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* 3. Muros delimitantes (Final del bloque) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2, -15]}>
        <mesh>
          <boxGeometry args={[20, 6, 2]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}
