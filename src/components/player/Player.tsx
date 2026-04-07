import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, useKeyboardControls } from "@react-three/drei";
import {
  RigidBody,
  RapierRigidBody,
  CapsuleCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import { HandsModel } from "./HandsModel";
import { usePlayerStore } from "@/store/usePlayerStore";

const SPEED = 5;
const BOB_FREQUENCY = 10;
const BOB_AMPLITUDE = 0.05;

export function Player() {
  const [, get] = useKeyboardControls();
  const { camera } = useThree();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const handsGroupRef = useRef<THREE.Group>(null);
  const { setVelocity } = usePlayerStore();

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();
  const viewBobTime = useRef(0);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const { forward, backward, left, right } = get();

    // 1. Calculamos los ejes locales de la cámara en el plano XZ
    const forwardVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    forwardVector.y = 0;
    forwardVector.normalize();

    // El vector derecho es perpendicular al frente y al techo (Y global)
    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(forwardVector, camera.up).normalize();

    // 2. Sacar la fuerza pura
    const forwardMag = Number(forward) - Number(backward);
    const sideMag = Number(right) - Number(left);

    // 3. Crear el vector resultante sumando ambas fuerzas y estabilizar en el plano
    direction.set(0, 0, 0);
    direction.addScaledVector(forwardVector, forwardMag);
    direction.addScaledVector(rightVector, sideMag);
    direction.normalize().multiplyScalar(SPEED);

    // 3. Empuje Dinámico (Rapier)
    const currentVel = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel(
      { x: direction.x, y: currentVel.y, z: direction.z },
      true,
    );

    // 4. Copiar Posición Corporal hacia Ojos/Cámara
    const rbPosition = rigidBodyRef.current.translation();
    // Desplazamos la cámara hacia arriba (Y) simular la "cabeza" de la cápsula
    camera.position.set(rbPosition.x, rbPosition.y + 0.6, rbPosition.z);

    // 5. Game Feel: View Bobbing dependiente de la inercia plana real
    const movementMagnitude = Math.abs(direction.x) + Math.abs(direction.z);
    if (movementMagnitude > 0) {
      viewBobTime.current += delta * 15;
      camera.position.y +=
        Math.sin(viewBobTime.current * (BOB_FREQUENCY / 15)) * BOB_AMPLITUDE;
    } else {
      viewBobTime.current = 0;
    }

    // 6. Sincronización Manos Visuales
    if (handsGroupRef.current) {
      handsGroupRef.current.position.copy(camera.position);
      // Aplicamos leve offset para situarlas en POV
      handsGroupRef.current.translateZ(-0.2);
      handsGroupRef.current.rotation.copy(camera.rotation);
    }

    // 7. Store update
    setVelocity([direction.x, currentVel.y, direction.z]);
  });

  return (
    <>
      <PointerLockControls />
      {/* 
        Capsule Dynamic: Simula el cuerpo masivo del humano.
        enabledRotations [false, false, false]: Desactiva que el jugador ruede por las paredes.
      */}
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        type="dynamic"
        position={[0, 1.5, 0]}
        enabledRotations={[false, false, false]}
        // Masa realista para que interactúe físicamente correcto con objetos después
        mass={80}
        friction={0}
        restitution={0}
      >
        <CapsuleCollider args={[0.5, 0.3]} friction={0} restitution={0} />
      </RigidBody>
      <group ref={handsGroupRef}>
        <HandsModel />
      </group>
    </>
  );
}
