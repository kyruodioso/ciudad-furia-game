# Spec 01: First-Person Movement

## 1. Objetivo Principal

Implementar un sistema de controlador en primera persona minimalista que otorgue libertad de explorar el mapa local, integrando un loop de movimiento suave con WASD en coordenadas del plano 3D (X e Z) y el seguimiento de rotación del ratón (First-Person view). Visualmente, deben empezar a renderizarse unas manos atadas a la cámara del jugador.

## 2. Arquitectura de Estado Transient (Zustand)

Para mantener 60/120 FPS sin sofocar el árbol de React subyacente con re-renderizaciones continuas en pulsaciones de teclado, gestionaremos el movimiento central con Zustand _sin hooks reactivos_.

**Store Propuesto**: `src/store/usePlayerControlsStore.ts`

- **Keys**: Manejará booleanos mutados para el vector de direcciones basándose en WASD. (W: `forward`, S: `backward`, A: `left`, D: `right`).
- **Uso Transitorio**: Los componentes R3F usarán este estado internamente leyendo `usePlayerControlsStore.getState()` únicamente en el `useFrame`.

## 3. Detección de Teclado (Drei KeyboardControls)

En lugar de listeners en `window`, utilizaremos el envoltorio `<KeyboardControls>` y su hook `useKeyboardControls` de `@react-three/drei`. Este nos provee un mapa estándar en R3F y lo leeremos directamente en nuestro loop apoyándonos en el store si es necesario.

## 4. Componente Central: Player.tsx

**Estructura Proyectada**: `src/components/player/Player.tsx`

- Este es el envoltorio base. Tendrá una referencia fuerte dentro del Canvas.
- Utilizaremos el helper `PointerLockControls` suministrado por `@react-three/drei` (o similar de three-stdlib) para bloquear el mouse a la pantalla de la ventana del navegador emulando la clásica vista de un FPS.
- Instancia y agrupa el controlador y ancla el modelo `HandsModel.tsx`.

## 5. El Game Loop (Físicas 101)

Dentro de la estructura de `Player.tsx` utilizaremos `useFrame` expuesto por React Three Fiber.

```tsx
// Ejemplo pseudocódigo de lo planeado
useFrame((state, delta) => {
  const [, get] = useKeyboardControls();
  const { forward, backward, left, right } = get();

  // 1. Calcular el vector velocidad basado en las teclas presionadas
  // 2. Normalizar el vector para evitar movimiento diagonal excesivamente rápido.
  // 3. TODO: La traslación directa de coordenadas será reemplazada por un RigidBody (Motor de físicas Rapier) en el próximo hito para habilitar colisiones con paredes.
  // 4. Trasladar sumando posiciones (x, z). Multiplicar por delta-time.
  // 5. Aplicar "View Bobbing" (movimiento sinusoidal) a la cámara/manos cuando el vector de movimiento sea mayor a 0 para mejor el Game Feel.
});
```

## 6. Pruebas y Criterios de Aceptación

- **Rendimiento**: Ejecutar el Profiler de React verificando que al presionar o mover la cámara frenéticamente no existen re-renders en los padres del DOM (ni el Player wrapper reactivo).
- **Usabilidad**: El bloqueo del puntero funciona correctamente para Chrome/Firefox/Edge.
- **Sensación**: Existencia de "Smoothing" / Delta multiplier que prevenga que se sienta brusco el movimiento en diferentes monitores y frame-rates cap.
