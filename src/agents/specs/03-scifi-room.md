# Spec 03: Entorno de Pruebas Sci-Fi (Room)

## 1. Diseño y Arquitectura

Se creará un único componente central, alojado en `src/components/environment/SciFiRoom.tsx`. Este componente se encargará de encapsular toda la estructura de la sala base y su iluminación, asegurando una separación modular respecto al estado del `Player` en `page.tsx`.

## 2. Geometría Confinada

Se emplearán componentes nativos de R3F o de Drei (`<Box>`, `<Plane>`) para configurar los límites espaciales, estableciendo que **1 unidad de Three.js equivale a 1 metro**.

- **Suelo y Techo**: Áreas de 20x20 metros. El techo se elevará a un _Y_ de 4 metros.
- **Muros del Perímetro (4)**: Cajas o Planos que bloqueen las salidas en X = ±10 y Z = ±10, encasillando al jugador en primera persona.
- _Anotación_: Esta estructura será la base del `RigidBody` estático o `CuboidCollider` que se creará luego con Rapier.

## 3. Atmosfera de Iluminación y Rendimiento

El entorno reflejará una paleta Sci-Fi oscura.

- **AmbientLight**: Intensidad de 0.1 a 0.2 con tintes azul oscuro (`#0b0f19` o similar) como capa base.
- **PointLights**: 2 o 3 focos asimétricos con colores vibrantes neón (Magenta `#f0f` y Cyan `#0ff`).
- **Garantía de Rendimiento**: Para salvaguardar la cuenta de FPS (DX/UX ágil en browser), evitaremos el abuso de cálculo de sombras computadas (`castShadow`). Únicamente 1 luz de alto contraste (eventualmente la luz de neón focal) calculará propagación, el resto será bakeo pasivo de lúmenes.

## 4. Materialidad (Efecto Neón)

Para elevar la inmersión en la sala de pruebas "Ciudad Furia", se usarán adornos o paneles incrustados empleando el campo emisivo de Three.js:

- Empleo de `<meshStandardMaterial color="#222" emissive="cyan" emissiveIntensity={2} />` en pequeños ductos o franjas en la pared.
- El resto de los ladrillos o suelo utilizarán colores mates o metálicos simples (`metalness={0.7}`) para absorber reflexiones de las `PointLights`.

## 5. Resultado Esperado en el Entorno

Al integrarlo en `page.tsx`, se retirarán las dependencias externas (como `<Sky>` de `drei` y el `<gridHelper>`) devolviéndole al canvas un fondo totalmente oscuro (o de color negro). El jugador aparecerá dentro de la sala y todo el contorno limitará orgánicamente su visión actual.
