# SPEC 02 — Power Pellets en las 4 esquinas con fantasmas vulnerables

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-07-06
> **Objective:** Incorporar 4 Power Pellets en las esquinas internas del maze para que Pac-Man entre en estado poderoso durante 8 segundos, vuelva vulnerables a los fantasmas y pueda comerlos para enviarlos de regreso a la pen.

## Scope

**In:**

- 4 Power Pellets ubicados en las 4 esquinas internas del maze donde actualmente hay dots: coordenadas exactas (1, 3), (26, 3), (1, 23) y (26, 23).
- Nuevo valor de tile `4` para representar Power Pellets en la matriz.
- Al comer un Power Pellet, Pac-Man entra en estado poderoso durante 480 frames (8 segundos a 60fps).
- Durante el estado poderoso, los fantasmas se vuelven vulnerables: IA de huida (flee) y apariencia visual distinta.
- Si Pac-Man colisiona con un fantasma vulnerable, el fantasma es "comido": suma 200 puntos, regresa a la pen y su `released` vuelve a `false`.
- Si Pac-Man come un segundo Power Pellet con el efecto activo, el temporizador se reinicia a 480 frames.
- Los Power Pellets ya consumidos persisten como consumidos tras perder una vida (misma regla que los dots).
- Los Power Pellets cuentan como dots para la condición de victoria.

**Out of scope (para futuros specs):**

- Otros power-ups (velocidad, vidas extra, etc.).
- Múltiples niveles o cambios en el laberinto.
- Sonidos o música.
- Persistencia entre sesiones.
- Modo multijugador.

## Data model

### maze.js — Nuevo tile y pellets integrados al grid

```js
// Tile values
// 0 empty, 1 wall, 2 dot, 3 door, 4 power pellet
const POWER_PELLET = 4;
```

Las 4 esquinas internas del maze pasan de `2` a `4` en `MAZE_STR` / `MAZE`:

- `(1, 3)`
- `(26, 3)`
- `(1, 23)`
- `(26, 23)`

### game.js — Nuevas propiedades en createGame()

```js
{
  // ...propiedades existentes,
  powerModeTimer: 0,          // frames restantes del estado poderoso
  frightenedChain: 0,         // fantasmas comidos durante el power actual
}
```

### game.js — Nuevas propiedades por fantasma

```js
{
  x,
  y,
  dir,
  speed,
  kind,
  patrolTimer,
  released,
  frightened: false,          // vulnerable por Power Pellet
}
```

### Reglas derivadas del modelo

- `powerModeTimer > 0` significa que Pac-Man sigue en estado poderoso.
- `frightenedChain` se reinicia al comer un Power Pellet nuevo o al terminar `powerModeTimer`.
- Comer un fantasma vulnerable suma `200` puntos fijos. `frightenedChain` solo sirve para saber que el efecto sigue siendo el mismo, no para escalar puntaje.
- Al regresar un fantasma a la pen, vuelve con `released = false` y deja de estar en estado vulnerable.
- Los Power Pellets usan el mismo `game.grid` mutable que ya consume dots normales.

## Implementation plan

1. **Actualizar `maze.js`.** Introducir el tile `4` para Power Pellet y reemplazar los 4 dots de las esquinas internas por pellets en `MAZE_STR`. Verificación manual: el juego sigue cargando sin errores.

2. **Extender el consumo en `game.js`.** Hacer que `movePacman()` reconozca `4` como consumible, sume el puntaje correspondiente, reduzca `dotsRemaining` y active `powerModeTimer = 480`. Si ya había efecto activo, reiniciar el temporizador a 480. Verificación manual: al comer un pellet se activa el estado poderoso durante 8 segundos.

3. **Agregar estado vulnerable a fantasmas.** Extender el estado del juego y de cada fantasma con `powerModeTimer`, `frightenedChain` y `frightened`. Al activarse el Power Pellet, todos los fantasmas liberados fuera de la pen pasan a vulnerables. Al terminar el temporizador, vuelven a su estado normal. Verificación manual: los fantasmas cambian de estado al comer el pellet y se recuperan al terminar el tiempo.

4. **Implementar IA de huida en `decideGhost()`.** Mientras `frightened` sea `true`, el fantasma debe preferir la dirección que aumente la distancia Manhattan respecto de Pac-Man, evitando reversas salvo callejón sin salida. Verificación manual: los fantasmas se alejan visiblemente de Pac-Man durante el efecto.

5. **Cambiar la resolución de colisiones en `update()`.** Si Pac-Man colisiona con un fantasma vulnerable, sumar 200 puntos, devolver ese fantasma a su posición de pen, marcar `released = false`, quitar `frightened` y reinsertarlo en el flujo normal de salida. Si el fantasma no está vulnerable, mantener la regla actual de perder una vida. Verificación manual: una colisión en modo poderoso come al fantasma; una colisión fuera de ese modo quita una vida.

6. **Actualizar `render.js`.** Dibujar Power Pellets visualmente más grandes que un dot normal y aplicar una apariencia vulnerable clara para los fantasmas mientras `frightened` sea `true`. Verificación manual: los 4 pellets se distinguen en el maze y los fantasmas vulnerables se reconocen a simple vista.

7. **Verificación final completa.** Abrir `src/index.html` y comprobar: los 4 pellets están en sus esquinas, activan 8 segundos de poder, los fantasmas huyen, Pac-Man puede comerlos por 200 puntos, los pellets no reaparecen al perder una vida y la partida solo se gana al limpiar dots y pellets.

## Acceptance criteria

- [ ] El juego carga sin errores en la consola del navegador.
- [ ] Existen exactamente 4 Power Pellets en las coordenadas `(1, 3)`, `(26, 3)`, `(1, 23)` y `(26, 23)`.
- [ ] Los Power Pellets se dibujan visualmente distintos a los dots normales.
- [ ] Al comer un Power Pellet, Pac-Man entra en estado poderoso durante 480 frames.
- [ ] Si Pac-Man come otro Power Pellet durante el efecto, el temporizador vuelve a 480 frames.
- [ ] Mientras el efecto está activo, los fantasmas vulnerables cambian su apariencia visual.
- [ ] Mientras el efecto está activo, los fantasmas liberados fuera de la pen intentan alejarse de Pac-Man.
- [ ] Si Pac-Man colisiona con un fantasma vulnerable, suma exactamente 200 puntos.
- [ ] Un fantasma comido vuelve a la pen, deja de estar vulnerable y vuelve a salir con la lógica normal de liberación.
- [ ] Si Pac-Man colisiona con un fantasma no vulnerable, pierde 1 vida y se mantienen las reglas actuales de reinicio.
- [ ] Los Power Pellets ya consumidos no reaparecen al perder una vida.
- [ ] La partida solo se gana cuando no quedan dots ni Power Pellets en `game.grid`.

## Decisions

- **Yes:** La spec incluye tanto la colocación de los 4 Power Pellets como su efecto jugable completo. Un pellet sin efecto quedaría incompleto para esta base.
- **Yes:** Los pellets se ubican en las 4 esquinas internas clásicas del laberinto: `(1, 3)`, `(26, 3)`, `(1, 23)` y `(26, 23)`.
- **Yes:** Los Power Pellets usan un tile nuevo `4` dentro de `MAZE`, en lugar de una lista separada de coordenadas. Esto simplifica consumo, render y conteo en el grid mutable existente.
- **Yes:** La duración del efecto es fija: `480` frames, equivalentes a 8 segundos a 60fps.
- **Yes:** Durante el efecto, los fantasmas cambian colisión, apariencia visual e IA, pasando a modo vulnerable con huida.
- **Yes:** Pac-Man puede comer fantasmas vulnerables y cada uno otorga `200` puntos fijos.
- **Yes:** Si Pac-Man come otro Power Pellet con el efecto activo, el temporizador se reinicia a `480` frames.
- **Yes:** Los Power Pellets consumidos no reaparecen al perder una vida. Siguen la misma regla de persistencia intra-partida que los dots.
- **Yes:** Los Power Pellets cuentan para la condición de victoria, igual que los dots normales.
- **No:** Escalado clásico de puntaje `200/400/800/1600`. Se descarta para mantener la implementación simple en esta etapa.
- **No:** Nuevos power-ups, vidas extra o efectos secundarios sobre Pac-Man. Quedan fuera del alcance de esta spec.
- **No:** Persistencia entre sesiones. No es necesaria para esta mecánica.

## Identified risks

| Risk | Mitigation |
|------|-----------|
| La huida de los fantasmas puede sentirse errática o quedarse atrapada en giros pobres | La lógica frightened debe maximizar distancia Manhattan respecto de Pac-Man, permitiendo reversa solo en callejón sin salida |
| Un fantasma comido podría reingresar mal al flujo de salida escalonada | Al devolverlo a la pen se debe resetear su estado vulnerable y dejarlo otra vez bajo la lógica existente de `released = false` y liberación normal |
| El temporizador de 8 segundos depende del framerate asumido | La spec fija `480` frames a 60fps como convención del proyecto; si luego cambia el loop, esa conversión deberá revisarse en otra spec |
| Contar pellets como dots para la victoria puede romper el conteo si no se integran bien al `dotsRemaining` | El tile `4` debe descontarse del mismo contador de consumibles y verificarse manualmente al limpiar todo el mapa |

## What is **not** in this spec

- Nuevos power-ups distintos de los 4 Power Pellets.
- Vidas extra o bonus adicionales por rachas de fantasmas.
- Escalado clásico de puntaje por fantasmas (`200/400/800/1600`).
- Nuevos niveles, mapas o cambios de geometría del laberinto.
- Persistencia entre sesiones.
- Sonidos o música.
- Modo multijugador.

Cada uno de esos puntos, si se quisiera agregar después, debe ir en su propia spec.
