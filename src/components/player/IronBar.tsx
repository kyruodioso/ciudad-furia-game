import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerStore } from "@/store/usePlayerStore";

export function IronBar() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const activeWeapon = usePlayerStore.getState().activeWeapon;
    if (activeWeapon !== "iron_bar") return;

    // Aquí podríamos leer el estado isPunching desde algún store, pero un listener local
    // en window o document es usado en PlayerHands para evitar re renders.
    // Aunque PlayerHands ya maneja un punchProgress para los puños, la barra de metal necesita el suyo
    // o rotar junto con la mano.

    // Si queremos usar la rotación de la mano de PlayerHands, podríamos simplemente
    // empardar este modelo encima y dejar que la mano rightHandRef sea el pivote.
    // Así es el diseño de react-three-fiber en PlayerHands.
  });

  return (
    <group position={[0, -0.35, 0]}>
      {/* 
        La mano padre tiene rotation en X de Math.PI/2.
        -  El eje Y local apunta hacia ADENTRO de la pantalla (negativo es más al fondo).
           Colocamos el grupo en Y = -0.35 para estar en la punta del brazo.
        -  El eje Z local apunta hacia ABAJO (negativo es hacia ARRIBA mundial).
        Rotamos la barra -PI/2 en X para que su longitud apunte hacia ARRIBA.
        La desplazamos -0.4 en Z local para que casi toda la barra suba por encima del puño.
      */}
      <mesh
        ref={meshRef}
        position={[0, 0, -0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  );
}
