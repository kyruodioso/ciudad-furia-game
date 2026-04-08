# Spec 12: Test Dummy System & Interfaz de Daño

## 1. Creación del Componente `TestDummy.tsx`

El propósito de este nuevo elemento interactivo es validar el ciclo completo del combate. Servirá como un saco de boxeo físico que reacciona a los impactos del Hitscan y procesa lógicamente su vida de forma encapsulada.

**Características Físicas y de Renderizado:**

- Se utilizará un `<RigidBody type="dynamic">` para que el impacto del arma se perciba cinéticamente (absorbiendo el impulso que ya aplicamos), pero con rotaciones bloqueadas para evitar que vuelque.
- De forma visual (Greyboxing), optaremos por una geometría básica como `<capsuleGeometry args={[0.5, 1, 16]}>` recubierta con un material estándar (gris oscuro o azul).

**Manejo de Estado Independiente:**

- Cada Dummy controlará su propio ciclo de vida y no ensuciará el estado global de `usePlayerStore`.
- Se instanciará un `useState` local: `const [hp, setHp] = useState(100)`.
- Si el `hp` llega a `0`, se retorna `null` o se oculta el mesh completamente (`return null;`), lo cual automáticamente desmontará sus colliders del mundo de Rapier.

**Feedback Visual Dinámico ("Flash de Daño"):**

- Para un _Game Feel_ responsivo y barato (bajo consumo, **zero re-renders** en el loop), emplearemos una ref (`useRef(0)`) a modo de timer para el "hurt blink".
- A través de un `useFrame`, leeremos este timer. Si es mayor a 0, inyectamos material emisivo rojo. Si es nulo o decae a 0 (restándole el `delta`), restauramos el color normal devolviéndolo a un aspecto estático de forma procesal.

---

## 2. Interfaz de Comunicación (El Puente `userData`)

Para integrar el comportamiento dinámico con el Hitscan del arma (que se calcula en el jugador) usaremos el motor de Rapier.

**1er Extremo: El Contrato en el Test Dummy:**
El collider o directamente el `RigidBody` contendrá este prop clave basado en un closure local:

```tsx
userData={{
  type: 'enemy',
  receiveDamage: (amount: number) => {
    setHp((prev) => Math.max(0, prev - amount));
    // Disparar flag de "Flash Rojo" (ej. damageTimer.current = 0.2)
  }
}}
```

**2do Extremo: Resolución del Raycast en el Jugador:**

- Actualmente, `PlayerHands.tsx` dispara un rayo al presionar un botón del ratón.
- Al impactar a un objeto y comprobar que existe `hit.collider.parent()`, leeremos sus datos: `const ud = rigidBody.userData`.
- Inyectaremos una simple comprobación de duck-typing temporal:
  - `if (ud && ud.type === 'enemy' && ud.receiveDamage) { ... }`
- En caso certero, dictaminaremos un daño crudo (ej: `25` para Blaster, `40` para barra de hierro) y ejecutaremos externamente la función ligada al dummy impactado (`ud.receiveDamage(daño)`).

Esto mantendrá los re-renders herméticos del lado del cliente afectado sin arrastrar componentes masivos del motor.
