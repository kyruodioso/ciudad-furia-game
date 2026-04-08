import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  RigidBody,
  RapierRigidBody,
  CapsuleCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAudioStore } from "@/store/useAudioStore";

// Devuelve el color de la barra según la salud restante
const hpColor = (hp: number): string => {
  if (hp >= 60) return "#22c55e"; // Verde — robusto
  if (hp >= 30) return "#f97316"; // Naranja — alerta
  return "#ef4444"; // Rojo — crítico
};

export function Enemy({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [hp, setHp] = useState(100);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  // Ref para el nodo de audio 3D posicional (instanciado programáticamente)
  const positionalSoundRef = useRef<THREE.PositionalAudio | null>(null);
  const audioStarted = useRef(false);
  const groupRef = useRef<THREE.Group>(null);

  const hitFlash = useRef(0);
  const attackCooldown = useRef(0);

  const { camera } = useThree();

  const { currentPos, targetPos, lookQuaternion } = useMemo(() => {
    return {
      currentPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      lookQuaternion: new THREE.Quaternion(),
    };
  }, []);

  // Crear el audio 3D posicional manualmente — no usamos <PositionalAudio> de Drei
  // porque crashea el Canvas cuando el archivo no es decodificable. Aquí lo envolvemos
  // en un try/catch para que sea resiliente a archivos placeholder o inexistentes.
  useEffect(() => {
    // Esperar a que el audio esté desbloqueado (gesto del usuario)
    const unsubscribe = useAudioStore.subscribe(
      (state) => state.isAudioUnlocked,
      (unlocked) => {
        if (!unlocked || audioStarted.current) return;
        if (!groupRef.current) return;

        const { audioContext } = useAudioStore.getState();
        if (!audioContext) return;

        try {
          // Crear el listener en la cámara (si no existe ya)
          let listener = camera.children.find(
            (c) => c instanceof THREE.AudioListener,
          ) as THREE.AudioListener | undefined;
          if (!listener) {
            listener = new THREE.AudioListener();
            camera.add(listener);
          }

          // Crear el nodo de audio posicional y adjuntarlo al group del enemigo
          const sound = new THREE.PositionalAudio(listener);
          sound.setLoop(true);
          sound.setVolume(1.0);

          // Parámetros de atenuación según Spec 18
          sound.setDistanceModel("inverse");
          sound.setRefDistance(3);
          sound.setMaxDistance(18);
          sound.setRolloffFactor(1.5);
          (sound.panner as PannerNode).panningModel = "HRTF";

          // Cargar el buffer de audio — si falla, el juego continúa sin audio
          const loader = new THREE.AudioLoader();
          loader.load(
            "/audio/enemy_growl_loop.mp3",
            (buffer) => {
              sound.setBuffer(buffer);
              if (!sound.isPlaying) sound.play();
              groupRef.current?.add(sound);
              positionalSoundRef.current = sound;
              audioStarted.current = true;
            },
            undefined,
            (err) => {
              console.warn(
                "[Enemy] Audio 3D no pudo cargarse (non-fatal):",
                err,
              );
            },
          );
        } catch (err) {
          console.warn("[Enemy] Error al inicializar audio posicional:", err);
        }
      },
    );

    return () => {
      unsubscribe();
      // Cleanup al destruir el componente
      if (positionalSoundRef.current?.isPlaying) {
        positionalSoundRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Anchor point para THREE.PositionalAudio adjuntado programáticamente */}
      <group ref={groupRef} />

      {/*
        Barra de vida flotante.
        Solo visible tras recibir daño (hp < 100) para preservar la inmersión
        y evitar overhead de DOM en enemigos intactos.
      */}
      {hp < 100 && (
        <Html
          position={[0, 2.2, 0]}
          center
          sprite
          transform
          zIndexRange={[10, 0]}
        >
          {/* Contenedor oscuro */}
          <div
            style={{
              width: "80px",
              height: "10px",
              background: "rgba(0,0,0,0.75)",
              borderRadius: "5px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 0 6px rgba(0,0,0,0.5)",
            }}
          >
            {/* Barra interior — anchura proporcional al HP */}
            <div
              style={{
                width: `${Math.max(0, hp)}%`,
                height: "100%",
                background: hpColor(hp),
                borderRadius: "5px",
                transition: "width 0.15s ease, background 0.3s ease",
                boxShadow: `0 0 4px ${hpColor(hp)}88`,
              }}
            />
          </div>
        </Html>
      )}
    </RigidBody>
  );
}
