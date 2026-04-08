import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { PhysicsBox } from "./PhysicsBox";
import { WeaponPickup } from "./WeaponPickup";
import { IronBarPickup } from "./IronBarPickup";
import { NarrativeTrigger } from "./NarrativeTrigger";
import { Dog } from "./Dog";
import { Enemy } from "./Enemy";
import { Atmosphere } from "./Atmosphere";
import { LevelBlock } from "./LevelBlock";
import { KeyObject } from "./KeyObject";
import { ExtractionZone } from "./ExtractionZone";
import { Medkit } from "./Medkit";

// ─── Límites del nivel (Bordes invisibles) ──────────────────────────────────
const LEVEL_HALF_W = 14; // mitad del ancho (X)
const LEVEL_HALF_D = 18; // mitad del largo (Z)
const LEVEL_CENTER_Z = -10; // centro Z del nivel para cubrir desde spawm hasta extracción
const WALL_H = 8; // altura de las paredes
const WALL_T = 1; // grosor de las paredes

export function SciFiRoom() {
  return (
    <group>
      {/* 1. Atmósfera y Bloques de Nivel (Suelo, Niebla, Luces) */}
      <Atmosphere />
      <LevelBlock />

      {/* 2. Bordes invisibles para evitar caídas */}
      {/* Pared Norte (detrás de la extracción) */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, WALL_H / 2, LEVEL_CENTER_Z - LEVEL_HALF_D]}
      >
        <CuboidCollider args={[LEVEL_HALF_W, WALL_H, WALL_T]} />
      </RigidBody>

      {/* Pared Sur (detrás del spawn) */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, WALL_H / 2, LEVEL_CENTER_Z + LEVEL_HALF_D]}
      >
        <CuboidCollider args={[LEVEL_HALF_W, WALL_H, WALL_T]} />
      </RigidBody>

      {/* Pared Oeste (izquierda) */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[-LEVEL_HALF_W, WALL_H / 2, LEVEL_CENTER_Z]}
      >
        <CuboidCollider args={[WALL_T, WALL_H, LEVEL_HALF_D]} />
      </RigidBody>

      {/* Pared Este (derecha) */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[LEVEL_HALF_W, WALL_H / 2, LEVEL_CENTER_Z]}
      >
        <CuboidCollider args={[WALL_T, WALL_H, LEVEL_HALF_D]} />
      </RigidBody>

      {/* Techo */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, WALL_H, LEVEL_CENTER_Z]}
      >
        <CuboidCollider args={[LEVEL_HALF_W, WALL_T, LEVEL_HALF_D]} />
      </RigidBody>

      {/* 3. Target Practice: Cajas Físicas */}
      <PhysicsBox position={[-5, 0.6, -5]} />
      <PhysicsBox position={[-5, 1.7, -5]} />
      <PhysicsBox position={[-5, 2.8, -5]} />
      <PhysicsBox position={[-5, 3.9, -5]} />
      <PhysicsBox position={[-5, 5.0, -5]} />

      {/* 4. Loot: Altar de Armas (Blaster) */}
      <group position={[5, 0, 5]}>
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
        <WeaponPickup position={[0, 1.5, 0]} />
      </group>

      {/* 5. Loot Inicial: Barra de Hierro */}
      <IronBarPickup position={[0, 0.5, 3]} />

      {/* 6. Narrative: Volumen de Trigger */}
      <NarrativeTrigger
        position={[0, 2, -2.5]}
        args={[10, 5, 2]}
        dialogueText="¿A eso le llamás golpear? Hasta mi abuela pega más fuerte... y está muerta."
      />

      {/* 7. Compañero: Dog AI */}
      <Dog position={[2, 0.1, 2]} />

      {/* 8. Enemigos: Oportunistas */}
      <Enemy position={[-3, 0.1, -6]} />
      <Enemy position={[3, 0.1, -8]} />

      {/* 9. Objetivo: Transceptor (Interacción clave) */}
      <KeyObject position={[-6, 0.8, -14]} />

      {/* 10. Victoria: Puerta de Extracción */}
      <ExtractionZone position={[0, 0, -22]} />
      {/* 11. Recuperación: Medkits */}
      <Medkit position={[8, 0.5, 2]} />
      <Medkit position={[-8, 0.5, -10]} />
    </group>
  );
}
