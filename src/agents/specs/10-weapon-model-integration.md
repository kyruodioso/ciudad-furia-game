# 10 - Weapon Model Integration

## 1. Visión General

Esta especificación detalla la integración final del asset 3D artístico para el arma en "Ciudad Furia", marcando el fin de la etapa de Greyboxing para este componente. Nos basaremos en el recién generado componente `<BlasterModel />` para sustituir las primitivas geométricas, preservando la robustez lógica de disparo (hitscan) y Game Feel.

## 2. Requerimientos de Implementación

### 2.1 Reemplazo del Greyboxing en `PlayerHands.tsx`

Actualmente, el arma se renderiza dinámicamente si `hasWeapon` es `true` empleando una combinación de `<cylinderGeometry>` dentro de la malla `rightHandRef`.

- **Eliminación:** Todo el conjunto de cilindros matemáticos debe de-anidarse y ser limpiado.
- **Inyección:** En su lugar, se importará el componente nativo de React generado por `gltfjsx` (`import { BlasterModel } from './BlasterModel'`) y se instanciará.

### 2.2 Ajustes de Transformaciones Relativas (Offsets)

Los modelos 3D exportados rara vez comparten el pivote (Gimbal) y escala correctos de la cámara del Player (First Person HUD).

- **El Grupo Envolvente:** Estrictamente esencial será envolver `<BlasterModel />` dentro de un `<group>` maestro reactivo (donde conectaremos la referencia de recoil `weaponMeshRef`).
- **Transformación de Calibración:** El propio nodo `<BlasterModel />` recibirá parámetros estáticos (`position={[x, y, z]}`, `rotation={[x, y, z]}`, `scale={[s, s, s]}`) destinados única y exclusivamente a alinear el modelo con el campo visual y conector de la mano derecha del usuario. Esta capa de offsets debe permanecer separada de la animación.

### 2.3 Refactorización Topológica del Muzzle Flash

El destello de disparo implementado en la Fase 09 funcionaba con un `PointLight` y un emisor geométrico ubicados en los vértices del modelo greybox.

- **Reubicación:** Estas mallas VFX deben situarse como "Hijos" (`children`) paralelos al `BlasterModel` dentro de nuestro `<group>` animado.
- **Alineación Visual:** Su vector `position` deberá ser calibrado manualmente para anclarse en la malla específica que funja como "boquilla" en el nuevo modelo artístico.
- **Mantener Lógica:** Toda la referencia de desvanecimiento por interpolación matemática (`fireProgress.current`) y anclajes en `useFrame` permanecerán íntegros para alterar el `intensity` del Muzzle Flash sin modificaciones.

## 3. Filosofía de No-Interferencia

- **State Management:** No se tocará el ecosistema Zustand (`usePlayerStore`).
- **Físicas:** No se alterará el hitscan derivado de Rapier (`world.castRay`).
- **Performance:** Evitaremos disparar re-renders al no asociar props mutados de React sobre la jerarquía GLTF, dependiendo estrictamente de la mutación de Refs en el bucle principal.
