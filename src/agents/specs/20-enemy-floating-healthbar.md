# Spec 20: Barra de Vida Flotante del Oportunista (World Space UI)

## 1. Objetivo

Integrar feedback visual de daño sobre el enemigo sin romper la inmersión ni comprometer el rendimiento. La barra flotante existe en el espacio 3D del mundo (no en el HUD 2D) y sólo aparece después de que el enemigo recibe su primer golpe.

---

## 2. Refactor de `Enemy.tsx`

### 2.1 Importación

Añadir `Html` al bloque de imports de `@react-three/drei`:

```tsx
import { Html } from "@react-three/drei";
```

No se requieren otras dependencias externas.

### 2.2 Prop de `hp` Necesaria

El estado local `hp` ya existe en `Enemy.tsx` como `useState(100)` (Spec 15). La barra lo consumirá directamente desde ese estado. **No se requiere ningún cambio de contrato.**

---

## 3. Configuración del World Space UI con `<Html>`

El componente `<Html>` de Drei renderiza DOM real posicionado en el grafo de escena 3D.

### 3.1 Posicionamiento

```tsx
<Html position={[0, 2.2, 0]}>
```

- Eje Y en `2.2` coloca la barra ligeramente por encima del techo de la cápsula del Oportunista (geometría de ~2 unidades de altura), evitando que se superponga con el mesh.
- Los ejes X y Z en `0` la centran horizontalmente sobre el enemigo.

### 3.2 Billboard (Orientación hacia la Cámara)

```tsx
<Html
  position={[0, 2.2, 0]}
  center
  sprite
  transform
>
```

| Prop        | Efecto                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `center`    | Centra el elemento HTML en el punto de anclaje 3D, en lugar de alinearlo al borde.                                                                                             |
| `transform` | Aplica la transformación 3D completa (escala perspectiva) al HTML, haciendo que se encoja con la distancia.                                                                    |
| `sprite`    | Fuerza la rotación automática del elemento para enfrentar siempre a la cámara (billboarding). Sin esta prop, la barra quedaría fija en el plano XZ y sería ilegible en ángulo. |

### 3.3 Oclusión (Opcional, Recomendada para Inmersión)

```tsx
<Html
  ...
  occlude="raycast"
>
```

Con `occlude="raycast"`, la barra se oculta cuando el enemigo es tapado por geometría de la escena. Esto preserva la ilusión del espacio 3D. Si se activa, requiere que el mesh del enemigo esté referenciado en la prop `occlude={[meshRef]}` para mayor precisión.

> [!NOTE]
> Para el MVP, `occlude` es opcional. Activarlo más adelante es un upgrade de un solo prop.

---

## 4. Lógica Visual de la Barra

### 4.1 Renderizado Condicional (Regla de Oro)

```tsx
{hp < 100 && (
  <Html ...>
    {/* ... */}
  </Html>
)}
```

**La barra SÓLO es visible si el enemigo ya recibió al menos 1 punto de daño.** Esto cumple dos objetivos:

1. **Inmersión:** Un enemigo intacto no tiene indicadores visibles, preservando la atmósfera de amenaza ambigua de la niebla.
2. **Rendimiento:** El componente `<Html>` no se monta en absoluto para enemigos no dañados, reduciendo el overhead de DOM.

### 4.2 Estructura Visual del HTML

```
┌─────────────────────────────────┐  ← Contenedor oscuro (fondo)
│ ██████████████░░░░░░░░░░░░░░░░ │  ← Barra interior (color activo)
└─────────────────────────────────┘
      width atado al hp%
```

La barra interior deberá tener su `width` atado directamente al porcentaje de HP:

```tsx
style={{ width: `${hp}%` }}
```

**Paleta de Colores:**

- `hp >= 60`: Verde (`#22c55e`) — Enemigo robusto, advertencia suave.
- `hp >= 30` y `< 60`: Naranja (`#f97316`) — Estado de alerta.
- `hp < 30`: Rojo (`#ef4444`) — Crítico, comunicar urgencia al jugador.

El cambio de color se logrará con una función helper o ternarios inline, evaluando el valor actual de `hp`.

### 4.3 Dimensiones Recomendadas

| Propiedad             | Valor                          |
| --------------------- | ------------------------------ |
| Ancho del contenedor  | `80px` fijo                    |
| Altura de la barra    | `8px`                          |
| Border radius         | `4px`                          |
| Fondo del contenedor  | `rgba(0,0,0,0.7)`              |
| Transición de anchura | `transition: width 0.15s ease` |

La transición suave de `0.15s` da un feedback visual fluido al impacto sin gastar recursos significativos.

---

## 5. Advertencia de Rendimiento

> [!WARNING]
> El componente `<Html>` de Drei tiene un costo fijo por instancia porque inyecta un nodo DOM real en el árbol del documento, por fuera del Canvas WebGL. Con 2–5 enemigos en pantalla simultáneos, el impacto es despreciable. Con 20+ enemigos activos y todos con barras visibles, el overhead de DOM puede degradar el framerate.

**Mitigaciones implementadas en esta spec:**

1. **Renderizado condicional `hp < 100`**: La barra solo existe en el DOM cuando es necesaria.
2. **Dimensiones mínimas**: Contenedor de `80px` mínimiza el reflow del navegador.
3. **Sin librerías adicionales**: Pure CSS/inline styles, sin coste de bundle.

Para proyectos con alta densidad de enemigos (+20), la alternativa técnica sería migrar las barras de vida a sprites de Three.js (`PlaneGeometry` + `CanvasTexture`), eliminando el DOM por completo. Esta migración está fuera del alcance del MVP actual.

---

## 6. Árbol de Componentes Final (Referencia)

```tsx
<RigidBody ...>
  <CapsuleCollider ... />

  <group ref={meshGroupRef}>
    {/* Cuerpo visual */}
    <mesh>...</mesh>
    {/* Visor */}
    <mesh>...</mesh>
  </group>

  {/* Anchor point de audio 3D */}
  <group ref={groupRef} />

  {/* Barra de vida flotante — sólo si ha recibido daño */}
  {hp < 100 && (
    <Html position={[0, 2.2, 0]} center sprite transform>
      <div style={{ width: "80px", ... }}>
        <div style={{ width: `${hp}%`, background: colorByHp(hp), ... }} />
      </div>
    </Html>
  )}
</RigidBody>
```
