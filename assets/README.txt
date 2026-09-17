CARPETA DE RECURSOS — Midnight Bloom
=====================================

En la Fase 1 TODOS los gráficos y sonidos se generan por código
(Canvas + Web Audio API), así que esta carpeta está vacía a propósito.

Estructura sugerida para añadir recursos en fases posteriores:

  assets/
    sprites/      -> imágenes PNG del personaje, enemigos, tiles...
    sfx/          -> efectos de sonido (.wav / .ogg)
    music/        -> pistas de música (.mp3 / .ogg)
    fonts/        -> fuentes locales (por si no se usa la de Google)

CÓMO AÑADIR UN SPRITE (ejemplo futuro):
  1) Guarda la imagen en assets/sprites/player.png
  2) En player.js, carga la imagen:
        this.img = new Image();
        this.img.src = 'assets/sprites/player.png';
  3) En draw(), sustituye los rectángulos por:
        ctx.drawImage(this.img, sx, sy, sw, sh, 0, 0, this.w, this.h);

CÓMO AÑADIR UN SONIDO (ejemplo futuro):
  1) Guarda el archivo en assets/sfx/shoot.wav
  2) En audio.js usa loadSample() (ya preparado) para decodificarlo.
  3) Reprodúcelo creando un BufferSource conectado al nodo master.

IMPORTANTE: para cargar imágenes/sonidos externos hace falta servir el
juego por HTTP (ver instrucciones del README), no abrirlo con file://,
porque el navegador bloquea fetch() de archivos locales por seguridad.
