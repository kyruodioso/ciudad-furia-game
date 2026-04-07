# AGENT.md - Pacto de Inteligencia Artificial & Guardián Arquitectónico

## 1. Stack Tecnológico Estricto

- **Framework Core**: Next.js (App Router) y React.
- **Gráficos 3D**: Three.js vía React Three Fiber (R3F) y el ecosistema de `@react-three/drei`.
- **Estándar de Estilos**: TailwindCSS.
- **Manejo de Estado**: Zustand.

## 2. Metodología: Spec-Driven Development (SDD)

- **CERO Improvisación**: Ninguna feature (lógica de juego, nuevo componente, integraciones complejas) se codificará en la base del código principal sin haber sido antes especificada, diseñada y aprobada por el Human Gate.
- Los documentos arquitectónicos viven en `src/agents/specs/` con numeración y manifiesto.

## 3. Arquitectura Orientada a Componentes (Punto Focal en R3F)

- Máxima modularización siguiendo la "Arquitectura Orientada a Componentes" nativa e impulsada por React Tree.
- **Separación Lógica vs Vista**:
  - Los componentes visuales (Meshes, Geometrias) deben mantenerse tontos ("dumb"), solo consumiendo las propiedades físicas o referencias puras necesarias.
  - La lógica (físicas, controles) debe encapsularse en Custom Hooks y bucles R3F independientes.

## 4. Rendimiento con Zustand (Evitar Re-renders)

- **PROHIBIDO**: Usar estados reactivos tradicionales (`useState`, `useReducer`, o el Context API de React) para valores de frecuencia ultra-alta como controles de ratón/teclado, físicas, o la posición de la cámara del First-Person. Re-renderizar el R3F canvas por estas minucias destruirá el frame rate.
- **USO OBLIGATORIO**: Transiciones "Transient" de Zustand.
  - Suscripción directa mutada en el game loop de Three.js (e.g., usar `store.getState()` en la capa `useFrame`).

## 5. El "Cimiento de Hierro" (Quality Assurance)

- El repositorio está blindado localmente antes de cada push publicable.
- Todos los commits están obligados a seguir el formato de "Conventional Commits" verificados por Husky y Commitlint.
- Código no formateado o con errores explícitos denegará el commit gracias a Lint-staged.
- A medida que pasemos de milestones, no se permitirán PR ni merge de código sin la suite de _pruebas críticas_ correspondientes aprobadas.
