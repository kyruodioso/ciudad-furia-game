# Spec 16: Atmósfera y Diseño de Nivel (Vertical Slice)

## 1. Componente `Atmosphere.tsx`

Establece la narrativa visual "Blackout" del Conurbano empleando post-revestimiento climático en React Three Fiber sin saturar pipelines externos, construyendo una opresión focal sobre el jugador.

**La Niebla y Velo Visual:**

- Se inyectará estáticamente sobre la raíz un nodo directo `<fogExp2 attach="fog" args={['#0a0a10', 0.05]} />`. Esta densidad exponencial fuerza una reducción de visibilidad inmediata hacia al frente, encajonando los enfrentamientos a corto alcance (obligatorio) y fusionando el límite del canvas con el fondo del DOM.
- **Set Base de Luz Global:**
  - Ambientes infimos: `<ambientLight intensity={0.1} color="#0d111a" />`. (La oscuridad absoluta impide ver la propia geometría para greyboxing total, así que elevamos sutilmente un Navy Blue post-atardecer).
  - Pálido direccional: `<directionalLight position={[10, 20, 5]} intensity={0.2} color="#1f2335" />` imitando un resplandor lunar opaco.

**Luz de Poste Parpadeante (Flickering Light - Zero Re-renders):**

- Será un sub-componente envuelto sobre un `<pointLight ref={lightRef} />` que servirá de guía focal / punto de salvado / emboscada en el mapa, irradiando tonos naranjas o fríos artificiales.
- Su temblor errático residirá encapsulado en `useFrame`:
  - Se calculará bajo probabilidades rotas (ej., `const isFlickering = Math.random() > 0.9`).
  - La intensidad nativa del objeto subyacente parpadeará (`lightRef.current.intensity = isFlickering ? 0.1 : 15.0`) o bien usando decaimientos matemáticos basados en Noise/Seno, esquivando por completo las funciones setter elementales de estado local de React, manteniendo la mutación pura en la GPU/Webgl.

## 2. Componente `LevelBlock.tsx` (Greyboxing del Entorno)

Construye el tramo fundacional pisable para los actores que implementamos (Jugador, Dummy, Oportunista, Mascota).

**Suelo Asfáltico:**

- Instancia física masiva estática `RigidBody type="fixed"` anclando el centro de la habitación.
- Geometría representacional atada a su hijo `<Plane args={[50, 50]}>` pivotando el `-Math.PI / 2` contra el eje X, emulando la calzada inexplorada de alta rugosidad y bajo brillo metálico.

**Mobiliario Urbano Abandonado (Barricadas):**

- Inyección de escombros de colisión. Ej. Paralelepípedos o bloques masivos de proporciones `args={[4, 1.5, 2]}` (representación temporal de sedanes abandonados o muros).
- Poseen cuerpo fijo (`type="fixed"`) para forzar que el Pathfinding Kinemático del Oportunista y de la mascota sorteen visualmente (o se adapten mecánicamente) los cuellos de botella geográficos formados en el set de luces de los postes rotos.
