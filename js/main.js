/* =========================================================================
   main.js  —  Punto de entrada
   Crea el juego, cablea los botones de todas las pantallas y los controles
   táctiles, y ejecuta el bucle principal con requestAnimationFrame + dt.
   Debe cargarse EL ÚLTIMO (ver orden de <script> en index.html).
   ========================================================================= */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const game = new Game(canvas);

  // El audio necesita un gesto del usuario para arrancar
  const wakeAudio = () => game.audio.init();
  window.addEventListener('keydown', wakeAudio, { once: true });
  window.addEventListener('pointerdown', wakeAudio, { once: true });

  // Disparo con clic sobre el lienzo
  game.input.bindMouse(canvas);

  // Ayudante para cablear un botón por id
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

  // --- Menú principal --------------------------------------------------------
  on('btn-start',    () => { game.audio.init(); game.openLevelSelect(); });
  on('btn-continue', () => { game.audio.init(); game.continueGame(); });
  on('btn-settings', () => game.openSettings());

  // --- Selección de nivel (los botones de nivel los crea ui.js) --------------
  on('btn-ls-back',  () => game.openMenu());

  // --- Ajustes ---------------------------------------------------------------
  on('btn-toggle-sound', () => game.toggleSound());
  on('btn-reset',        () => game.resetProgress());
  on('btn-settings-ok',  () => game.closeSettings());

  // --- Pausa -----------------------------------------------------------------
  on('btn-resume',         () => game.setState(GameState.PLAYING));
  on('btn-resume-2',       () => game.setState(GameState.PLAYING));
  on('btn-pause-restart',  () => game.restartLevel());
  on('btn-pause-settings', () => game.openSettings());
  on('btn-pause-exit',     () => game.openMenu());

  // --- Derrota ---------------------------------------------------------------
  on('btn-go-restart', () => game.restartLevel());
  on('btn-go-menu',    () => game.openLevelSelect());

  // --- Nivel completado ------------------------------------------------------
  on('btn-lc-next', () => game.nextLevel());
  on('btn-lc-menu', () => game.openLevelSelect());

  // --- Victoria --------------------------------------------------------------
  on('btn-vc-menu', () => game.openMenu());

  // --- Botón de pausa flotante del HUD ---------------------------------------
  on('btn-hud-pause', () => game.togglePause());

  // --- Controles táctiles ----------------------------------------------------
  game.input.bindButton(document.getElementById('tc-left'),  'left');
  game.input.bindButton(document.getElementById('tc-right'), 'right');
  game.input.bindButton(document.getElementById('tc-jump'),  'jump');
  game.input.bindButton(document.getElementById('tc-shoot'), 'shoot');

  // --- Bucle principal -------------------------------------------------------
  let last = performance.now();
  function loop(now) {
    let dt = now - last;
    last = now;
    if (dt > 50) dt = 50;      // evita saltos si la pestaña estuvo inactiva
    game.update(dt);
    game.render();
    game.input.lateUpdate();   // limpia las pulsaciones puntuales del frame
    requestAnimationFrame(loop);
  }
  game.ui.syncOverlays();      // muestra el menú inicial
  requestAnimationFrame(loop);

  window.__game = game;        // acceso para depuración en consola
});
