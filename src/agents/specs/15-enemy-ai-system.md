# Spec 15: Motor de IA Enemiga - "El Oportunista"

## 1. Refactor de Salud del Jugador (`usePlayerStore.ts`)

Con la introducción de enemigos hostiles, el jugador debe ser vulnerable y responder a un ciclo de vida propio de combate.

**Nuevas Adiciones al Store Global:**

- Instanciação de una variable pasiva: `hp: 100`.
- Creación de la acción `receiveDamage(amount: number)`.
  - Esta acción restará el daño recibido al `hp`. Si baja de cero, debe clamp-ear a 0.
  - Esto activará una re-renderización pura de UI (ej: si dibujamos una barra de vida más adelante) pero la lógica central permanecerá aislada en su propia dimensión.

## 2. Componente `Enemy.tsx` (Actor Hostil)

Reemplazaremos la docilidad del "Test Dummy" por una inteligencia procedural que navegue el escenario.

**Aproximación Cinemática:**

- Utilizaremos `<RigidBody type="kinematicPosition">` junto a colisionadores predeterminados (como cápsulas).
- Ser cinemático asegura completa inmunidad a fuerzas extremas, impidiendo que el jugador "salte" encima de ellos, o les empuje fuera del nivel accidentalmente con impulsos.

**Greyboxing Visual:**

- Se conformará temporalmente por una `capsuleGeometry` genérica teñida de rojo oscuro o carmesí saturado (`color="#8b0000"`) que facilitará su distinción respecto a los Test Dummys.

**El Puente Bi-direccional (Conector de Hitscan):**

- Del TestDummy conservaremos celosamente el contrato físico pasivo:
  ```tsx
  userData={{
    type: 'enemy',
    receiveDamage: (amount) => { ... }
  }}
  ```
- Al poseer esta metadata, el `PlayerHands.tsx` existente seguirá reconociéndolo e impactándolo normalmente, vaciando su `hp` local hasta desaparecer de la Matrix (`return null;`).

## 3. Lógica Computacional y Combate (Zero Re-renders)

Toda su mente iterará dentro de un `useFrame` utilizando memoria referencial para preservar las tasas estables de fotogramas del jugador. Tendremos dos estados de conmutación.

**El Agro y Acercamiento Interpolado:**

- Al igual que la mascota, interceptaremos cíclicamente la proyección abstracta del jugador (`camera.getWorldPosition`) aplastando sus diferenciales verticales (eje `Y` a nulo).
- Se trazará la distancia XZ absoluta entre el enemigo y su víctima.
- Si la distancia es **mayor a 1.5 pero menor a 10.0 metros**, el Oportunista ha detectado a la presa y ejecutará un `lerp` frontal, acortando su hipotenusa para perseguirlo implacablemente por cualquier terreno libre del cuarto.

**El Rango de Muerte (Melee Combat):**

- Si la distancia perfora el umbral íntimo y aterriza en `<= 1.5 metros`, el enemigo apaga su matriz de seguimiento y ancla su posición (frenado).
- **El Cooldown Temporizador:**
  - Se configurará mediante persistencia transitoria un ref dinámico, e.j., `attackCooldown = useRef(0)`.
  - Si el actor se halla en este rango íntimo y `attackCooldown.current <= 0`:
    - Dispara un `usePlayerStore.getState().receiveDamage(10)`. (10 puntos de impacto base para Oportunistas).
    - Inyecta `attackCooldown.current = 1.5`.
  - Si el cooldown es `> 0`, el loop actual sencillamente lo va restando respecto del delta temporal del framerate (`attackCooldown.current -= delta`), protegiendo la salud del jugador de aniquilación instantánea a 60 FPS.
