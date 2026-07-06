# SPEC 01 — Cuatro fantasmas con comportamientos distintos

> **Status:** Approved
> **Depends on:** None
> **Date:** 2026-07-06
> **Objective:** Incorporar cuatro fantasmas dentro de la pen con liberación escalonada cada 2.5 segundos, comportamientos diferenciados y una leyenda visual mínima para identificar sus roles.

## Scope

**In:**

- 4 fantasmas al inicio de la partida, todos dentro de la pen.
- Liberación automática de un fantasma cada 2.5 segundos desde que empieza la partida o desde el último respawn por pérdida de vida.
- Cuatro comportamientos distintos: Cazador, Acechador, Patrullero y Travieso.
- Cada fantasma tiene un color y nombre latino visibles en una leyenda fuera del canvas.
- Los fantasmas se mueven dentro del área interior de la pen mientras esperan su turno de salida.
- La regla actual de colisión se mantiene: resta una vida, reinicia posiciones, game over si lives <= 0.
- Al perder una vida el contador de liberación vuelve a cero y los fantasmas regresan a la pen.

**Out of scope (para futuros specs):**

- Power Pellets ni estado vulnerable de fantasmas.
- Vidas extra o power-ups de ningún tipo.
- Nuevos niveles, mapas o cambios en el laberinto.
- Persistencia de puntuaciones entre sesiones.
- Modo multijugador.
- Sonidos o música.

## Data model

### maze.js — 4 entradas en GHOST_STARTS y área de la pen

```js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'hunter' },   // Rojo — Cazador
  { x: 14, y: 14, kind: 'patrol' },    // Rosa — Patrullero
  { x: 13, y: 15, kind: 'ambusher' },  // Cian — Acechador
  { x: 14, y: 15, kind: 'erratic' },   // Naranja — Travieso
];

const PEN_INTERIOR = { x1: 11, y1: 13, x2: 16, y2: 15 };
```

### game.js — Nuevas propiedades en createGame()

```js
{
  // ...propiedades existentes,
  ghostReleaseTimer: 0,     // frames desde la última liberación
  ghostQueue: [0, 1, 2, 3], // orden de salida (índices de game.ghosts)
  ghostQueueIndex: 0,        // índice del siguiente en salir
}
```

### Comportamientos de movimiento

| kind | Comportamiento |
|------|----------------|
| `hunter` | Persigue a Pac-Man usando distancia Manhattan (ya existe en game.js). |
| `ambusher` | Apunta 4 celdas adelante en la dirección actual de Pac-Man y persigue ese punto futuro. |
| `patrol` | Alterna cada ~7 segundos entre perseguir a Pac-Man y dirigirse a la esquina superior izquierda del mapa (scatter). |
| `erratic` | 75% elige dirección aleatoria, 25% persigue a Pac-Man como hunter. |

### render.js — Leyenda de colores y nombres

```js
const GHOST_LEGEND = [
  { kind: 'hunter',   color: '#ff0000', name: 'Cazador' },
  { kind: 'patrol',   color: '#ffb8ff', name: 'Patrullero' },
  { kind: 'ambusher', color: '#00ffff', name: 'Acechador' },
  { kind: 'erratic',  color: '#ffb852', name: 'Travieso' },
];
```

La leyenda se dibuja debajo del canvas, los 4 pares color+nombre en una sola línea.

## Implementation plan

1. **Ampliar maze.js.** Agregar las 2 entradas faltantes en `GHOST_STARTS` y la constante `PEN_INTERIOR`. El juego sigue funcionando sin cambios visibles.

2. **Agregar comportamientos faltantes en decideGhost (game.js).** Implementar `ambusher`, `patrol` y `erratic`. Los fantasmas con esos kinds ya se mueven con su lógica propia.

3. **Lógica de pen y liberación en update (game.js).** Añadir `ghostReleaseTimer`, `ghostQueue` y `ghostQueueIndex` a `createGame()`. En `update()`, incrementar el timer y liberar un fantasma cada 150 frames (~2.5s a 60fps). Mientras no ha salido, el fantasma se mueve dentro de `PEN_INTERIOR` sin salir del área.

4. **Reforzar resetPositions.** Al perder una vida, reiniciar los 4 fantasmas dentro de la pen, resetear `ghostReleaseTimer`, `ghostQueueIndex`, y reordenar `ghostQueue` al orden fijo.

5. **Actualizar render.js.** Asignar colores por índice (expandir `GHOST_COLORS` a 4). Nueva función `drawLegend()` debajo del canvas. Llamarla en `draw()`.

6. **Verificación final.** Abrir `src/index.html`, confirmar que salen de 1 en 1 cada 2.5s con el orden correcto y que cada uno se comporta distinto.

## Acceptance criteria

- [ ] Al iniciar una partida, 4 fantasmas aparecen dentro de la pen.
- [ ] Los fantasmas se mueven dentro de la pen mientras esperan su turno.
- [ ] Un fantasma sale de la pen exactamente cada 2.5 segundos.
- [ ] El orden de salida es: Cazador → Patrullero → Acechador → Travieso.
- [ ] Los 4 fantasmas tienen comportamientos de movimiento distinguibles entre sí.
- [ ] Al colisionar con un fantasma se pierde 1 vida, se reinician posiciones (todos a la pen) y el contador vuelve a 0.
- [ ] Al llegar a 0 vidas aparece la pantalla de "PERDISTE".
- [ ] Debajo del canvas se muestra una leyenda con los 4 nombres latinos y sus colores en una sola línea.
- [ ] No hay errores en la consola del navegador.

## Decisions

- **Yes:** Nombres latinos (Cazador, Acechador, Patrullero, Travieso) para mantener coherencia con el idioma del repositorio.
- **Yes:** Orden de liberación fijo Cazador → Patrullero → Acechador → Travieso.
- **Yes:** Movimiento dentro de la pen mientras esperan, para no parecer congelados.
- **No:** Power Pellets / estado vulnerable. Se deja para un spec futuro.
- **Yes:** Leyenda fuera del canvas en lugar de etiquetas sobre cada fantasma, para no sobrecargar visualmente el juego.
- **No:** Persistencia de puntuación. No está en el alcance.

## Identified risks

| Risk | Mitigation |
|------|-----------|
| Los fantasmas dentro de la pen podrían escapar si la IA no respeta el área | La función de movimiento dentro de la pen fuerza los límites de `PEN_INTERIOR` |
| El timer de 2.5s varía con el framerate | Se cuenta en frames a 60fps asumido; ajustable mediante constante si es necesario |

## What is **not** in this spec

- Power Pellets ni fantasmas vulnerables.
- Vidas extra ni power-ups.
- Nuevos niveles o mapas.
- Persistencia entre sesiones.
- Modo multijugador.
- Sonido o música.
