/* =========================================================================
   input.js  —  Gestor de entrada (teclado + ratón + botones táctiles)
   Expone acciones lógicas: left, right, jump, shoot, pause, restart.
   Diferencia entre "mantenido" (down) y "pulsado este frame" (pressed).
   ========================================================================= */

class InputManager {
  constructor() {
    this.down = {};      // acción -> booleano (se mantiene mientras se pulsa)
    this.pressed = {};   // acción -> booleano (solo el frame de la pulsación)
    this.onPause = null; // callback opcional para tecla Esc
    this.onRestart = null;

    // Mapa tecla física -> acción lógica
    this.map = {
      ArrowLeft: 'left',  KeyA: 'left',
      ArrowRight:'right', KeyD: 'right',
      ArrowUp:   'jump',  KeyW: 'jump', Space: 'jump',
      KeyJ:      'shoot',
      Escape:    'pause',
      KeyR:      'restart'
    };

    this._bindKeyboard();
  }

  _set(action, value) {
    if (!action) return;
    if (value && !this.down[action]) this.pressed[action] = true;
    this.down[action] = value;
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const action = this.map[e.code];
      if (action) {
        // Evita el scroll de la página con flechas/espacio durante el juego
        if (['left','right','jump','shoot','pause','restart'].includes(action)) e.preventDefault();
        this._set(action, true);
      }
    });
    window.addEventListener('keyup', (e) => {
      const action = this.map[e.code];
      if (action) this._set(action, false);
    });
    // Si la ventana pierde el foco, soltamos todo (evita movimiento "pegado")
    window.addEventListener('blur', () => { this.down = {}; });
  }

  /* Cablea disparo con clic izquierdo sobre el lienzo. */
  bindMouse(canvas) {
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this._set('shoot', true); });
    window.addEventListener('mouseup',   (e) => { if (e.button === 0) this._set('shoot', false); });
  }

  /* Cablea un botón táctil/DOM a una acción. */
  bindButton(el, action) {
    if (!el) return;
    const press   = (e) => { e.preventDefault(); this._set(action, true);  el.classList.add('active'); };
    const release = (e) => { e.preventDefault(); this._set(action, false); el.classList.remove('active'); };
    el.addEventListener('touchstart', press,   { passive: false });
    el.addEventListener('touchend',   release, { passive: false });
    el.addEventListener('touchcancel',release, { passive: false });
    el.addEventListener('mousedown',  press);
    el.addEventListener('mouseup',    release);
    el.addEventListener('mouseleave', release);
  }

  isDown(action)    { return !!this.down[action]; }
  wasPressed(action){ return !!this.pressed[action]; }

  /* Se llama al final de cada frame para limpiar las pulsaciones puntuales. */
  lateUpdate() { this.pressed = {}; }
}
