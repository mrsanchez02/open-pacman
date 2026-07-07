// render.js
// Dibujo arcade sobre canvas. Usa game.grid (no MAZE) para reflejar dots comidos.

const TILE = 20;
const WALL_COLOR = '#2121ff';
const DOOR_COLOR = '#ffb8ff';
const DOT_COLOR = '#ffb897';
const POWER_PELLET_COLOR = '#ffb897';

function cellCenter( x, y ) {
  return { cx: x * TILE + TILE / 2, cy: y * TILE + TILE / 2 };
}

// Paredes estilo arcade: lineas finas redondeadas que conectan los centros
// de celdas-pared adyacentes. Produce el trazado continuo del original.
function drawWalls( ctx, grid ) {
  const H = grid.length;
  const W = grid[ 0 ].length;
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for ( let y = 0; y < H; y++ ) {
    for ( let x = 0; x < W; x++ ) {
      if ( grid[ y ][ x ] !== 1 ) continue;
      const { cx, cy } = cellCenter( x, y );
      // Conectar solo hacia derecha y abajo evita trazos duplicados.
      if ( x + 1 < W && grid[ y ][ x + 1 ] === 1 ) {
        ctx.moveTo( cx, cy );
        ctx.lineTo( cx + TILE, cy );
      }
      if ( y + 1 < H && grid[ y + 1 ][ x ] === 1 ) {
        ctx.moveTo( cx, cy );
        ctx.lineTo( cx, cy + TILE );
      }
      // Celda-pared aislada (sin vecino): punto corto para que se vea.
      const lone =
        ( x + 1 >= W || grid[ y ][ x + 1 ] !== 1 ) &&
        ( x - 1 < 0 || grid[ y ][ x - 1 ] !== 1 ) &&
        ( y + 1 >= H || grid[ y + 1 ][ x ] !== 1 ) &&
        ( y - 1 < 0 || grid[ y - 1 ][ x ] !== 1 );
      if ( lone ) {
        ctx.moveTo( cx - 3, cy );
        ctx.lineTo( cx + 3, cy );
      }
    }
  }
  ctx.stroke();
}

function drawDoor( ctx, grid ) {
  const H = grid.length;
  const W = grid[ 0 ].length;
  ctx.strokeStyle = DOOR_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for ( let y = 0; y < H; y++ ) {
    for ( let x = 0; x < W; x++ ) {
      if ( grid[ y ][ x ] !== 3 ) continue;
      const px = x * TILE;
      const py = y * TILE + TILE / 2;
      ctx.moveTo( px, py );
      ctx.lineTo( px + TILE, py );
    }
  }
  ctx.stroke();
}

function drawDots( ctx, grid ) {
  ctx.fillStyle = DOT_COLOR;
  for ( let y = 0; y < grid.length; y++ ) {
    for ( let x = 0; x < grid[ 0 ].length; x++ ) {
      if ( grid[ y ][ x ] !== 2 ) continue;
      const { cx, cy } = cellCenter( x, y );
      ctx.beginPath();
      ctx.arc( cx, cy, 2.5, 0, Math.PI * 2 );
      ctx.fill();
    }
  }
}

function drawPowerPellets( ctx, grid, frame ) {
  ctx.fillStyle = POWER_PELLET_COLOR;
  for ( let y = 0; y < grid.length; y++ ) {
    for ( let x = 0; x < grid[ 0 ].length; x++ ) {
      if ( grid[ y ][ x ] !== POWER_PELLET ) continue;
      const { cx, cy } = cellCenter( x, y );
      const pulse = 1 + Math.sin( frame * 0.08 ) * 0.15;
      ctx.beginPath();
      ctx.arc( cx, cy, 6 * pulse, 0, Math.PI * 2 );
      ctx.fill();
    }
  }
}

function drawPacman( ctx, p, frame ) {
  const { cx, cy } = cellCenter( p.x, p.y );
  let rot = 0;
  if ( p.dir === 'right' ) rot = 0;
  else if ( p.dir === 'down' ) rot = Math.PI / 2;
  else if ( p.dir === 'left' ) rot = Math.PI;
  else if ( p.dir === 'up' ) rot = -Math.PI / 2;

  // Boca animada: abre/cierra con el frame.
  const open = ( Math.sin( frame * 0.3 ) * 0.5 + 0.5 ) * 0.28 + 0.02;

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo( cx, cy );
  ctx.arc( cx, cy, TILE / 2 - 1, rot + open * Math.PI, rot - open * Math.PI );
  ctx.closePath();
  ctx.fill();
}

function drawGhost( ctx, g, color, flashing, frame ) {
  const { cx, cy } = cellCenter( g.x, g.y );
  const r = TILE / 2 - 1;
  const bottom = cy + r;
  const left = cx - r;
  const right = cx + r;

  if ( g.frightened ) {
    ctx.fillStyle = ( flashing && Math.floor( frame / 8 ) % 2 === 0 ) ? '#fff' : '#2121ff';
    ctx.beginPath();
    ctx.arc( cx, cy - 1, r, Math.PI, 0, false );
    ctx.lineTo( right, bottom );
    ctx.lineTo( right - r * 0.66, bottom - 4 );
    ctx.lineTo( cx, bottom );
    ctx.lineTo( left + r * 0.66, bottom - 4 );
    ctx.lineTo( left, bottom );
    ctx.closePath();
    ctx.fill();

    // Ojos simples sin direccion (puntos negros)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc( cx - 3.5, cy - 1, 3, 0, Math.PI * 2 );
    ctx.arc( cx + 3.5, cy - 1, 3, 0, Math.PI * 2 );
    ctx.fill();
    ctx.fillStyle = '#0000bb';
    ctx.beginPath();
    ctx.arc( cx - 3.5, cy - 1, 1.5, 0, Math.PI * 2 );
    ctx.arc( cx + 3.5, cy - 1, 1.5, 0, Math.PI * 2 );
    ctx.fill();
    return;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc( cx, cy - 1, r, Math.PI, 0, false ); // cabeza
  ctx.lineTo( right, bottom );
  // falda ondulada (3 picos)
  ctx.lineTo( right - r * 0.66, bottom - 4 );
  ctx.lineTo( cx, bottom );
  ctx.lineTo( left + r * 0.66, bottom - 4 );
  ctx.lineTo( left, bottom );
  ctx.closePath();
  ctx.fill();

  // ojos mirando segun direccion
  const dir = DIRS[ g.dir ] || { x: 0, y: 0 };
  const ex = dir.x * 1.6;
  const ey = dir.y * 1.6;
  for ( const off of [ -3.5, 3.5 ] ) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc( cx + off, cy - 1, 3, 0, Math.PI * 2 );
    ctx.fill();
    ctx.fillStyle = '#0000bb';
    ctx.beginPath();
    ctx.arc( cx + off + ex, cy - 1 + ey, 1.5, 0, Math.PI * 2 );
    ctx.fill();
  }
}

function drawHUD( ctx, game, W ) {
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText( 'SCORE ' + game.score, 8, 4 );
  ctx.textAlign = 'right';
  ctx.fillText( 'VIDAS ' + game.lives, W * TILE - 8, 4 );
}

const GHOST_COLORS = [ '#ff0000', '#ffb8ff', '#00ffff', '#ffb852' ];

const GHOST_LEGEND = [
  { kind: 'hunter',   color: '#ff0000', name: 'Cazador' },
  { kind: 'patrol',   color: '#ffb8ff', name: 'Patrullero' },
  { kind: 'ambusher', color: '#00ffff', name: 'Acechador' },
  { kind: 'erratic',  color: '#ffb852', name: 'Travieso' },
];

function drawLegend( ctx, W, H ) {
  const y = H * TILE + 6;
  ctx.fillStyle = '#fff';
  ctx.font = '11px "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  let x = 8;
  for ( const entry of GHOST_LEGEND ) {
    ctx.fillStyle = entry.color;
    ctx.fillRect( x, y + 2, 10, 10 );
    ctx.fillStyle = '#fff';
    ctx.fillText( entry.name, x + 14, y );
    x += ctx.measureText( entry.name ).width + 30;
  }
}

const LEGEND_H = 30;

function draw( ctx, game, frame ) {
  const grid = game.grid;
  const W = grid[ 0 ].length;
  const H = grid.length;
  const totalH = H * TILE + LEGEND_H;

  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, W * TILE, totalH );

  drawWalls( ctx, grid );
  drawDoor( ctx, grid );
  drawDots( ctx, grid );
  drawPowerPellets( ctx, grid, frame );
  drawPacman( ctx, game.pacman, frame );
  const flashingSoon = game.powerModeTimer > 0 && game.powerModeTimer <= 120;
  game.ghosts.forEach( ( g, i ) => drawGhost( ctx, g, GHOST_COLORS[ i ] || '#ff0000', g.frightened && flashingSoon, frame ) );
  drawHUD( ctx, game, W );
  drawLegend( ctx, W, H );
}

window.draw = draw;
