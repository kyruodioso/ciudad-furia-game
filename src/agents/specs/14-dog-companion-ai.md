# Spec 14: Dog Companion AI (Golden Retriever)

## 1. Componente `Dog.tsx`

Se desarrollará una entidad acompañante autónoma basada en comportamiento procedimental continuo, sin emplear un motor complejo de NavMesh para el MVP.

**Físicas (Rapier):**

- Utilizaremos un componente `<RigidBody type="kinematicPosition">` junto con un collider estandarizado predeterminado.
- **Cinemático:** El control total de su posición debe ser computacional (`setNextKinematicTranslation`). Un cuerpo cinemático es inmune a las interacciones erráticas de la física pura (como escombros o tropezar con el cuerpo dinámico del jugador), garantizando que el perro fluya suevo por el nivel de ser necesario.

**Visual (Greyboxing):**

- Al no contar aún con el `.glb` final, lo ensamblaremos construyendo mallas doradas primitivas (`color="#daa520"` - golden rod):
  - El tronco/cuerpo: `<boxGeometry args={[0.4, 0.4, 0.8]}>`.
  - La cabeza: `<boxGeometry args={[0.3, 0.3, 0.3]}>` montada en `[0, 0.35, -0.4]`.

## 2. Lógica de Seguimiento "Zero Re-renders"

La IA de este Golden estará encapsulada y gobernada por su propio loop reactivo `useFrame`, blindando al resto del entorno de redibujados drásticos y saturación del main thread.

**Adquisición del Objetivo y Distancia:**

- Aprovechando el acceso directo a ref estático o del global scope vía Drei/Fiber, la mente del perro interrogará las coordenadas (en vez de despacharlas a un Store):
- Obtener desde la cámara (`state.camera`) o de una referencia estática (Zustand si ya se extrae el vector mutado temporalmente) la posición `(X, Z)` del jugador. La altura `Y` debe inhabilitarse para evitar intentos de vuelo durante el seguimiento.
- Con `dogPosXZ.distanceTo(playerPosXZ)`, se obtendrá la longitud vectorial continua.

**El Patrón "Correa Invisible" (Lerp):**

- **Follow Mode (Distancia > 3.0 m):**
  Si el perro asume este retraso, interpolará su estado posicional mutando una referencia local (`lerpVectors` de Threejs) entre su origen y el vector meta, multiplicando la progresión por una variable `speed * delta`, con el fin de avanzar fluidamente hacia el master.
- **Stop Mode (Distancia <= 2.5 m):**
  La interpolación se paraliza para que respete el blindspot íntimo del jugador, impidiendo que tropiecen con la cámara en FPS.

**Control Rotacional Matemático:**

- A la par que avanza, el cuerpo calculará el ángulo de enfrentamiento relativo usando la trigonometría pura y clásica para anclarse visualmente al jugador:
  ```ts
  const theta = Math.atan2(playerPos.x - dogPos.x, playerPos.z - dogPos.z);
  ```
- La transformación se volcará al estado temporal mutando dinámicamente un cuaternión o aplicándolo de forma directa como rotación euleriana pura inyectada al rigidBody / mesh de forma asíncrona a React. Aportará una inmensa noción instintiva de compañía constante observando los movimientos del Player.
