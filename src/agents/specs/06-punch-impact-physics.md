# Spec 06: Físicas de Impacto y Dummies (Hitscan Base)

## 1. Entidades Dinámicas (Cajas Sci-Fi)

Se aislará un código modular puro en `src/components/environment/PhysicsBox.tsx`.

- **Física**: Constará de un `<RigidBody type="dynamic" colliders="cuboid">`. Incorporará una masa estándar (ej. `mass={10}`) para que reaccione físicamente a los embates en solitario o en cadena.
- **Estética Excesiva**: Una geometría cúbica (`<boxGeometry args={[1, 1, 1]} />`) cubierta con un material contrastante (tonos anaranjados vívidos de advertencia `#ff5500` con `roughness` bajo y `metalness` alto) para encajar lógicamente en una zona de carga de Ciudad Furia.

## 2. Refactorización de la Sala (Test Dummies)

Se expandirá el interior estático de `src/components/environment/SciFiRoom.tsx` importando este nuevo componente.

- Se posicionarán de 3 a 5 instancias de `<PhysicsBox />` una encima de la otra construyendo un muro o torre precaria en una de las esquinas. Al cargar el nivel, Rapier resolverá la gravedad haciéndolas descansar orgánicamente.

## 3. Lógica Hitscan Óptima (Raycasting Vectorial)

Para maximizar el rendimiento por encima de `colliders` pegados erróneamente a los nudillos que ahoguen la CPU por cruce continuo, utilizaremos el estándar FPS competitivo global: **El Hitscan Instantáneo**.

- **Motor Rapier Puro**: En el archivo `PlayerHands.tsx`, se inyectará el ecosistema con `const { rapier, world } = useRapier()`.
- **Desacoplo del Loop**: El chequeo analítico del Raycaster se encapsulará **exclusivamente** dentro de la función interceptadora de la ventana (`handlePointerDown`), desligándolo 100% del destructivo `useFrame`.
- **Proyección Euclidiana**: Al detonar el clic, se creará un rayo matemático originado céntricamente en la cámara actual y propulsado hacia adelante con `camera.getWorldDirection`. (El objeto puro `new rapier.Ray(origen, direccion)`).

## 4. Rango, Fuerza y Despido Analítico

Se ejecutará el disparo de chequeo inmediato llamando al colisionador maestro `world.castRay(ray, MAX_DISTANCE, true)`.

- **Escalabilidad de Rango**: Tendremos predefinida la constante de alcance cuerpo a cuerpo en 2.0 metros. Al pasar a armas, ese mismo algoritmo admitirá valores de más de 100.0 devolviendo precisión geométrica perfecta.
- **El Impacto Fáctico (`applyImpulseAtPoint`)**: Si se devela que el rayo impactó una malla, y el colisionador de la malla tiene un cuerpo padre real asociable, se le suministrará un vector de choque contundente. El choque igualará la dirección de la cámara _más un levísimo empujón al eje +Y_ simulando la violencia cinética de un _uppercut_ ascendente. Los dummies colapsarán en cascada dinámica.
