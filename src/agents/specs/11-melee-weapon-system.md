# Spec 11: Melee Weapon System & Weapon Refactor

## 1. Refactor del Estado (Zustand)

Actualmente, el jugador depende de `hasWeapon`. Vamos a reemplazar esto por un sistema robusto que permita gestionar varias armas de forma escalable.

**Modificaciones en `usePlayerStore`:**

- **Eliminar:** `hasWeapon: boolean`
- **Añadir:**
  - `inventory: string[]`: Array para almacenar los IDs de las armas recolectadas (ej. `['iron_bar', 'blaster']`).
  - `activeWeapon: 'none' | 'iron_bar' | 'blaster'`: Define el arma equipada actualmente.
- **Acciones:**
  - `equipWeapon(weaponId: 'none' | 'iron_bar' | 'blaster')`: Actualiza el arma activa.
  - `pickupWeapon(weaponId: string)`: Añade el arma al `inventory` local y ejecuta `equipWeapon` automáticamente.

## 2. Lógica de Hitscan Corto

El sistema de Hitscan de Rapier (`castRay`), ejecutado durante el disparo/ataque, deberá evaluar el rango máximo (`maxToi`) basándose en el arma actualmente equipada.

**Flujo en el controlador de ataque:**

- Al realizar el input de ataque, se consulta el valor de `usePlayerStore.getState().activeWeapon` para evitar suscribir el controlador estático a re-renderizados.
- **Evaluación dinámica del Rango:**
  - Si `activeWeapon === 'iron_bar'`, configurar `maxToi: 2` (impacto cuerpo a cuerpo).
  - Si `activeWeapon === 'blaster'`, configurar `maxToi: 100` (impacto de larga distancia).
- Al impactar (si se obtiene un hit) dentro del rango del `maxToi`, el sistema procesará la lógica de daño correspondiente al arma activa.

## 3. Animación Procedural de "Swing" (Zero Re-renders)

La animación del giro / ataque de la barra de hierro debe gestionarse matemáticamente usando `useFrame` sin actualizar estados de React para mantener un alto redimiento (Zero Re-renders).

**Lógica usando `lerp`:**

- Utilizar refs persistentes: un `useRef<Group>` para manipular la geometría del arma y refs para controlar variables temporales (`isSwinging = useRef(false)`, `swingProgress = useRef(0)`).
- Al clickear para atacar, setear `isSwinging.current = true`.
- Dentro del loop de `useFrame(state, delta)`:
  - Si `isSwinging.current` es verdadero, incrementar `swingProgress.current` según `delta * swingSpeed`.
  - **Fase de impacto (0 a 0.5):** Interpolar (`MathUtils.lerp`) la rotación sobre el eje designado (ej. de 0 a -Math.PI / 4 en rotación Y o X) para simular el desplazamiento lateral, junto con un ligero desplazamiento hacia adelante (ataque).
  - **Fase de recuperación (0.5 a 1.0):** Interpolar (`MathUtils.lerp`) devolviendo los valores a su posición/rotación default 0.
  - Cuando `swingProgress.current >= 1.0`, finalizar el estado de ataque (`isSwinging.current = false`) y asegurar la posición y rotación a su estado neutro por default.

## 4. Estructura de Componentes

Refactorizaremos el componente donde se portan las armas, para soportar un renderizado modular en base al arma activa.

**Crear `IronBar.tsx`:**

- Implementará una geometría básica (ej. `<cylinderGeometry args={[0.05, 0.05, 1, 16]}>` desplazada en Y) simulando una barra alargada.
- Su pivote estará en la parte inferior para que al rotar, oscile desde un extremo.
- Empaquetará la lógica contenida del "Swing" via `useFrame` referenciando su propio mesh.

**Actualizar `PlayerHands.tsx`:**

- Renderizado condicional suscribiéndose al store (`usePlayerStore(state => state.activeWeapon)`).
- Devolverá el arma adecuada según el inventario activo:
  ```tsx
  <group>
    {activeWeapon === "iron_bar" && <IronBar />}
    {activeWeapon === "blaster" && <Blaster />}
  </group>
  ```
- Este approache mantiene separada la visual + lógica procedural de cada arma en componentes aislados sin saturar el hub principal de la vista del jugador.
