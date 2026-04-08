# Spec 21: Game Feel — Headbobbing & Weapon Sway

## 1. Objetivo

Transformar el movimiento del jugador de un deslizamiento rígido a una experiencia encarnada. El Headbobbing y el Weapon Sway son las técnicas de "game feel" más impactantes en un FPS con coste computacional mínimo, ya que operan exclusivamente sobre refs de Three.js dentro de `useFrame`, sin ningún re-render de React.

---

## 2. Principio Rector: Zero Re-renders

Todos los valores de animación de esta spec se almacenan en `useRef` y se aplican directamente a los objetos Three.js (`camera.position`, `camera.rotation`, `mesh.position`, `mesh.rotation`) dentro del loop de `useFrame`. **Ningún `useState` será utilizado.**

---

## 3. Headbobbing (Movimiento de Cámara)

Se implementa en `Player.tsx`, donde la cámara ya es accesible vía `cameraRef`.

### 3.1 Variables de Estado (Refs)

```
bobTime    = useRef(0)      // Acumulador de tiempo para la fase del seno
bobActive  = useRef(false)  // Flag indicando si el jugador está en movimiento
```

### 3.2 Parámetros de Configuración

| Parámetro         | Caminando  | Corriendo (futuro) |
| ----------------- | ---------- | ------------------ |
| `BOB_FREQUENCY`   | `10` rad/s | `14` rad/s         |
| `BOB_AMPLITUDE_Y` | `0.05` u   | `0.08` u           |
| `BOB_AMPLITUDE_X` | `0.025` u  | `0.04` u           |
| `BOB_LERP_SPEED`  | `8`        | `8`                |

### 3.3 Lógica en `useFrame`

```
movementMag = |vel.x| + |vel.z|   ← Magnitud real del movimiento del frame actual

Si movementMag > 0.1:
  bobTime += delta * BOB_FREQUENCY
  targetY  = BASE_Y + sin(bobTime) * BOB_AMPLITUDE_Y
  targetX  = cos(bobTime * 0.5) * BOB_AMPLITUDE_X
Sino:
  // Lerp de regreso a posición neutra para transición suave
  targetY  = BASE_Y
  targetX  = 0

camera.position.y = lerp(camera.position.y, targetY, delta * BOB_LERP_SPEED)
camera.position.x = lerp(camera.position.x, targetX, delta * BOB_LERP_SPEED)
```

**Doble frecuencia en X vs Y:** El eje horizontal bob a mitad de frecuencia (`bobTime * 0.5`) para producir el patrón de figura-8 característico del headbob real, donde la cabeza se balancea lateralmente una vez por cada dos pasos.

### 3.4 Relación con el View Bobbing Existente

`Player.tsx` ya tiene un view bobbing rudimentario (solo eje Y). Esta spec lo **reemplaza y enriquece** añadiendo el componente X. La variable `viewBobTime` existente se renombra a `bobTime` para claridad.

---

## 4. Weapon Sway (Inercia del Arma)

Se implementa en `PlayerHands.tsx`, donde el grupo del arma ya tiene un ref (`handsRef`).

### 4.1 Origen del Input: Movimiento del Mouse

R3F expone el delta del mouse a través de `state.mouse` en `useFrame`. Sin embargo, `state.mouse` da la posición normalizada (-1 a 1), no el delta por frame. Para obtener el delta necesitamos comparar con la posición anterior:

```
prevMouseX = useRef(0)
prevMouseY = useRef(0)

// En useFrame:
mouseDeltaX = state.mouse.x - prevMouseX.current
mouseDeltaY = state.mouse.y - prevMouseY.current
prevMouseX.current = state.mouse.x
prevMouseY.current = state.mouse.y
```

### 4.2 Variables de Estado (Refs)

```
prevMouseX   = useRef(0)
prevMouseY   = useRef(0)
swayTargetX  = useRef(0)   // Rotación objetivo en X (pitch sway)
swayTargetY  = useRef(0)   // Rotación objetivo en Y (yaw sway)
```

### 4.3 Parámetros de Configuración

| Parámetro     | Valor  | Descripción                                  |
| ------------- | ------ | -------------------------------------------- |
| `SWAY_AMOUNT` | `0.04` | Amplificador del desplazamiento              |
| `SWAY_MAX`    | `0.08` | Clamp máximo para evitar rotaciones extremas |
| `SWAY_LERP`   | `6`    | Velocidad de retorno a neutral               |

### 4.4 Lógica en `useFrame`

```
mouseDeltaX = state.mouse.x - prevMouseX.current
mouseDeltaY = state.mouse.y - prevMouseY.current

// El arma se desplaza en dirección OPUESTA al movimiento del mouse (inercia)
swayTargetY.current = clamp(-mouseDeltaX * SWAY_AMOUNT, -SWAY_MAX, SWAY_MAX)
swayTargetX.current = clamp( mouseDeltaY * SWAY_AMOUNT, -SWAY_MAX, SWAY_MAX)

// Aplicar con lerp al grupo del arma
handsRef.current.rotation.z = lerp(handsRef.current.rotation.z, swayTargetY, delta * SWAY_LERP)
handsRef.current.rotation.x = lerp(handsRef.current.rotation.x, swayTargetX, delta * SWAY_LERP)

// Reset mouse refs
prevMouseX.current = state.mouse.x
prevMouseY.current = state.mouse.y
```

**Dirección invertida (`-mouseDeltaX`):** La física percibida de inercia requiere que el arma se quede "atrás" cuando la cámara gira. Si el mouse va a la derecha, el arma debe inclinarse a la izquierda.

### 4.5 Interacción con el Recoil Existente

`PlayerHands.tsx` ya tiene un sistema de recoil procedural en `useFrame`. El Weapon Sway debe **sumarse** al recoil, no reemplazarlo:

```
handsRef.rotation.z = lerp(handsRef.rotation.z, swayTargetZ + recoilZ, delta * SWAY_LERP)
```

Se deberá revisar el orden de aplicación para que ambos efectos coexistan sin conflicto.

---

## 5. Diagrama de Flujo del useFrame

```
useFrame(state, delta)
│
├── [Player.tsx]
│     ├── Leer velocidad del rigidBody
│     ├── Calcular movementMag
│     ├── Si en movimiento: acumular bobTime
│     ├── Calcular targetY = BASE_Y + sin(bobTime) * AMP_Y
│     ├── Calcular targetX = cos(bobTime/2) * AMP_X
│     └── Lerp camera.position.{x,y} → target
│
└── [PlayerHands.tsx]
      ├── Calcular mouseDelta desde state.mouse
      ├── Calcular swayTarget.{x,z} ← invertido al mouse
      ├── Lerp handsRef.rotation.{x,z} → swayTarget + recoil
      └── Actualizar prevMouse refs
```

---

## 6. Advertencia de Doble Aplicación

> [!CAUTION]
> La cámara en Player.tsx es hija del `<RigidBody>` (a través de `<PerspectiveCamera>`). Al modificar `camera.position.x` en el headbob, se está moviendo la cámara **en coordenadas locales del RigidBody**, no en el mundo. Esto es correcto y deseado, pero debe verificarse que no interfiera con el `getWorldPosition` que usa el Enemy para rastrear al jugador (el Enemy usa `state.camera.getWorldPosition`, que compensa correctamente).
