/* =========================================================================
   levels.js  —  Datos de niveles
   Cada nivel: dimensiones del mundo, aparición, plataformas, enemigos,
   coleccionables y meta.

   Enemigos (campo 'type'):  patrol | flyer | chaser | turret | armored
     - 'range' define el radio de patrulla (patrol/armored), la amplitud
       horizontal (flyer) o el radio de detección (chaser). La torreta lo ignora.
   Coleccionables (campo 'type'): crystal (75) | gem (150) | health (+1 vida)
   Compatibilidad: si se omite 'type', el enemigo es patrullero y el
   coleccionable es cristal.
   ========================================================================= */

const LEVELS = [
  // ---------------------------------------------------------------------------
  // NIVEL 1 — Zona de entrenamiento
  // ---------------------------------------------------------------------------
  {
    name: 'Zona de entrenamiento',
    width: 2600,
    height: 540,
    spawn: { x: 70, y: 430 },
    goal:  { x: 2460, y: 396, w: 44, h: 104 },

    platforms: [
      { x: 0,    y: 500, w: 820,  h: 40 },
      { x: 1000, y: 500, w: 1600, h: 40 },
      { x: 300,  y: 400, w: 130,  h: 20 },
      { x: 520,  y: 330, w: 130,  h: 20 },
      { x: 820,  y: 430, w: 170,  h: 20 },
      { x: 1180, y: 400, w: 130,  h: 20 },
      { x: 1440, y: 330, w: 150,  h: 20 },
      { x: 1720, y: 420, w: 130,  h: 20 },
      { x: 2020, y: 380, w: 150,  h: 20 }
    ],

    enemies: [
      { type: 'patrol', x: 1300, y: 470, range: 130 },
      { type: 'flyer',  x: 1900, y: 330, range: 120 }   // primer contacto con voladores
    ],

    pickups: [
      { x: 545,  y: 292, type: 'crystal' },
      { x: 820,  y: 388, type: 'health'  },   // vida junto al pozo
      { x: 1500, y: 292, type: 'gem'     },
      { x: 2070, y: 342, type: 'crystal' }
    ],

    hint: 'A/D o ←→ mover · W/Espacio saltar · J/Clic disparar'
  },

  // ---------------------------------------------------------------------------
  // NIVEL 2 — Ruinas nocturnas (escaparate de tipos de enemigos)
  // ---------------------------------------------------------------------------
  {
    name: 'Ruinas nocturnas',
    width: 3200,
    height: 540,
    spawn: { x: 70, y: 430 },
    goal:  { x: 3080, y: 396, w: 44, h: 104 },

    platforms: [
      { x: 0,    y: 500, w: 620,  h: 40 },   // suelo 1
      { x: 760,  y: 500, w: 900,  h: 40 },   // suelo 2 (tras pozo 1)
      { x: 1820, y: 500, w: 1380, h: 40 },   // suelo 3 (tras pozo 2)
      { x: 280,  y: 410, w: 120,  h: 20 },
      { x: 480,  y: 340, w: 120,  h: 20 },
      { x: 700,  y: 430, w: 120,  h: 20 },   // cruza pozo 1
      { x: 980,  y: 400, w: 130,  h: 20 },
      { x: 1220, y: 340, w: 130,  h: 20 },
      { x: 1460, y: 400, w: 130,  h: 20 },
      { x: 1740, y: 430, w: 120,  h: 20 },   // cruza pozo 2
      { x: 2000, y: 390, w: 140,  h: 20 },
      { x: 2260, y: 330, w: 140,  h: 20 },
      { x: 2520, y: 400, w: 140,  h: 20 },
      { x: 2800, y: 360, w: 140,  h: 20 }
    ],

    enemies: [
      { type: 'patrol',  x: 400,  y: 470, range: 110 },
      { type: 'flyer',   x: 1050, y: 300, range: 150 },
      { type: 'chaser',  x: 1320, y: 340, range: 300 },
      { type: 'armored', x: 1500, y: 464, range: 100 },
      { type: 'turret',  x: 2150, y: 474 },
      { type: 'flyer',   x: 2600, y: 300, range: 160 },
      { type: 'patrol',  x: 2850, y: 470, range: 120 }
    ],

    pickups: [
      { x: 320,  y: 368, type: 'crystal' },
      { x: 520,  y: 300, type: 'crystal' },
      { x: 1000, y: 360, type: 'gem'     },
      { x: 1745, y: 392, type: 'health'  },
      { x: 2280, y: 290, type: 'gem'     },
      { x: 2560, y: 360, type: 'crystal' }
    ],

    hint: 'Voladores, perseguidores, torretas y blindados. ¡Esquiva sus disparos!'
  }

  // Las fases 4-5 añadirán aquí los niveles 3 a 6.
];
