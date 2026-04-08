import { useRef, useCallback, useMemo } from "react";
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
import { useAudioStore } from "@/store/useAudioStore";

const SPEED = 5;
// ─── Headbob ────────────────────────────────────────────────────────────────
const BOB_FREQUENCY = 10; // rad/s (pasos verticales)
const BOB_AMP_Y = 0.05; // unidades, oscilación en Y
const BOB_AMP_X = 0.025; // unidades, oscilación en X (mitad de freq → figura-8)
const BOB_LERP_SPEED = 8; // velocidad de retorno al neutral
const BASE_CAM_Y = 0.6; // posición local Y neutra de la cámara

export function Player() {
  const [, get] = useKeyboardControls();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { setVelocity } = usePlayerStore();

  const direction = new THREE.Vector3();
  const bobTime = useRef(0); // Acumulador de fase del bob

  // Desbloquear el motor de audio en el primer click que activa el PointerLock.
  // Este es el gesto de usuario más natural y cumple con la Autoplay Policy del navegador.
  const handlePointerLock = useCallback(() => {
    useAudioStore.getState().unlockAudio();
  }, []);

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

    // 5. Game Feel: Headbobbing (figura-8 — sin en Y, cos a mitad de freq en X)
    const movementMagnitude = Math.sqrt(direction.x ** 2 + direction.z ** 2);

    if (movementMagnitude > 0.1) {
      bobTime.current += delta * BOB_FREQUENCY;
    }
    // Factor de atenuación: sin movimiento el bob decae suavemente a 0
    const bobScale = Math.min(movementMagnitude / SPEED, 1);

    const targetCamY =
      BASE_CAM_Y + Math.sin(bobTime.current) * BOB_AMP_Y * bobScale;
    const targetCamX = Math.cos(bobTime.current * 0.5) * BOB_AMP_X * bobScale;

    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetCamY,
      delta * BOB_LERP_SPEED,
    );
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      targetCamX,
      delta * BOB_LERP_SPEED,
    );

    // 6. Store update
    setVelocity([direction.x, currentVel.y, direction.z]);
  });

  const listener = useMemo(() => new THREE.AudioListener(), []);

  return (
    <>
      <PointerLockControls
        makeDefault
        selector="#game-container"
        onLock={handlePointerLock}
      />
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
        userData={{ type: "player" }}
      >
        <CapsuleCollider args={[0.5, 0.3]} friction={0} restitution={0} />

        {/* REFACTOR CLAVE: La cámara es hija fáctica de la Cápsula. Soporta el HUD internamente */}
        <PerspectiveCamera
          makeDefault
          ref={cameraRef}
          position={[0, 0.6, 0]}
          fov={75}
        >
          {/* El AudioListener DEBE estar en la cámara para que el audio 3D funcione */}
          <primitive object={listener} />
          {/* Los elementos HUD tridimensionales */}
          <PlayerHands />
        </PerspectiveCamera>
      </RigidBody>
    </>
  );
}
