import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { HandsModel } from "./HandsModel";

const SPEED = 5;
const BOB_FREQUENCY = 10;
const BOB_AMPLITUDE = 0.05;

export function Player() {
  const [, get] = useKeyboardControls();
  const { camera } = useThree();
  const handsGroupRef = useRef<THREE.Group>(null);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();

  const viewBobTime = useRef(0);

  useFrame((state, delta) => {
    const { forward, backward, left, right } = get();

    // 1 & 2. Calcular vector velocidad y normalizar para evitar movimiento diagonal rápido
    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * delta);

    // 3. TODO: La traslación directa de coordenadas será reemplazada por un RigidBody (Rapier)
    // en el próximo hito para habilitar colisiones.
    camera.translateX(direction.x);
    camera.translateZ(direction.z);

    // 5. Aplicar "View Bobbing" para Game Feel:
    const movementMagnitude = Math.abs(direction.x) + Math.abs(direction.z);

    if (movementMagnitude > 0) {
      viewBobTime.current += delta * 15;
      camera.position.y +=
        Math.sin(viewBobTime.current * (BOB_FREQUENCY / 15)) *
        BOB_AMPLITUDE *
        delta *
        15;
    } else {
      // Regresión suave a 0
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        0,
        delta * 10,
      );
      viewBobTime.current = 0;
    }

    // Sync hands visual object to camera
    if (handsGroupRef.current) {
      handsGroupRef.current.position.copy(camera.position);
      handsGroupRef.current.rotation.copy(camera.rotation);
    }
  });

  return (
    <>
      <PointerLockControls />
      <group ref={handsGroupRef}>
        <HandsModel />
      </group>
    </>
  );
}
