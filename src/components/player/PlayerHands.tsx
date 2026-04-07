import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerStore } from "@/store/usePlayerStore";
import { BlasterModel } from "./BlasterModel";

export function PlayerHands() {
  const { camera } = useThree();
  const { rapier, world } = useRapier();
  const { hasWeapon, equipWeapon } = usePlayerStore();
  const rightHandRef = useRef<THREE.Mesh>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);

  const isPunching = useRef(false);
  const punchProgress = useRef(0);

  const fireProgress = useRef(0);
  const weaponMeshRef = useRef<THREE.Group>(null);
  const muzzleFlashRef = useRef<THREE.PointLight>(null);
  const muzzleMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Evitar que dispare/golpee superpuesto rápido
      if (e.button !== 0 || isPunching.current || fireProgress.current > 0.5)
        return;

      if (hasWeapon) {
        fireProgress.current = 1;
      } else {
        isPunching.current = true;
        punchProgress.current = 1; // 1 = Máxima extensión instantánea
      }

      // --- HITSCAN RAYCAST LOGIC ---
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.normalize();

      // Origen de colisión adelantado (0.5 metros) para saltarnos nuestra propia cápsula de Rapier
      const origin = new THREE.Vector3();
      camera.getWorldPosition(origin);
      origin.addScaledVector(direction, 0.5);

      // Generar el rayo inmaculado del motor físico
      const ray = new rapier.Ray(origin, direction);
      const MAX_DISTANCE = hasWeapon ? 100.0 : 2.0;

      // Dispararlo por nuestro mundo de colisionadores
      const hit = world.castRay(ray, MAX_DISTANCE, true);

      if (hit && hit.collider) {
        const rigidBody = hit.collider.parent();

        // --- 1. EVALUAR INTERACCIÓN (Loot) ---
        if (rigidBody && rigidBody.userData) {
          const ud = rigidBody.userData as any;
          if (ud.type === "pickup") {
            equipWeapon();
            if (ud.onPickup) ud.onPickup();
            return; // Abortar física, solo tomamos el arma
          }
        }

        // --- 2. IMPACTO CINETICO (Dummies/Enemies) ---
        // Protegemos el motor verificando que el body existe Y es Dinámico (Evita panicos de memory bounds)
        // isDynamic() está en las versiones estándar, o evaluamos bodyType() directo
        const isBodyDynamic =
          rigidBody && typeof rigidBody.isDynamic === "function"
            ? rigidBody.isDynamic()
            : rigidBody?.bodyType() === rapier.RigidBodyType.Dynamic;

        if (rigidBody && isBodyDynamic) {
          // Sanitizamos the toi
          const safeToi = (hit as any).toi ?? (hit as any).timeOfImpact ?? 0;

          if (!isNaN(safeToi)) {
            const hitPoint = origin.clone().addScaledVector(direction, safeToi);

            const forceMulti = hasWeapon ? 200 : 15;
            const impulseForce = direction.clone().multiplyScalar(forceMulti);
            impulseForce.y += hasWeapon ? 10 : 5;

            rigidBody.applyImpulseAtPoint(impulseForce, hitPoint, true);
          }
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [camera, rapier, world, equipWeapon, hasWeapon]);

  // Update a 60 FPS o más
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Idle Bobbing
    const idleY = Math.sin(time * 2) * 0.015;
    const idleX = Math.cos(time * 1.5) * 0.005;

    // Transición del Punch Matemático
    if (isPunching.current) {
      punchProgress.current = THREE.MathUtils.lerp(
        punchProgress.current,
        0,
        15 * delta,
      );
      if (punchProgress.current < 0.01) {
        isPunching.current = false;
        punchProgress.current = 0;
      }
    }

    // Transición del Fuego/Recoil Matemático
    if (fireProgress.current > 0) {
      fireProgress.current = THREE.MathUtils.lerp(
        fireProgress.current,
        0,
        15 * delta,
      );
      if (fireProgress.current < 0.01) {
        fireProgress.current = 0;
      }
    }

    if (leftHandRef.current) {
      leftHandRef.current.position.set(-0.3 + idleX, -0.3 + idleY, -0.5);
    }

    if (rightHandRef.current) {
      const baseX = 0.3 + idleX;
      const baseY = -0.3 + idleY;
      const baseZ = -0.5;

      const punchOffsetZ = -0.6 * punchProgress.current;
      const punchOffsetY = 0.1 * punchProgress.current;

      rightHandRef.current.position.set(
        baseX,
        baseY + punchOffsetY,
        baseZ + punchOffsetZ,
      );

      const rotZ = punchProgress.current * Math.PI * 0.1;
      rightHandRef.current.rotation.set(Math.PI / 2, 0, rotZ);
    }

    // Weapon Recoil Animation
    if (weaponMeshRef.current) {
      // Mueve el arma hacia atrás (local Y baja desde 0.4 a 0.25)
      weaponMeshRef.current.position.y = 0.4 - fireProgress.current * 0.15;

      // Muzzle Flash sync
      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.intensity = fireProgress.current * 300;
      }
      if (muzzleMeshRef.current && muzzleMeshRef.current.material) {
        (
          muzzleMeshRef.current.material as THREE.MeshStandardMaterial
        ).emissiveIntensity = fireProgress.current * 50;
      }
    }
  });

  return (
    <group>
      <mesh
        ref={leftHandRef}
        position={[-0.3, -0.3, -0.5]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#3d4045" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh
        ref={rightHandRef}
        position={[0.3, -0.3, -0.5]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#3d4045" metalness={0.7} roughness={0.3} />

        {/* --- MODELO GLTF ARTÍSTICO DEL ARMA (RENDER CONDICIONAL DEL INVENTARIO) --- */}
        {hasWeapon && (
          <group ref={weaponMeshRef} position={[0, 0.4, -0.05]}>
            {/* 
              OFFSET DE ALINEACIÓN DEL MODELO: 
              - X: Mueve Izquierda/Derecha
              - Y: Mueve Adelante/Atrás (Profundidad respecto al brazo)
              - Z: Mueve Arriba/Abajo 
            */}
            <BlasterModel
              position={[-0.15, -0.1, -0.2]}
              rotation={[-Math.PI / 2, Math.PI / 2, 0]}
              scale={[0.01, 0.01, 0.01]}
            />

            {/* VFx: Muzzle Flash dinámico anclado en la punta */}
            <pointLight
              ref={muzzleFlashRef}
              position={[0, 0.5, 0]}
              color="#ffffaa"
              intensity={0}
              distance={15}
            />
            <mesh
              ref={muzzleMeshRef}
              position={[0, 0.45, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[
                fireProgress.current * 0.2 + 0.01,
                fireProgress.current * 0.2 + 0.01,
                1,
              ]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial
                color="#aaffff"
                emissive="#88ffff"
                emissiveIntensity={0}
                toneMapped={false}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}
      </mesh>
    </group>
  );
}
