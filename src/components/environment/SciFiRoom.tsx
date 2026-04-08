import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { PhysicsBox } from "./PhysicsBox";
import { WeaponPickup } from "./WeaponPickup";
import { IronBarPickup } from "./IronBarPickup";
import { NarrativeTrigger } from "./NarrativeTrigger";
import { Dog } from "./Dog";
import { Enemy } from "./Enemy";
import { Atmosphere } from "./Atmosphere";
import { LevelBlock } from "./LevelBlock";

export function SciFiRoom() {
  return (
    <group>
      {/* 
      {/* Renderizado de Clima y Diseño de Nivel Base */}
      <Atmosphere />
      <LevelBlock />

      {/* 5. Target Practice: Torre Inestable de Cajas */}
      <PhysicsBox position={[-5, 0.6, -5]} />
      <PhysicsBox position={[-5, 1.7, -5]} />
      <PhysicsBox position={[-5, 2.8, -5]} />
      <PhysicsBox position={[-5, 3.9, -5]} />
      <PhysicsBox position={[-5, 5.0, -5]} />

      {/* 6. Altar de Armas (Loot / Inventario) */}
      <group position={[5, 0, 5]}>
        {/* Pedestal estático en el suelo (1m de altura, centrado en Y=0.5) */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.2, 1, 1.2]} />
            <meshStandardMaterial
              color="#1a1c22"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </RigidBody>

        {/* El botín suspendido arriba del pedestal */}
        <WeaponPickup position={[0, 1.5, 0]} />
      </group>

      {/* 7. Loot Inicial: Barra de Hierro en el suelo */}
      <IronBarPickup position={[0, 0.5, 3]} />

      {/* 9. Narrative Volume Trigger (Antes de chocar con el Dummy) */}
      <NarrativeTrigger
        position={[0, 2, -2.5]}
        args={[10, 5, 1.5]}
        dialogueText="¿A eso le llamás golpear? Hasta mi abuela pega más fuerte... y está muerta."
      />

      {/* 10. Compañía: Golden Retriever Companion AI */}
      {/* Ubicado en Z = 2 para empezar observando al jugador de frente */}
      <Dog position={[2, 0.1, 2]} />

      {/* 11. Oportunistas (Enemigos que persiguen a cortas distancias) */}
      <Enemy position={[-3, 0.1, -6]} />
      <Enemy position={[3, 0.1, -8]} />
    </group>
  );
}
