# AGENTS.md — 05-open-pacman

## What this is

Vanilla JS Pac-Man clone on a single Canvas. No build tools, no npm, no tests, no CI. Open `src/index.html` in a browser to run.

## Spec-Driven Development

This project follows spec-driven development using two OpenCode skills:

- `spec` — design a feature spec interactively, saved to `specs/NN-slug.md`
- `spec-impl` — implement an approved spec, step by step with review pauses

Both are installed from `klerith/fernando-skills` (see `skills-lock.json`). The `.agents/skills/` directory has their definitions.

Workflow: `/spec <feature>` → design → save as Draft → manually mark Approved → `/spec-impl <NN-slug>` → implement.

## Architecture

- `src/index.html` — single-page entrypoint; loads scripts via `<script>` tags (no modules, no bundler)
- `src/js/maze.js` — maze data (28×31 grid), tile constants, spawn points; exports globals
- `src/js/game.js` — game state (`createGame`), rules (`update`), movement logic; exports globals
- `src/js/render.js` — canvas drawing; exports `draw`
- `src/js/main.js` — game loop, keyboard input, overlay screens (start/win/lose)
- `src/css/style.css` — styling

**Script load order** in HTML: `maze.js` → `game.js` → `render.js` → `main.js`. Modules communicate through `window.*` globals — never convert to ES modules without updating the load order.

## Conventions

- `game.grid` is a mutable copy of `MAZE` (pristine constant in maze.js). Dots are consumed by mutating grid cells — never mutate `MAZE` directly.
- Tile values: `0` empty, `1` wall, `2` dot, `3` door.
- `specs/` directory may not exist yet — it gets created by the `/spec` skill when saving the first spec.
