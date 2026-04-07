# Spec 05: Manos en Primera Persona y Sistema de Interacción Base

## 1. Diseño Estructural

Sustituiremos la técnica actual de copiar posiciones crudas de un componente flotante (`HandsModel`) a favor de una arquitectura verdadera de **HUD 3D inmersivo**.
Se creará un único módulo en `src/components/player/PlayerHands.tsx`.

## 2. Jerarquía de Cámara Inyectada

Para forzar que los brazos permanezcan siempre atados a la vista frontal sin sufrir retrasos (lag) de un frame, **inyectaremos la cámara explícitamente en el DOM de R3F**.
En `Player.tsx`, la `<PerspectiveCamera>` (importada desde `@react-three/drei` si es necesario, o usando el primitivo) se anidará directamente dentro del `<RigidBody>`.
A su vez, `<PlayerHands />` será incrustado como hijo de esa cámara. Al estar enganchados en la misma jerarquía matricial, los brazos girarán e interceptarán la profundidad (`Z`) al unísono de la visión del usuario.

## 3. Geometría Placeholder y Materialidad Lumínica

Mientras llega el `.glb` definitivo, las extremidades se esbozarán con primitivos R3F alargados (`<Box>` o `<Cylinder>`) ubicados asimétricamente en el campo de visión inferior de la cámara (por ejemplo, `position={[0.3, -0.2, -0.6]}` para el brazo derecho).

- **Surface Reaction**: Se empleará `<meshStandardMaterial>` con rugosidad intermedia (`roughness={0.5}`). Esto garantizará que, al caminar frente a las luces neón cyan o magenta de la `SciFiRoom`, los modelos de los brazos reboten el color exacto aportando integración ambiental de forma automática.

## 4. Game Feel: Animación Procedural Sincrona

El rendimiento exige delegar las mecánicas visuales a transformaciones de matrices puras bajo el loop principal (sin `useState` que genere re-renders).

1. **Idle Bobbing (Respiración)**: En el `useFrame` de `PlayerHands`, se calcularán offsets matemáticos extrayendo el `clock.elapsedTime` hacia la función seno (`Math.sin()`). Esto añadirá un vaivén suave en los ejes X e Y de los brazos, simulando el ritmo de respiración de la cápsula física.
2. **Impulso Transitorio (El Golpe / Ataque)**:
   - Se interceptará el evento nativo en ventana del clic izquierdo (`onPointerDown`).
   - Al detonarse, se activará un trigger aritmético puro alojado en una referencia mutable (`useRef(false)` o `useRef(isPunching)`).
   - El bucle `useFrame` detectará este trigger y propulsará abruptamente el vector de traslación del brazo derecho hacia un número positivo en Z (extensión).
   - Tras soltar o durante los milisegundos consecuentes, la función **`THREE.MathUtils.lerp()`** suavizará matemáticamente el vector desde la extensión máxima hacia la postura de descanso (`0`), produciendo la interpolación orgánica del rechazo (retracting punch).
