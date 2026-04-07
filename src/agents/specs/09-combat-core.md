# 09 - Combat Core (Hitscan, Recoil & VFX)

## 1. Visión General

Esta especificación detalla la implementación del sistema de combate base en "Ciudad Furia". Se enfoca en resolver la bifurcación lógica entre ataque cuerpo a cuerpo y disparo según el estado del inventario (`hasWeapon`), e incorporar Game Feel sin emplear assets `.glb`, manteniéndose estrictamente en la filosofía Greyboxing de primitivas matemáticas y físicas procedimentales.

## 2. Requerimientos Funcionales

### 2.1 Lógica de Disparo (Hitscan)

La lógica de interacción principal reside en el sistema de Raycast lanzado desde la cámara en el `PlayerHands.tsx` o módulo equivalente al hacer clic.

- **Bifurcación de Estado:** Se lee el estado global desde Zustand (`hasWeapon`).
- **Comportamiento si `hasWeapon === false`:**
  - Radio de acción corto (ej. 2 metros).
  - Aplicación de impulso leve sobre interacciones (`RigidBody`).
- **Comportamiento si `hasWeapon === true`:**
  - Se extiende el raycast a rango de fuego real (ej. 100 metros).
  - Se incrementa significativamente el multiplicador del impulso que se aplica al `RigidBody` impactado para simular daño o potencia balística.

### 2.2 Game Feel: Retroceso (Recoil) Procedimental

Para dotar de fisicidad al disparo, se utilizará una animación de retroceso sobre la malla geométrica del arma.

- **Mecánica:** En el momento del clic (disparo), un trigger (`useRef<boolean> o useRef<number>`) registra el tiempo de acción.
- **Implementación:** Dentro del loop `useFrame`, se utiliza interpolación matemática (`THREE.MathUtils.lerp`) para modificar la posición `z` (o la rotación) del cañón simulando el retroceso inicial rápido hacia el jugador, seguido de una recuperación elástica a su estado neutral.
- **Optimización:** Al resolver la interpolación directamente sobre un `ref` de Three.js en el bucle `useFrame`, se evita disparar re-renders en React.

### 2.3 VFX: Muzzle Flash y Emisión

Generación de un destello balístico visual en el "cañón" que solo dure una fracción de segundo (50-100 ms) post-disparo.

- **Implementación Lumínica:** Instanciación de una `<PointLight>` fija alineada en la punta del cañón o en las inmediaciones visuales que permanecerá con `intensity={0}` salvo cuando se acciona el trigger.
- **Implementación Material (Greyboxing):** Incorporar en la punta un pequeño grupo geométrico (ej. esfera o plano cruzado) que posea un `<meshStandardMaterial>` con color anaranjado-amarillo.
- **Transición:** Con `useFrame`, se manipula la `emissiveIntensity` y la `intensity` de la luz para que brillen de forma repentina solo luego del disparo, desvaneciéndose asintóticamente a 0 mediante lerp rápido. Al tener `toneMapped={false}`, el efecto Bloom ya instalado lo capturará naturalmente.

## 3. Limitaciones e Instrucciones a Nivel Arquitectura

- **Sin Modelos 3D:** Continúa el uso exclusivo de componentes `<boxGeometry>`, `<cylinderGeometry>` o similares agrupados estratégicamente.
- **Performance:** La actualización de las barras de progreso u offsets vectoriales se harán en referencias inmutables (`React.useRef` y mutación directa) sobre las propiedades `position`, `rotation` y uniformes de materiales de Three.js para sostener 60+ FPS ininterrumpidos frente a inputs agresivos.
- **Rapier Sync:** Todo impulso balístico se despacha al API de colisionadores llamando a `applyImpulseAtPoint` sobre los cuerpos rígidos impactados, considerando masa y distancia de caída.
