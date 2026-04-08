# Spec 17: Survival HUD System

## 1. Diseño Arquitectónico y Componente `SurvivalHUD.tsx`

### Capa HTML de Superposición

La interfaz debe existir exclusivamente como una capa 2D superpuesta para mantener la inmersión:

- **Contenedor Principal:** Debe tener las propiedades CSS `position: absolute`, `inset: 0` y, críticamente, `pointer-events: none`.
- **Propósito:** Esto asegura que la UI cubra toda la pantalla pero permita que los eventos del ratón (clicks para disparar, movimientos de cámara) traspasen la interfaz hacia el `<Canvas>` de Three.js (React Three Fiber) sin interrupciones.

### Integración de Estado (Zustand)

El componente se conectará a los stores globales de manera reactiva:

- **`usePlayerStore`:** Se suscribirá para extraer el estado de supervivencia: `hp` (salud del jugador, 0-100) y `activeWeapon` (arma seleccionada actualmente).
- **`useStoryStore`:** Se suscribirá a `currentSubtitle` para evaluar si "La Voz" está hablando en ese preciso instante (`currentSubtitle !== null`).

### ⚠️ Restricción Crítica de Re-renders (Performance)

- El componente `SurvivalHUD` **debe ser renderizado fuera** del componente `<Canvas>` de Three.js (como nodo hermano en el DOM de React).
- La constante actualización de los stores (especialmente la salud u otros indicadores HUD rápidos) provoca re-renders en el componente que los consume. Si el HUD estuviera dentro del árbol del `<Canvas>`, causaría un re-render de la escena 3D completa en cada cambio. Mantenerlo estrictamente separado asegura el rendimiento óptimo del motor 3D.

---

## 2. Elementos de la Interfaz (Estética Minimalista y Cruda)

El HUD debe evocar un ambiente post-apocalíptico, opresivo e industrial. Nada de interfaces modernas o brillantes; la estética debe ser imperfecta.

### Barra de Salud (Bottom Left)

- **Ubicación:** Esquina inferior izquierda de la pantalla.
- **Comportamiento:** Una barra de progreso o medidor que reduce su ancho/alto del 100 al 0.
- **Estilo:** Un color "crudo", como un rojo oscuro apagado o un blanco/gris sucio mate. Bordes rectos y duros. Podría tener un ligero efecto de desgaste visual o parpadeo débil en niveles bajos.

### Indicador de Arma (Bottom Right)

- **Ubicación:** Esquina inferior derecha de la pantalla.
- **Comportamiento:** Reacciona instantáneamente a la propiedad `activeWeapon`.
- **Estilo:** Texto tipográfico limpio (ej. fuente monospace, Courier o industrial) y crudo, o iconografía lineal muy simple.
- **Salidas de Ejemplo:** "Manos vacías", "Barra de Hierro", "Blaster".

### Indicador Psicológico / Presencia de "La Voz" (Top Right o sobre el Arma)

- **Ubicación:** Esquina superior derecha (aislado) o justo por encima del indicador del arma.
- **Comportamiento:** Aparece exclusivamente cuando "La Voz" se está comunicando (`currentSubtitle !== null`).
- **Estética:** Un ícono o animación sutil que represente una intrusión mental. Puede ser un pequeño pulso arrítmico, un indicio de "estática de radio", o una perturbación gráfica (glitch) que haga sentir al jugador que la presencia está activamente hablándole.
