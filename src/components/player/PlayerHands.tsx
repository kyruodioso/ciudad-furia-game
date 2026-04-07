import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function PlayerHands() {
  const rightHandRef = useRef<THREE.Mesh>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);

  // Variables mutables sin estado (no re-renders)
  const isPunching = useRef(false);
  const punchProgress = useRef(0);

  // Escuchar el click en todo el viewport para iniciar el golpe
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Si dio clic primario y no está ya golpeando
      if (e.button === 0 && !isPunching.current) {
        isPunching.current = true;
        punchProgress.current = 1; // 1 = Máxima extensión instantánea
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Update a 60 FPS o más
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // 1. Idle Bobbing (Leve movimiento sinusoidal de respiración)
    const idleY = Math.sin(time * 2) * 0.015;
    const idleX = Math.cos(time * 1.5) * 0.005;

    // 2. Transición del Punch
    if (isPunching.current) {
      // El punch recupera a posición de reposo orgánicamente con Lerp
      punchProgress.current = THREE.MathUtils.lerp(
        punchProgress.current,
        0,
        15 * delta,
      );
      // Cancelar animación cuando casi regresa a su estado base
      if (punchProgress.current < 0.01) {
        isPunching.current = false;
        punchProgress.current = 0;
      }
    }

    // --- Aplicación al DOM de la Izquierda (Solo agarre estático + respiracion) ---
    if (leftHandRef.current) {
      // Posición Base del brazo izquierdo: [-0.3, -0.3, -0.5]
      leftHandRef.current.position.set(-0.3 + idleX, -0.3 + idleY, -0.5);
    }

    // --- Aplicación al DOM de la Derecha (Respiración + Animación de Ataque) ---
    if (rightHandRef.current) {
      const baseX = 0.3 + idleX;
      const baseY = -0.3 + idleY;
      const baseZ = -0.5;

      // El puñetazo avanza agresivamente hacia Z negativa (adelante de la pantalla)
      // Y se levanta un poco hacia arriba en Y.
      const punchOffsetZ = -0.6 * punchProgress.current;
      const punchOffsetY = 0.1 * punchProgress.current;

      rightHandRef.current.position.set(
        baseX,
        baseY + punchOffsetY,
        baseZ + punchOffsetZ,
      );

      // Añadimos una leve rotación hacia el medio para simular el "gancho" central
      const rotZ = punchProgress.current * Math.PI * 0.1;
      rightHandRef.current.rotation.set(Math.PI / 2, 0, rotZ);
    }
  });

  return (
    <group>
      {/* Brazo Izquierdo (Placeholder) */}
      <mesh
        ref={leftHandRef}
        position={[-0.3, -0.3, -0.5]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#3d4045" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Brazo Derecho / Brazo Defensor (Placeholder) */}
      <mesh
        ref={rightHandRef}
        position={[0.3, -0.3, -0.5]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#3d4045" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}
