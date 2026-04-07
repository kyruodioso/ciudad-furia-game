import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  PointerLockControls,
  useKeyboardControls,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  RigidBody,
  RapierRigidBody,
  CapsuleCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import { PlayerHands } from "./PlayerHands";
import { usePlayerStore } from "@/store/usePlayerStore";

const SPEED = 5;
const BOB_FREQUENCY = 10;
const BOB_AMPLITUDE = 0.05;

export function Player() {
  const [, get] = useKeyboardControls();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { setVelocity } = usePlayerStore();

  const direction = new THREE.Vector3();
  const viewBobTime = useRef(0);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !cameraRef.current) return;
    const camera = cameraRef.current;

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

    // 4. Empuje Dinámico (Rapier)
    const currentVel = rigidBodyRef.current.linvel();
    rigidBodyRef.current.setLinvel(
      { x: direction.x, y: currentVel.y, z: direction.z },
      true,
    );

    // 5. Game Feel: View Bobbing (mutamos la posicion Y local de la cámara)
    const movementMagnitude = Math.abs(direction.x) + Math.abs(direction.z);
    if (movementMagnitude > 0) {
      viewBobTime.current += delta * 15;
      camera.position.y =
        0.6 +
        Math.sin(viewBobTime.current * (BOB_FREQUENCY / 15)) * BOB_AMPLITUDE;
    } else {
      viewBobTime.current = 0;
      // Interpolamos suavemente de regreso a la posición neutra
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        0.6,
        delta * 10,
      );
    }

    // 6. Store update
    setVelocity([direction.x, currentVel.y, direction.z]);
  });

  return (
    <>
      <PointerLockControls />
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

        {/* REFACTOR CLAVE: La cámara es hija fáctica de la Cápsula. Soporta el HUD internamente */}
        <PerspectiveCamera
          makeDefault
          ref={cameraRef}
          position={[0, 0.6, 0]}
          fov={75}
        >
          {/* Los elementos HUD tridimensionales */}
          <PlayerHands />
        </PerspectiveCamera>
      </RigidBody>
    </>
  );
}
