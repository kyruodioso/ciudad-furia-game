# Spec 13: Motor Narrativo y Triggers Espaciales

## 1. Estado Narrativo (Zustand)

Para mantener las responsabilidades separadas, extenderemos el gestor global o crearemos uno dedicado al ámbito narrativo: `useStoryStore.ts`.

**Estructura del Estado:**

- **Variables:**
  - `currentSubtitle: string | null`: Almacena el texto que "La Voz" está pronunciando en este momento. Si es `null`, no hay diálogo activo.
- **Acciones:**
  - `triggerDialogue(text: string, duration: number)`: Función responsable de despachar el diálogo.
    - Esta acción configurará `currentSubtitle = text`.
    - Internamente, gestionará un `setTimeout` o temporizador basándose en la `duration` entregada. Al culminar dicho tiempo, reseteará `currentSubtitle` a `null`.
    - **Protección de Race Conditions:** Se debe estructurar de modo que si un diálogo nuevo interrumpe a otro anterior, el timeout remanente del anterior sea cancelado (usando `clearTimeout` sobre una referencia alojada en el scope del store) para que no borre prematuramente el texto del nuevo diálogo.

## 2. Componente `NarrativeTrigger.tsx`

Será el ente invisible volumétrico situado a lo largo del mapa.

**Físicas (Rapier):**

- Utilizará un componente `<CuboidCollider>` con la propiedad `sensor` activada para no obstruir físicamente, sólo detectar áreas.
- Sus dimensiones estarán dictadas por la prop dinámica `args`.

**Props Esperados:**

- `position: [number, number, number]` (Ubicación en el mundo).
- `args: [number, number, number]` (Volumen del trigger).
- `dialogueText: string` (La frase a ejecutar).
- `duration: number` (Opcional o default: dependerá de la longitud métrica, ej. 5000ms).
- `isOneShot: boolean` (Indica si el evento se quema o si puede reactivarse).

**Lógica de Intersección y Prevención de Múltiples Disparos:**

- Contará con un `useState(false)` o `useRef(false)` atómico llamado `hasFired`.
- En `onIntersectionEnter={(payload) => ...}`:
  - Primer chequeo: Si `isOneShot === true` y `hasFired.current === true`, se aborta inmediatamente `return;`.
  - Segundo chequeo: Validamos si la entidad entrante es el Player. Extraemos metadatos: `payload.other.rigidBodyObject?.userData?.type === "player"`.
  - Si los chequeos son exitosos:
    - Seteamos `hasFired.current = true`.
    - `useStoryStore.getState().triggerDialogue(dialogueText, duration)`.
- Esto mitigará los re-renders erráticos en el borde del colisionador; una vez disparado (especialmente si es One Shot), el trigger se bloquea internamente antes del despachador y evita inundar Zustand repetitivamente.

## 3. UI de Subtítulos (Capa Frontal)

Construiremos la capa visual por encima o paralelamente al engine 3D.

**Diseño de Componente:**

- Se creará un componente DOM estándar de React (fuera del `Canvas` global, inyectado sobre el contenedor padre `absolute inset-0 pointer-events-none`).
- Este componente importará el estado: `const subtitle = useStoryStore(state => state.currentSubtitle)`.
- **Estilo Cinematográfico (Tailwind / CSS puro):**
  - Textos rellenando la parte inferior central (`bottom-10`, `text-center`, `w-full`).
  - Renderizado condicional mediante el hook de estado, envolviendo al texto en un bloque para que desaparezca con gracia, tal vez inyectando micro animaciones CSS (`fade-in`).
  - El texto contará con un `text-shadow` o `drop-shadow` denso (ej: gris oscuro o negro sobre el texto blanco o magenta neón) garantizando que permanezca legible sin importar los contrastes saturados del gameplay en el fondo.
