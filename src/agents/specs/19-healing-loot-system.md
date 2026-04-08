# Spec 19: Sistema de Loot de Curación — El Medkit

## 1. Objetivo

Implementar el botiquín como el primer ítem de recompensa consumible del juego, cerrando el ciclo de combate: el jugador recibe daño del Oportunista, se recupera con el Medkit, y puede volver a enfrentarse. El ítem debe ser fácil de reconocer visualmente y requerir que el jugador explore el mapa para encontrarlo.

---

## 2. Refactor del Estado Global (`usePlayerStore.ts`)

### 2.1 Nueva Acción: `healPlayer(amount: number)`

Añadir al store la capacidad de recuperar salud:

```ts
healPlayer: (amount: number) => void;
```

**Regla de Clamp:** El HP no puede superar 100. La implementación debe usar `Math.min`:

```ts
healPlayer: (amount) =>
  set((state) => ({ hp: Math.min(100, state.hp + amount) })),
```

No se requiere ningún otro cambio en el contrato del store.

---

## 3. Componente `Medkit.tsx`

### 3.1 Físicas (Rapier)

El Medkit utilizará un sensor invisible para detectar la proximidad del jugador **sin crear colisión física** (el jugador no choca con él, lo atraviesa):

```tsx
<RigidBody type="fixed" position={position}>
  <CuboidCollider args={[0.3, 0.3, 0.3]} sensor onIntersectionEnter={...} />
  {/* Mesh visual */}
</RigidBody>
```

### 3.2 Visual (Greybox)

- Geometría: `<boxGeometry args={[0.5, 0.5, 0.5]}` — caja pequeña y compacta.
- Color base: `#ffffff` (blanco) con una cruz verde (`#22c55e`) pintada como `emissive` para que emita luz y sea visible en la niebla.
- Material: `metalness={0.0}`, `roughness={0.5}`. La cruz puede implementarse como un segundo mesh de `boxGeometry` plano superpuesto (`args={[0.5, 0.1, 0.02]}`), rotado 90° para formar la forma de cruz.

### 3.3 Animación de Levitación (`useFrame`)

Para que el ítem destaque en el suelo y comunique "recolectable", ejecutará un **bobbing** procedural:

- El mesh levitará sinusoidalmente entre ±0.15 unidades en el eje Y.
- Rotará lentamente sobre su eje Y para mayor visibilidad desde cualquier ángulo.
- Todo dentro de `useFrame` sin estado de React, respetando el principio **Zero Re-renders**:

```
meshRef.current.position.y = baseY + Math.sin(elapsedTime * 2) * 0.15
meshRef.current.rotation.y += 0.01
```

### 3.4 Lógica de Recolección (Evento Único)

> [!IMPORTANT]
> El sensor de Rapier puede disparar `onIntersectionEnter` múltiples veces si el jugador permanece dentro del colisionador. Se debe garantizar que la curación ocurra una sola vez.

**Mecanismo de prevención de duplicados:**

1. El componente mantiene un estado local `const [collected, setCollected] = useState(false)`.
2. En `onIntersectionEnter`:
   - **Guard primario:** `if (collected) return;`
   - **Validación del actor:** Verificar que el cuerpo entrante es el jugador: `payload.other.rigidBodyObject?.userData?.type === "player"`.
   - Si ambos checks son exitosos:
     1. `setCollected(true)` — lock inmediato.
     2. `usePlayerStore.getState().healPlayer(30)` — curación de +30 HP.
     3. `useAudioStore.getState().play2D("sfx_heal", { volume: 0.8 })` — feedback sonoro.
3. Renderizado condicional: `if (collected) return null;` — el componente desaparece de la escena.

**Por qué `useState` y no `useRef`:**

En este caso, `useState` es correcto y necesario. A diferencia de los timers del AI, aquí **queremos** un re-render al recoger el ítem, porque es lo que desmonta el componente y lo elimina de la escena.

---

## 4. Manifiesto de Audio

Añadir al manifiesto en `AudioEngine.tsx`:

```ts
{ id: "sfx_heal", url: "/audio/sfx_heal.mp3", type: "2d" }
```

El archivo de audio debe ser un sonido corto y positivo (ej. chime, ding). Placeholder en `public/audio/sfx_heal.mp3`.

---

## 5. Distribución en el Nivel (`SciFiRoom.tsx`)

El Medkit se colocará **detrás de un obstáculo** para incentivar la exploración activa:

- **Posición sugerida:** `[8, 0.3, -10]` — detrás de una de las barricadas/obstáculos del extremo norte del cuarto.
- El jugador necesita desvíarse de su ruta directa hacia los enemigos para encontrarlo, creando una micro-decisión táctica: ¿curo primero o ataco?

```tsx
{
  /* Loot de Curación — Detrás de la barricada norte */
}
<Medkit position={[8, 0.3, -10]} />;
```

---

## 6. Advertencia de Rendimiento

> [!NOTE]
> El componente `Medkit` es un actor de baja frecuencia (no tiene `useFrame` complejo, solo bobbing). Con 2–5 Medkits en el mapa el impacto es insignificante. Si se necesitan decenas de ítems en el futuro, el patrón a seguir es instanciar geometría compartida con `InstancedMesh` en lugar de múltiples componentes independientes.

---

## 7. Árbol de Componentes Final (Referencia)

```tsx
export function Medkit({ position }) {
  const [collected, setCollected] = useState(false);
  const meshRef = useRef();

  useFrame(({ clock }) => {
    // Bobbing y rotación procedural
  });

  if (collected) return null;

  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider
        sensor
        args={[0.3, 0.3, 0.3]}
        onIntersectionEnter={(payload) => {
          if (collected) return;
          if (payload.other.rigidBodyObject?.userData?.type !== "player")
            return;
          setCollected(true);
          usePlayerStore.getState().healPlayer(30);
          useAudioStore.getState().play2D("sfx_heal", { volume: 0.8 });
        }}
      />
      <group ref={meshRef}>
        {/* Cuerpo blanco */}
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Cruz verde (indicador de curación) */}
        <mesh position={[0, 0, 0.26]}>
          <boxGeometry args={[0.4, 0.1, 0.02]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0, 0, 0.26]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.4, 0.1, 0.02]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
```
