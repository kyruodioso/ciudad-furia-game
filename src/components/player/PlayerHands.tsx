import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerStore } from "@/store/usePlayerStore";
import { BlasterModel } from "./BlasterModel";
import { IronBar } from "./IronBar";

export function PlayerHands() {
  const { camera } = useThree();
  const { rapier, world } = useRapier();
  const { activeWeapon } = usePlayerStore();
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
      const currentWeapon = usePlayerStore.getState().activeWeapon;

      // Evitar que dispare/golpee superpuesto rápido
      if (e.button !== 0 || isPunching.current || fireProgress.current > 0.5)
        return;

      if (currentWeapon === "blaster") {
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
      let currentRay = new rapier.Ray(origin, direction);
      const MAX_DISTANCE = currentWeapon === "blaster" ? 100.0 : 2.0;
      let currentDistance = MAX_DISTANCE;

      // Dispararlo por nuestro mundo de colisionadores
      let hit = world.castRay(currentRay, currentDistance, true);

      // --- PIERCING MECHANIC ---
      // Traspasamos entidades fantasmas (como Narrative Triggers) para no bloquear impactos reales
      while (hit && hit.collider) {
        const parentRb = hit.collider.parent() as any;
        const colAny = hit.collider as any;
        const ud = parentRb?.userData ?? colAny?.userData;

        if (ud && ud.type === "trigger") {
          const safeToi = (hit as any).toi ?? (hit as any).timeOfImpact ?? 0;
          currentDistance -= safeToi + 0.05; // Adelantamos el origen para saltar la pared del trigger

          if (currentDistance <= 0) {
            hit = null;
            break;
          }
          const rOrigin = new THREE.Vector3(
            currentRay.origin.x,
            currentRay.origin.y,
            currentRay.origin.z,
          );
          const rDir = new THREE.Vector3(
            currentRay.dir.x,
            currentRay.dir.y,
            currentRay.dir.z,
          );
          const newOrigin = rOrigin.addScaledVector(rDir, safeToi + 0.05);

          currentRay = new rapier.Ray(newOrigin, direction);
          hit = world.castRay(currentRay, currentDistance, true);
        } else {
          break; // Impactamos en algo relevante (caja, dummy, piso, loot)
        }
      }

      if (hit && hit.collider) {
        const rigidBody = hit.collider.parent();

        // --- 1. EVALUAR INTERACCIÓN (Loot) ---
        if (rigidBody && rigidBody.userData) {
          const ud = rigidBody.userData as any;
          if (ud.type === "pickup") {
            usePlayerStore.getState().pickupWeapon(ud.item || "blaster");
            if (ud.onPickup) ud.onPickup();
            return; // Abortar física, solo tomamos el arma
          }
        }

        // --- 2. IMPACTO CINETICO Y LÓGICA DE DAÑO (Dummies/Enemies/PhysicsBox) ---
        // Verificación estructural universal
        const isBodyDynamic =
          rigidBody && typeof rigidBody.isDynamic === "function"
            ? rigidBody.isDynamic()
            : rigidBody?.bodyType() === rapier.RigidBodyType.Dynamic;

        if (rigidBody) {
          const ud = rigidBody.userData as any;

          if (
            ud &&
            ud.type === "enemy" &&
            typeof ud.receiveDamage === "function"
          ) {
            const damage = currentWeapon === "blaster" ? 25 : 40;
            ud.receiveDamage(damage);
          }

          if (isBodyDynamic) {
            // Sanitizamos el toi para uso en point impulsing
            const safeToi = (hit as any).toi ?? (hit as any).timeOfImpact ?? 0;

            if (!isNaN(safeToi)) {
              const hitPoint = origin
                .clone()
                .addScaledVector(direction, safeToi);

              const forceMulti = currentWeapon === "blaster" ? 200 : 15;
              const impulseForce = direction.clone().multiplyScalar(forceMulti);
              impulseForce.y += currentWeapon === "blaster" ? 10 : 5;

              rigidBody.applyImpulseAtPoint(impulseForce, hitPoint, true);
            }
          }
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [camera, rapier, world]);

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

  if (activeWeapon === "none") {
    return null;
  }

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

        {/* --- MODELO DEL ARMA (RENDER CONDICIONAL DEL INVENTARIO) --- */}
        {activeWeapon === "iron_bar" && <IronBar />}
        {activeWeapon === "blaster" && (
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
