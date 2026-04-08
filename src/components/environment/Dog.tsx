import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  CapsuleCollider,
} from "@react-three/rapier";
import * as THREE from "three";

export function Dog({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshGroupRef = useRef<THREE.Group>(null);

  // Optimizando las asignaciones mediante useMemo local para no saturar
  // Garbage Collection con instanciaciones vectoriales repetitivas en cada frame.
  const { currentPos, targetPos, nextPos, lookQuaternion } = useMemo(() => {
    return {
      currentPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      nextPos: new THREE.Vector3(),
      lookQuaternion: new THREE.Quaternion(),
    };
  }, []);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !meshGroupRef.current) return;

    // 1. Obtener la posición MUNDIAL proyectada del jugador (state.camera.position es relativa a su parent)
    state.camera.getWorldPosition(targetPos);
    targetPos.y = 0;

    // 2. Extraer desde el motor físico la pos del Perro
    const rbPos = rigidBodyRef.current.translation();
    currentPos.set(rbPos.x, rbPos.y, rbPos.z);

    const distanceXZ = new THREE.Vector2(currentPos.x, currentPos.z).distanceTo(
      new THREE.Vector2(targetPos.x, targetPos.z),
    );

    // 3. Rotación Computada (Trigonometría LookAt - Eje Y)
    // Usamos atan2 sobre el delta de posiciones.
    const angle = Math.atan2(
      targetPos.x - currentPos.x,
      targetPos.z - currentPos.z,
    );
    lookQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    // Suavizamos el snap de la malla asimilandola al nuevo ángulo deseado.
    meshGroupRef.current.quaternion.slerp(lookQuaternion, 10 * delta);
    rigidBodyRef.current.setNextKinematicRotation(
      meshGroupRef.current.quaternion,
    );

    // 4. Mecánica de Histéresis: Seguir fluido vs Paro Seco
    const ud = meshGroupRef.current.userData;

    if (
      distanceXZ > 3.0 ||
      (distanceXZ > 2.5 && distanceXZ <= 3.0 && ud.isMoving)
    ) {
      ud.isMoving = true;

      // Setup para Lerp Horizontal conservando gravedad/colisión en Y precalculada de RB
      nextPos.set(currentPos.x, currentPos.y, currentPos.z);

      const interpolationSpeed = 2.5 * delta;
      nextPos.x = THREE.MathUtils.lerp(
        currentPos.x,
        targetPos.x,
        interpolationSpeed,
      );
      nextPos.z = THREE.MathUtils.lerp(
        currentPos.z,
        targetPos.z,
        interpolationSpeed,
      );

      rigidBodyRef.current.setNextKinematicTranslation(nextPos);

      // Animación Trotes (Bobbing algorithm en posición local)
      const time = state.clock.elapsedTime;
      meshGroupRef.current.position.y = Math.abs(Math.sin(time * 12)) * 0.15;
    } else if (distanceXZ <= 2.5) {
      ud.isMoving = false;
      // Recuperación natural de altura base del Group cuando se detiene
      meshGroupRef.current.position.y = THREE.MathUtils.lerp(
        meshGroupRef.current.position.y,
        0,
        12 * delta,
      );
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={position}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.3, 0.4]} position={[0, 0.4, 0]} />
      {/* Malla del Golden orientada localmente */}
      <group ref={meshGroupRef}>
        {/* Cuerpo del perro elongado */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.8]} />
          <meshStandardMaterial
            color="#daa520"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Cabeza un poco alzada y adelantada */}
        <mesh position={[0, 0.8, 0.4]}>
          <boxGeometry args={[0.3, 0.35, 0.35]} />
          <meshStandardMaterial
            color="#b8860b"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Nariz negra */}
        <mesh position={[0, 0.8, 0.6]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>

        {/* Colita */}
        <mesh position={[0, 0.6, -0.4]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <meshStandardMaterial color="#daa520" roughness={0.9} />
        </mesh>
      </group>
    </RigidBody>
  );
}
