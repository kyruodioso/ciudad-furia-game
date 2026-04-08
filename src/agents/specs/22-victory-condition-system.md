# Spec 22: Sistema de Condición de Victoria — Transceptor y Zona de Extracción

## 1. Objetivo

Cerrar el loop de gameplay del MVP con una condición de victoria clara: el jugador debe encontrar el Transceptor (objeto clave), sobrevivir al encuentro con los Oportunistas, y llegar a la Zona de Extracción. Esto transforma el prototipo de sandbox en una experiencia narrativa completa con inicio, conflicto y resolución.

---

## 2. Refactor del Estado Global (`useStoryStore.ts`)

### 2.1 Nuevas Variables de Estado

| Variable       | Tipo      | Inicial | Descripción                                                 |
| -------------- | --------- | ------- | ----------------------------------------------------------- |
| `hasObjective` | `boolean` | `false` | Verdadero cuando el Transceptor fue recogido                |
| `isExtracted`  | `boolean` | `false` | Verdadero cuando el jugador llega a la zona con el objetivo |

### 2.2 Nuevas Acciones

```ts
collectObjective: () => void;
// Setea hasObjective = true. Llama internamente a triggerDialogue() con la frase de Marcia.

extractPlayer: () => void;
// Setea isExtracted = true. Solo debe tener efecto si hasObjective === true.
```

**Implementación de `extractPlayer`:**

```ts
extractPlayer: () => {
  const { hasObjective } = get();
  if (!hasObjective) return; // Guard: sin el objeto no se extrae
  set({ isExtracted: true });
};
```

---

## 3. Componente `KeyObject.tsx` (El Transceptor)

### 3.1 Visual — Identidad Única

El Transceptor debe distinguirse inequívocamente del entorno, Medkits y enemigos:

| Elemento        | Color                                   |
| --------------- | --------------------------------------- |
| Medkit          | Blanco + Cruz verde                     |
| Oportunista     | Rojo oscuro                             |
| **Transceptor** | **Negro + Luz azul eléctrico pulsante** |

- Geometría: `<octahedronGeometry args={[0.35]}>` — forma angular y extraña, distinta de las cajas.
- Material: `color="#0a0a1a"` (negro azulado), `emissive="#00aaff"`, `emissiveIntensity` animado en `useFrame` entre 0.5 y 2.0 usando `Math.sin` para el efecto de pulso.
- Luz puntual: `<pointLight color="#00aaff" intensity={2} distance={4}>` anclada al mismo grupo para que ilumine el suelo en azul.
- Animación de levitación + rotación en `useFrame` (mismo patrón que el Medkit, sin estado).

### 3.2 Físicas

```tsx
<RigidBody type="fixed" position={position}>
  <CuboidCollider args={[0.4, 0.4, 0.4]} sensor onIntersectionEnter={...} />
  <group ref={meshRef}>...</group>
</RigidBody>
```

### 3.3 Lógica de Recolección

1. Guard: `useState(false)` para `collected`, prevenir duplicados.
2. `onIntersectionEnter`:
   - Verificar `userData.type === "player"`.
   - `setCollected(true)`.
   - `useStoryStore.getState().collectObjective()`.
   - Esta acción llama internamente a `triggerDialogue("Ya lo tenés. Ahora salí de ahí antes de que lleguen más.")`.
3. `if (collected) return null;` — el objeto desaparece de la escena.

### 3.4 Posición Sugerida

Detrás de la última barricada / obstáculo más alejado del punto de inicio, para que el jugador tenga que atravesar la zona de combate. Sugerencia: `[-6, 0.5, -14]`.

---

## 4. Componente `ExtractionZone.tsx`

### 4.1 Lógica

```tsx
<RigidBody type="fixed" position={position}>
  <CuboidCollider
    args={[3, 2, 3]}
    sensor
    onIntersectionEnter={(payload) => {
      if (payload.other.rigidBodyObject?.userData?.type !== "player") return;
      useStoryStore.getState().extractPlayer(); // Guard interno en el store
    }}
  />
</RigidBody>
```

### 4.2 Indicador Visual (Tenue, No Intrusivo)

La zona no tendrá geometría sólida visible, pero sí dos señales sutiles para orientar al jugador:

1. **Luz direccional en el suelo:** Un `<pointLight color="#00ff88" intensity={1.5} distance={6}>` estático a ras de suelo, creando un charco de luz verde que contrasta con la niebla y señala el destino.
2. **Partículas opcionales (futuro):** Fuera del alcance del MVP pero documentado como upgrade natural.

### 4.3 Posición Sugerida

Al final opuesto al spawn del jugador, detrás de un corredor de enemigos. Sugerencia: `[0, 0, -22]`.

---

## 5. HUD: Indicador de Extracción (`SurvivalHUD.tsx`)

Cuando `hasObjective === true` e `isExtracted === false`, mostrar un indicador pulsante encima de la barra de vida:

```
┌──────────────────────────────┐
│  ⬆  EXTRACCIÓN DISPONIBLE   │  ← amarillo/verde, animado
└──────────────────────────────┘
```

- Consumir `hasObjective` desde `useStoryStore` (selector atómico para no disparar re-renders innecesarios).
- Renderizado condicional: solo visible si `hasObjective && !isExtracted`.
- Estilo: borde verde pulsante, texto en mayúsculas, `animate-pulse` de Tailwind.

---

## 6. Componente `VictoryScreen.tsx`

### 6.1 Condición de Montaje

```tsx
// En page.tsx, fuera del Canvas:
const isExtracted = useStoryStore((state) => state.isExtracted);
{
  isExtracted && <VictoryScreen />;
}
```

### 6.2 Diseño del Overlay

- Ocupa `position: fixed; inset: 0` con `z-index` máximo.
- Fondo: `rgba(0, 0, 0, 0.92)` + blur de fondo para que el 3D "congele" detrás.
- Contenido central:

```
[ SOLSTEINN INNOVATIONS ]

    MISIÓN COMPLETADA

  El Transceptor fue recuperado.
Ciudad Furia sobrevive otro día.

    [ REINICIAR PARTIDA ]
```

- Tipografía: `font-mono`, letras espaciadas (`tracking-widest`), efecto de scanlines CSS (pseudoelemento `::before`).
- Botón "Reiniciar": Llama a `window.location.reload()` — solución stateless y limpia para el MVP, sin necesidad de resetear manualmente cada store.

### 6.3 Paleta

| Elemento            | Color                        |
| ------------------- | ---------------------------- |
| Background          | `#000000` + `opacity: 0.92`  |
| Título corporativo  | `#00aaff` (azul Solsteinn)   |
| Texto principal     | `#ffffff`                    |
| Subtítulo narrativo | `#888888`                    |
| Botón               | `#00ff88` (verde extracción) |

---

## 7. Flujo de Estado Completo

```
Jugador recoge Transceptor
  → collectObjective() → hasObjective = true
  → triggerDialogue("Ya lo tenés...") → subtítulo aparece
  → SurvivalHUD muestra "EXTRACCIÓN DISPONIBLE"

Jugador entra en ExtractionZone
  Guard: hasObjective === false → no pasa nada
  Guard: hasObjective === true  → extractPlayer() → isExtracted = true

isExtracted = true
  → <VictoryScreen> se monta sobre el Canvas
  → Juego "congela" (el Canvas sigue renderizando detrás)
  → Botón "Reiniciar" → window.location.reload()
```
