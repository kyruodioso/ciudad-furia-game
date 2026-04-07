# Spec 07: Sistema de Loot / Recogida de Armas (Greyboxing)

## 1. Estado Global del Inventario (Zustand)

Actualmente el `usePlayerStore` (ubicado en `src/store/usePlayerStore.ts`) gestiona la velocidad tridimensional del vector.
Se extenderá este almacén global para administrar el equipamiento armado:

- Variable: `hasWeapon: boolean` (inicialmente `false`).
- Acción: `equipWeapon: () => void`.
  Este estado en Zustand se convertirá en la fuente central de la verdad para inyectar modelos en el HUD 3D.

## 2. El Componente Interactivo (Weapon Drop / Loot)

Se encapsulará y materializará la presencia cruda del arma en el mapa creando `src/components/environment/WeaponPickup.tsx`.

- **Geometría y Material**: Siguiendo la filosofía funcional de _Greyboxing_, consistirá en un `<mesh>` ortogonal (ej. `boxGeometry args={[1, 0.2, 0.4]}`) exhibiendo un color llamativo fosforescente (ej: `emissive="#00ffcc"` puro) para indicar claramente al jugador que el objeto ostenta la categoría de "Ítem Importante".
- **Físicas y Registro Rapier**: Estará abrazado por un `<RigidBody type="kinematicPosition" colliders="cuboid" sensor>`. Al configurarlo como sensor, no estorbará físicamente la caminata del jugador, pero reaccionará al sistema de disparo.
- **La Metadata Semántica**: El puente comunicativo maestro radica en la propiedad nativa de R3F Rapier: **`userData={{ type: 'pickup', item: 'blaster' }}`**. Dicha firma semántica se imprimirá en el RigidBody para que el hitscan determine lógicamente sus intenciones en microsegundos.

## 3. Evolución Lógica del Hitscan

Nos inmiscuiremos en el `onPointerDown` algorítmico existente dentro de `PlayerHands.tsx`.
Al perpetuarse el `castRay` y confirmarse contacto en el mundo físico, se inspeccionará matemáticamente el objeto retornado: `rigidBody.userData`.

- **Bifurcación Lógica**: Si el objeto confiesa `type === 'pickup'`, abortaremos agresivamente el cálculo inercial de la simulación (`applyImpulse`).
- **El Evento de Extracción**: Invocaremos en estado reactivo al `equipWeapon()` del Store. Paralelamente, despacharemos una señal de limpieza (el Objeto interceptado mutará su propio estado Reactivo interno para ocultarse o auto-destruirse (`null`) y así borrarse geográficamente del Canvas en perpetuidad).

## 4. Evolución del HUD (El Modificador de Armado)

Dentro de la cúpula arquitectónica de `PlayerHands.tsx`, leeremos explícitamente `usePlayerStore(s => s.hasWeapon)`.
Considerando que la adquisición del arma primaria constituye un hito inefable y aislado, la mutación forzosa del VDOM interno (React Update) se considera asintóticamente óptima y segura.

- Si `hasWeapon === true`, a la malla conectada de la _Mano Derecha_, se le anidará jerárquicamente un componente de extensión primitiva (`cylinderGeometry` simulando ser un cañón tubular oscuro). Como el brazo ya oscila inercialmente ($idle\ bobbing$) y hereda matemática posicional animada, el arma ensamblada adquirirá este motor biomagnético automáticamente.
