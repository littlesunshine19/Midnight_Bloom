/* =========================================================================
   config.js  —  Constantes globales del juego "Midnight Bloom"
   Paleta, ajustes de física/dificultad, estados y datos de presentación.
   Estas variables son globales (script clásico) y las usan los demás módulos.
   ========================================================================= */

// --- Paleta "Midnight Bloom" -------------------------------------------------
const PALETTE = {
  midnight: '#011638', // azul medianoche profundo (fondos, contornos)
  violet:   '#2E294E', // azul violáceo oscuro (sombras, zonas oscuras)
  purple:   '#9055A2', // púrpura (enemigos, sombras del personaje)
  mauve:    '#D499B9', // rosa malva (cuerpo del personaje)
  blush:    '#E8C1C5', // rosa pálido (luces, detalles, destellos)
  black:    '#02010A'  // casi negro derivado (para el vacío)
};

// --- Ajustes de física y jugabilidad (todo configurable) ---------------------
const CONFIG = {
  // Resolución interna del lienzo (se escala por CSS manteniendo proporción)
  viewWidth:  960,
  viewHeight: 540,

  // Física del jugador (pensada para ~60 fps; se normaliza por deltaTime)
  gravity:       0.62,
  moveSpeed:     3.4,
  jumpForce:     12.6,
  maxFallSpeed:  15,
  airControl:    0.85,

  // Arma del jugador
  bulletSpeed:   9,
  shootCooldown: 240,  // milisegundos entre disparos
  bulletLife:    1400, // ms de vida de la bala

  // Proyectiles enemigos
  enemyBulletSpeed: 3.9,
  enemyBulletLife:  3200, // ms de vida del proyectil enemigo

  // Jugador
  playerMaxHealth: 5,
  invulnTime:      1100, // ms de invulnerabilidad tras recibir daño

  // Puntuaciones
  scoreEnemy:  100,
  scorePickup: 75,   // cristal
  scoreGem:    150,  // gema
  scoreGoal:   500,

  // Número total de niveles previstos (para la pantalla de selección).
  // Los niveles 2-6 se implementarán en la Fase 4; hasta entonces aparecen
  // como "PRÓXIMAMENTE" y no son seleccionables.
  totalLevels: 6
};

// --- Estados del juego (máquina de estados) ----------------------------------
const GameState = {
  MENU:           'MENU',
  LEVEL_SELECT:   'LEVEL_SELECT',
  SETTINGS:       'SETTINGS',
  PLAYING:        'PLAYING',
  PAUSED:         'PAUSED',
  GAME_OVER:      'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  VICTORY:        'VICTORY'
};

// --- Nombres de los niveles (para la pantalla de selección) ------------------
const LEVEL_NAMES = [
  'Zona de entrenamiento',
  'Ruinas nocturnas',
  'Base orbital',
  'Ciudad de neón',
  'Núcleo de energía',
  'Fortaleza del vacío'
];

// --- Utilidades matemáticas --------------------------------------------------
const Utils = {
  clamp(v, min, max) { return v < min ? min : (v > max ? max : v); },
  rand(min, max)     { return min + Math.random() * (max - min); },
  // Colisión AABB (rectángulo vs rectángulo)
  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }
};
