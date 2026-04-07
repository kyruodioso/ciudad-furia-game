import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { PhysicsBox } from "./PhysicsBox";

export function SciFiRoom() {
  return (
    <group>
      {/* 
        3. Atmosfera y Luces
      */}
      <ambientLight color="#0b0f19" intensity={0.5} />

      <pointLight
        position={[0, 3, 0]}
        color="#f0f"
        intensity={200}
        distance={30}
        castShadow={false}
      />

      <pointLight
        position={[5, 2, -5]}
        color="#0ff"
        intensity={200}
        distance={30}
        castShadow
      />

      {/* 
        2. Colisionadores fijos estructurales
      */}
      {/* Suelo */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        rotation={[-Math.PI / 2, 0, 0]}
        friction={0}
      >
        <mesh>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial
            color="#111"
            metalness={0.8}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Techo */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, 4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        friction={0}
      >
        <mesh>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial
            color="#050505"
            metalness={0.5}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Muros del Perímetro */}
      {/* Norte */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, 2, -10]}
        friction={0}
      >
        <mesh>
          <boxGeometry args={[20, 4, 1]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.6}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Sur */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, 2, 10]}
        friction={0}
      >
        <mesh>
          <boxGeometry args={[20, 4, 1]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.6}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Este */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[10, 2, 0]}
        friction={0}
      >
        <mesh>
          <boxGeometry args={[1, 4, 20]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.6}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Oeste */}
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[-10, 2, 0]}
        friction={0}
      >
        <mesh>
          <boxGeometry args={[1, 4, 20]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.6}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* 
        4. Materialidad (Efectos Neón)
      */}
      <mesh position={[0, 2, -9.4]}>
        <boxGeometry args={[12, 0.15, 0.1]} />
        <meshStandardMaterial
          color="#222"
          emissive="#0ff"
          emissiveIntensity={2}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[9.4, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[12, 0.15, 0.1]} />
        <meshStandardMaterial
          color="#222"
          emissive="#f0f"
          emissiveIntensity={2}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. Target Practice: Torre Inestable de Cajas */}
      <PhysicsBox position={[-5, 0.6, -5]} />
      <PhysicsBox position={[-5, 1.7, -5]} />
      <PhysicsBox position={[-5, 2.8, -5]} />
      <PhysicsBox position={[-5, 3.9, -5]} />
      <PhysicsBox position={[-5, 5.0, -5]} />
    </group>
  );
}
