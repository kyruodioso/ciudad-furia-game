import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  CapsuleCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerStore } from "@/store/usePlayerStore";

export function Enemy({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [hp, setHp] = useState(100);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const hitFlash = useRef(0);
  const attackCooldown = useRef(0);

  const { currentPos, targetPos, lookQuaternion } = useMemo(() => {
    return {
      currentPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      lookQuaternion: new THREE.Quaternion(),
    };
  }, []);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !meshGroupRef.current) return;

    // Hit flash procedural (Zero Re-render)
    if (hitFlash.current > 0) {
      hitFlash.current -= delta * 5;
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = Math.max(0, hitFlash.current);
      }
    }

    // Sistema de Cooldown de ataque
    if (attackCooldown.current > 0) {
      attackCooldown.current -= delta;
    }

    state.camera.getWorldPosition(targetPos);
    targetPos.y = 0;

    const rbPos = rigidBodyRef.current.translation();
    currentPos.set(rbPos.x, rbPos.y, rbPos.z);

    const distanceXZ = new THREE.Vector2(currentPos.x, currentPos.z).distanceTo(
      new THREE.Vector2(targetPos.x, targetPos.z),
    );

    // Orientación hacia el jugador (Se aplica sólo a la parte visual para no afectar la física simétrica)
    const angle = Math.atan2(
      targetPos.x - currentPos.x,
      targetPos.z - currentPos.z,
    );
    lookQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    meshGroupRef.current.quaternion.slerp(lookQuaternion, 10 * delta);

    // Motor Neuronal de Decisión de la IA (Físicas Dinámicas usando linvel)
    if (distanceXZ <= 10.0 && distanceXZ > 1.5) {
      // Calcular dirección normalizada
      const dirX = targetPos.x - currentPos.x;
      const dirZ = targetPos.z - currentPos.z;
      const length = Math.sqrt(dirX * dirX + dirZ * dirZ);

      const ENEMY_SPEED = 3.0; // metros por segundo
      const velX = (dirX / length) * ENEMY_SPEED;
      const velZ = (dirZ / length) * ENEMY_SPEED;

      // Preservar la gravedad Y del motor de rapier
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        { x: velX, y: currentVel.y, z: velZ },
        true,
      );

      // Animación visual de marcha
      const time = state.clock.elapsedTime;
      meshGroupRef.current.position.y = Math.abs(Math.sin(time * 10)) * 0.1;
    } else if (distanceXZ <= 1.5) {
      // Alto total frenando su inercia XZ, pero dejando su Y intácta
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);

      meshGroupRef.current.position.y = THREE.MathUtils.lerp(
        meshGroupRef.current.position.y,
        0,
        12 * delta,
      );

      // Inflingir daño si el cooldown esta limpio
      if (attackCooldown.current <= 0) {
        usePlayerStore.getState().receiveDamage(10);
        attackCooldown.current = 1.5; // Cooldown
      }
    } else {
      // Fuera de alcance: detener inercia XZ
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
    }
  });

  if (hp <= 0) return null; // Aniquilación del Actor

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      enabledRotations={[false, false, false]}
      userData={{
        type: "enemy",
        receiveDamage: (damage: number) => {
          setHp((prev) => prev - damage);
          hitFlash.current = 2.0;
        },
      }}
    >
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 0.5, 0]} />

      {/* Greyboxing Vectorizado: El Oportunista. */}
      <group ref={meshGroupRef}>
        <mesh position={[0, 0.5, 0]}>
          <capsuleGeometry args={[0.5, 1, 16, 32]} />
          <meshStandardMaterial
            ref={materialRef}
            color="#8b0000"
            emissive="#ff0000"
            emissiveIntensity={0}
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>

        {/* Lentes o visor negro para reconocer su frente */}
        <mesh position={[0, 0.8, 0.5]}>
          <boxGeometry args={[0.6, 0.15, 0.2]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#330000"
            roughness={0.1}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
