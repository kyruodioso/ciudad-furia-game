# Spec 04: Motor de Físicas y Colisiones (Rapier)

## 1. Objetivo Arquitectónico

Sustituir el traslado irrestricto de coordenadas manual (`noclip`) por una simulación kinemática y dinámica estructurada empleando `@react-three/rapier`. El avatar del jugador dejará de ser una "cámara etérea" para convertirse en una entidad física masiva sometida a la resistencia, inercia y delimitación de los muros del entorno.

## 2. Inyección del Ecosistema de Físicas

Dado que el stack no ha invocado cálculos de colisión aún, se requerirá añadir la dependencia de `@react-three/rapier`.

- **`src/app/page.tsx`**: Para inocular las leyes de la física a la sala, todo el núcleo del escenario tridimensional (tanto `<SciFiRoom />` como `<Player />`) quedará encapsulado bajo un context provider primario de nombre `<Physics>`. Las dependencias externas (HUD, Eventos de teclado) mantendrán su inmunidad fuera de este provider.

## 3. Entorno Restrictivo: Colisionadores Estáticos (SciFiRoom)

- En `src/components/environment/SciFiRoom.tsx`, toda la topografía que representa los límites físicos duros (Suelo, Techo, Muros Perimetrales) será envuelta en módulos de `<RigidBody type="fixed">`.
- Las mallas seguirán pintando el entorno en `DoubleSide` sin cambio aparente, pero el framework `Rapier` auto-proyectará colisionadores con exactitud volumétrica basándose en la primitiva de la geometría (`boxGeometry` y `planeGeometry`).

## 4. Evolución del Player a Entidad Dinámica

La refactorización masiva de `src/components/player/Player.tsx` se basa en 3 pilares estructurales:

1. **Volume Capsule**: Se inyectará la librería y se sustituirá el grupo principal por un `<RigidBody type="dynamic" colliders="capsule">`. La `<PerspectiveCamera>` que actúa como los de Primera Persona será anidada rígidamente dentro para trasladarse esclavizada al cuerpo principal.
2. **Tolerancia y Constraint (Ejes)**: En una colisión asimétrica, cualquier esfera o cubo físico rebotaría en todos sus ejes. Para mantener la ficción antropomórfica del First Person (mantener el equilibrio vertical infinito), se castigarán las inercias rotacionales utilizando el flag `enabledRotations={[false, true, false]}` para amarrar la entidad.
3. **Propulsión Linvel (`setLinvel`)**:
   - Quedan prohibidas las traslaciones directas de la coordenada a nivel Three.js (`camera.translateX`).
   - El bucle infinito `useFrame` seguirá calculando el vector normalizado direccional a partir de `useKeyboardControls()`, y multiplicará la velocidad base.
   - El resultado será arrojado y sobre-escrito en tiempo real al cuerpo sólido mediante el llamado de API del Motor: `api.setLinvel(direction, true)`.
