# Ciudad Furia

> _"En las sombras del neón y el acero, la supervivencia no es una opción, es un instinto."_

**Ciudad Furia** es un trepidante FPS Sci-Fi desarrollado íntegramente para la web. Sumérgete en una experiencia inmersiva de disparos en primera persona directamente en tu navegador, impulsada por físicas deterministas y gráficos con calidad cinematográfica.

---

## Stack Tecnológico

El proyecto está construido sobre un ecosistema moderno y del más alto rendimiento para la web:

- **[Next.js](https://nextjs.org/)**: Framework principal de la aplicación web.
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) (Three.js)**: Motor de renderizado 3D.
- **[Rapier](https://rapier.rs/)**: Motor de físicas 3D para colisiones y cinemáticas del entorno.
- **[Zustand](https://github.com/pmndrs/zustand)**: Sistema de manejo de estado global ligero y reactivo.
- **[@react-three/postprocessing](https://docs.pmnd.rs/react-three-fiber/api/additional-exports)**: Librería para efectos visuales avanzados en tiempo real.

---

## Características Actuales (Core MVP)

- **Movimiento Físico Avanzado**: Sistema de cápsula del jugador gobernado por físicas reales y detección de colisiones del entorno.
- **Sistema de Hitscan (Raycast)**: Detección instantánea de impactos para ataques cuerpo a cuerpo y disparos balísticos.
- **Sistema de Inventario**: Lógica fundamental para recoger objetos e interactuar con el mundo.
- **Game Feel Inmersivo**: Animaciones procedurales de _recoil_ (retroceso) calculadas matemáticamente dentro del loop principal, eliminando caídas de frames por re-renders. Integración de _Muzzle Flash_ reactivos (VFX dinámico) al disparar.
- **Integración de Assets 3D**: Soporte funcional y visualización de modelos tridimensionales complejos en formato estandarizado (`.glb`).
- **Gráficos Cinematográficos**: Pipelines de post-procesado que aplican _Bloom_ envolvente y corrección de color fotorrealista mediante _Tone Mapping_ (ACESFilmic).

---

## Cómo correr el proyecto (Local)

1. Instala las dependencias del proyecto:

   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador preferido.

---

## Próximos Pasos (Roadmap)

- [ ] **IA Enemiga**: Comportamientos de combate, patrullaje y pathfinding en terreno 3D.
- [ ] **Audio Espacial**: Implementación de efectos de sonido inmersivos con posicionamiento 3D referencial.
- [ ] **Interfaz de Usuario (UI)**: HUD de combate, diseño de menú principal y paneles de inventario/ajustes.
