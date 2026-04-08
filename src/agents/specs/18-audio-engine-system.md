# Spec 18: Motor de Audio — 2D UI/Narrativo & 3D Posicional

## 1. Gestor de Audio Global (`useAudioStore.ts`)

El gestor centraliza el ciclo de vida de todos los recursos de audio del juego y actúa como la única puerta de entrada para la reproducción de sonidos.

### 1.1 La Política de Autoplay del Navegador

> **RESTRICCIÓN CRÍTICA:** Los navegadores modernos bloquean cualquier contexto de audio creado antes de un gesto explícito del usuario. Ignorar esto resultará en silencio total sin errores visibles en producción.

**Estrategia de Desbloqueo:**

- El store mantendrá una variable `isAudioUnlocked: boolean` (inicial: `false`).
- La acción `unlockAudio()` será la única responsable de crear el `AudioContext` (o resumir el que Three.js instancia internamente) y fijar el flag a `true`.
- Esta acción **deberá ser llamada única y exclusivamente** desde los event handlers de los dos primeros gestos de juego:
  1. El click del botón "Iniciar" / "Nueva Partida" en la pantalla de título.
  2. El primer evento de `onPointerDown` del control de PointerLock.
- Todo intento de reproducir un sonido ANTES de que `isAudioUnlocked` sea `true` será silenciado en el store (early return), evitando errores y el bloqueo de Chrome/Firefox.

### 1.2 Precarga de Buffers (Estrategia de Memoria)

Para evitar saturación de memoria y cargas síncronas (jank) durante el gameplay, se implementará un flujo de **precarga declarativa**:

- El store expondrá un `Map<string, AudioBuffer>` llamado `audioBuffers`, indexado por un identificador semántico (ej. `"sfx_glitch"`, `"amb_enemy_growl"`).
- La acción `preloadSounds(manifest: AudioManifest[])` realizará `fetch` + `decodeAudioData` en paralelo para todos los archivos listados en el manifiesto al inicio del juego (ej. en la pantalla de carga o en el `useEffect` del componente raíz).
- Una vez en el buffer, el archivo de audio no volverá a descargarse. Los reproductores de todo el sistema consumirán siempre desde este `Map` en memoria.
- **Audio Context Compartido:** Three.js/Drei crean su propio `AudioListener` internamente. Para el audio 2D, se reutilizará el `AudioContext` expuesto por el `<AudioListener>` de la escena. No se crearán contextos duplicados.

### 1.3 Manifiesto de Audio (Referencia)

```
interface AudioManifest {
  id: string;        // Clave semántica única
  url: string;       // Ruta pública al archivo (.ogg / .mp3)
  type: '2d' | '3d'; // Hint para optimización de decodificación
}
```

Ejemplos de entradas en el manifiesto:

- `{ id: "sfx_glitch", url: "/audio/ui_glitch.ogg", type: "2d" }`
- `{ id: "voice_static", url: "/audio/voice_static.ogg", type: "2d" }`
- `{ id: "enemy_growl", url: "/audio/enemy_growl_loop.ogg", type: "3d" }`

---

## 2. Capa 2D — UI & "La Voz" Narrativa

Esta capa maneja todos los sonidos planos (sin posición en el espacio 3D): efectos de interfaz, estática de comunicación y el subtext auditivo que acompaña a los subtítulos.

### 2.1 Hook `useNarrativeAudio.ts`

Se creará un hook personalizado que vigila el estado narrativo y dispara el sonido correspondiente de forma completamente aislada del render cycle:

**Responsabilidades del Hook:**

1. Subscribirse a `useStoryStore(state => state.currentSubtitle)` mediante un selector atómico.
2. Mantener una referencia `useRef` al nodo `Audio` activo para poder detenerlo/interrumpirlo.
3. Ejecutar la lógica dentro de un `useEffect` con `[currentSubtitle]` como dependencia.

**Flujo del `useEffect`:**

- Si `currentSubtitle === null`: invocar `.pause()` y resetear `.currentTime = 0` en la referencia activa (si existe). No hacer nada más.
- Si `currentSubtitle !== null`:
  1. Verificar que `isAudioUnlocked === true` en `useAudioStore`. Si es `false`, retornar.
  2. Recuperar el buffer `"sfx_glitch"` del `Map` de buffers precargados.
  3. Crear un `AudioBufferSourceNode` a partir del buffer, conectarlo al `AudioContext.destination`.
  4. Llamar `.start(0)` para reproducción inmediata.
  5. Guardar la referencia para poder interrumpirlo si un nuevo diálogo llega antes de que termine.

**Por qué `useEffect` y no `useFrame`:**
El sonido narrativo es un evento de ciclo de vida, no una actualización por frame. `useEffect` garantiza que el audio se dispara exactamente una vez por cambio de subtítulo, sin polling de 60 FPS que desperdicie CPU.

### 2.2 Punto de Montaje

El hook `useNarrativeAudio` se instanciará en el componente raíz de la UI superpuesta (fuera del `<Canvas>`), como hermano del componente de subtítulos `SubtitleDisplay`. Al ser un hook sin JSX de retorno, no añade DOM ni costo de render.

---

## 3. Capa 3D — Audio Posicional del Oportunista

Esta capa explota la física acústica del espacio 3D para que el jugador pueda "escuchar" al enemigo a través de la niebla, incrementando la tensión sin depender de señales visuales.

### 3.1 El Componente `<PositionalAudio>` de Drei

Drei encapsula la API `PannerNode` de la Web Audio API en un componente React Three Fiber compatible con el grafo de escena. Funciona adjunto como hijo directo al `Object3D` del enemigo, heredando su posición en el mundo automáticamente en cada frame.

**Atributos clave a configurar:**

| Prop       | Tipo      | Descripción                                                                |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `url`      | `string`  | Ruta al archivo de audio (loop de gruñido/respiración).                    |
| `loop`     | `boolean` | `true` — El sonido ambiental del enemigo es continuo.                      |
| `autoplay` | `boolean` | `false` — Controlado programáticamente respetando la política de Autoplay. |
| `distance` | `number`  | Equivale a `refDistance`. Volumen máximo antes de la atenuación.           |

### 3.2 Integración en `Enemy.tsx`

**Árbol de Componentes Propuesto:**

```
<RigidBody type="kinematicPosition" ...>
  <CapsuleCollider ... />
  <mesh> {/* Visual del Oportunista */} </mesh>
  <PositionalAudio
    ref={soundRef}
    url="/audio/enemy_growl_loop.ogg"
    loop
    autoplay={false}
    distance={3}
    {/* parámetros de atenuación vía ref o props extendidas */}
  />
</RigidBody>
```

**Control Programático del Playback:**

- Se mantendrá un `soundRef = useRef<PositionalAudio>()` para acceder a la instancia de Drei.
- En el primer frame donde `isAudioUnlocked === true` (comprobado con `useAudioStore.getState()`), se llamará `soundRef.current?.play()` una única vez, usando un flag ref `audioStarted = useRef(false)` para evitar llamadas repetidas.
- Al destruirse el componente (`hp <= 0`, `return null`), el `useEffect` de cleanup llamará `soundRef.current?.stop()`.

### 3.3 Parámetros de Atenuación Acústica

El `PositionalAudio` de Drei expone el `PannerNode` subyacente a través de `soundRef.current.panner`. Los parámetros se configurarán vía `useEffect` al montar el componente:

**`distanceModel`** (`"inverse"` | `"linear"` | `"exponential"`):

- Se usará **`"inverse"`** (Web Audio default). Simula la física acústica real (la intensidad cae con el cuadrado de la distancia), produciendo la atenuación más creíble. Fórmula: `gain = refDistance / (refDistance + rolloffFactor * (distance - refDistance))`.

**`refDistance`** (`number`, recomendado: `3`):

- La distancia en unidades de Three.js a la que el sonido se escucha al **100% de volumen**. Si el jugador está a ≤ 3 metros del Oportunista, lo oirá con toda su fuerza. Sirve como el "radio de cuerpo a cuerpo" sonoro, alineado con el umbral de melee de `<= 1.5m` de la Spec 15.

**`maxDistance`** (`number`, recomendado: `18`):

- La distancia máxima en unidades a partir de la cual el volumen se clampea a su mínimo posible. Para el modelo `"inverse"`, este valor actúa como techo de atenuación. Con la niebla configurada en la `Spec 16` (visible a ~15-20m), fijar `maxDistance` en `18` asegura que el sonido desaparezca junto con la visibilidad del enemigo, creando coherencia audio-visual.

**`rolloffFactor`** (`number`, recomendado: `1.5`):

- Amplifica la velocidad de decaimiento del modelo `"inverse"`. Un valor de `1.0` es física pura; `1.5` hace que el sonido caiga más rápido, aumentando la tensión al alejarse del enemigo.

**Resultado Esperado:** Con estos parámetros, el jugador escuchará respiraciones/gruñidos claramente de 0 a 3 metros, atenuados notablemente de 3 a 12 metros, y apenas perceptibles de 12 a 18 metros, con paneo estéreo automático indicando la dirección aproximada del Oportunista.

---

## 4. Diagrama de Dependencias

```
useAudioStore (isAudioUnlocked, audioBuffers)
    │
    ├── [Desbloqueado por] → Primer click/PointerLock del jugador
    │
    ├── useNarrativeAudio (hook) ←→ useStoryStore (currentSubtitle)
    │       └── Reproduce sfx_glitch cuando hay subtítulo activo
    │
    └── Enemy.tsx
            └── <PositionalAudio> — loop de gruñido 3D
                    ├── soundRef.play() cuando isAudioUnlocked
                    └── Parámetros: distanceModel, refDistance, maxDistance
```

---

## 5. Notas de Implementación y Riesgos

- **`AudioContext` suspendido:** Si el usuario cambia de pestaña, el `AudioContext` puede suspenderse. Three.js lo maneja automáticamente al recuperar el foco, pero se documenta aquí para no interferir con el flag `isAudioUnlocked`.
- **Formato de archivos:** Preferir `.ogg` (Vorbis) por su mayor compresión y soporte universal en Chrome/Firefox. Proveer `.mp3` como fallback solo si Safari es target.
- **Evitar `autoplay={true}` en `<PositionalAudio>`:** El prop autoplay de Drei puede ignorar la política del navegador en algunos builds. Siempre controlar mediante `soundRef.current.play()` desde el callback de desbloqueo.
