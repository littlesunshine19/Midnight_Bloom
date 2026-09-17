/* =========================================================================
   ui.js  —  Interfaz: HUD en el lienzo + gestión de overlays DOM
   - HUD (vida, puntuación, nivel, cristales, arma) pintado sobre el canvas.
   - Overlays HTML (menú, selección de nivel, ajustes, pausa, derrota,
     nivel completado, victoria) mostrados/ocultados según el estado.
   - Botones de selección de nivel generados dinámicamente con su estado
     de bloqueo, y sincronización de textos (puntuación, sonido).
   ========================================================================= */

class UI {
  constructor(game) {
    this.game = game;
    // Referencias a los overlays DOM por estado
    this.overlays = {
      [GameState.MENU]:           document.getElementById('overlay-menu'),
      [GameState.LEVEL_SELECT]:   document.getElementById('overlay-levelselect'),
      [GameState.SETTINGS]:       document.getElementById('overlay-settings'),
      [GameState.PAUSED]:         document.getElementById('overlay-pause'),
      [GameState.GAME_OVER]:      document.getElementById('overlay-gameover'),
      [GameState.LEVEL_COMPLETE]: document.getElementById('overlay-complete'),
      [GameState.VICTORY]:        document.getElementById('overlay-victory')
    };
    this.hintTimer = 0;
    this.hintText = '';
  }

  showHint(text) { this.hintText = text; this.hintTimer = 4000; }

  // Muestra el overlay del estado actual y actualiza contenidos dinámicos
  syncOverlays() {
    const state = this.game.state;

    for (const key in this.overlays) {
      const el = this.overlays[key];
      if (el) el.classList.toggle('hidden', key !== state);
    }

    // El botón de pausa y los controles táctiles solo existen jugando
    document.body.classList.toggle('state-playing', state === GameState.PLAYING);

    // Textos de puntuación en las pantallas de resultado
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const s = this.game.score, b = this.game.bestScore;
    set('go-score', s); set('go-best', b);
    set('vc-score', s); set('vc-best', b);
    set('lc-score', s);
    set('st-best', b);

    if (state === GameState.LEVEL_SELECT) this._buildLevelButtons();
    if (state === GameState.SETTINGS)     this._updateSettings();
  }

  // --- Pantalla de selección de nivel ---------------------------------------
  _buildLevelButtons() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < CONFIG.totalLevels; i++) {
      const hasData    = i < LEVELS.length;      // nivel implementado
      const unlockedOk = i <= this.game.unlocked; // desbloqueado por progreso
      const available  = hasData && unlockedOk;

      const card = document.createElement('button');
      card.className = 'level-card' + (available ? '' : ' locked');

      const num  = document.createElement('span');
      num.className = 'level-num';
      num.textContent = String(i + 1).padStart(2, '0');

      const name = document.createElement('span');
      name.className = 'level-name';
      name.textContent = hasData ? (LEVEL_NAMES[i] || ('Nivel ' + (i + 1)))
                                 : 'PRÓXIMAMENTE';

      const tag = document.createElement('span');
      tag.className = 'level-tag';
      tag.textContent = available ? '▶ JUGAR' : (hasData ? '🔒 BLOQUEADO' : '· · ·');

      card.appendChild(num);
      card.appendChild(name);
      card.appendChild(tag);

      if (available) {
        card.addEventListener('click', () => { this.game.audio.init(); this.game.selectLevel(i); });
      } else {
        card.disabled = true;
      }
      grid.appendChild(card);
    }
  }

  // --- Pantalla de ajustes ---------------------------------------------------
  _updateSettings() {
    const btn = document.getElementById('btn-toggle-sound');
    if (btn) {
      const on = this.game.settings.sound;
      btn.textContent = 'SONIDO: ' + (on ? 'ON' : 'OFF');
      btn.classList.toggle('off', !on);
    }
  }

  // --- HUD sobre el lienzo ---------------------------------------------------
  drawHUD(ctx) {
    const g = this.game;
    ctx.save();
    ctx.textBaseline = 'top';

    // Panel superior
    ctx.fillStyle = 'rgba(1,22,56,0.72)';
    ctx.fillRect(0, 0, CONFIG.viewWidth, 46);
    ctx.fillStyle = PALETTE.purple;
    ctx.fillRect(0, 46, CONFIG.viewWidth, 3);

    // Vida (cristales)
    for (let i = 0; i < CONFIG.playerMaxHealth; i++) {
      const on = i < g.player.health;
      ctx.fillStyle = on ? PALETTE.mauve : PALETTE.violet;
      const hx = 14 + i * 24, hy = 13;
      ctx.beginPath();
      ctx.moveTo(hx + 8, hy);
      ctx.lineTo(hx + 16, hy + 10);
      ctx.lineTo(hx + 8, hy + 20);
      ctx.lineTo(hx, hy + 10);
      ctx.closePath();
      ctx.fill();
      if (on) { ctx.fillStyle = PALETTE.blush; ctx.fillRect(hx + 5, hy + 5, 3, 3); }
    }

    // Puntuación, nivel y cristales
    this._text(ctx, 'PUNTOS ' + g.score, CONFIG.viewWidth / 2, 15, PALETTE.blush, 'center', 12);
    this._text(ctx, 'NIVEL ' + (g.levelIndex + 1), CONFIG.viewWidth - 150, 15, PALETTE.blush, 'left', 12);
    this._text(ctx, '✦ ' + g.collected + '/' + g.totalPickups, CONFIG.viewWidth - 150, 30, PALETTE.mauve, 'left', 10);

    // Barra de enfriamiento del arma
    const cd = Utils.clamp(1 - g.player.shootTimer / CONFIG.shootCooldown, 0, 1);
    const bx = 14, by = CONFIG.viewHeight - 30, bw = 160, bh = 14;
    ctx.fillStyle = PALETTE.violet; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = cd >= 1 ? PALETTE.blush : PALETTE.purple;
    ctx.fillRect(bx, by, bw * cd, bh);
    ctx.strokeStyle = PALETTE.midnight; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    this._text(ctx, cd >= 1 ? 'ARMA LISTA' : 'CARGANDO', bx, by - 16, PALETTE.blush, 'left', 9);

    // Sugerencia inicial del nivel
    if (this.hintTimer > 0) {
      const alpha = Utils.clamp(this.hintTimer / 1000, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(46,41,78,0.85)';
      ctx.fillRect(CONFIG.viewWidth / 2 - 320, 60, 640, 34);
      this._text(ctx, this.hintText, CONFIG.viewWidth / 2, 70, PALETTE.blush, 'center', 10);
      ctx.globalAlpha = 1;
    }

    // Indicador de PAUSA sobre el juego
    if (g.state === GameState.PAUSED) {
      ctx.fillStyle = 'rgba(1,22,56,0.35)';
      ctx.fillRect(0, 0, CONFIG.viewWidth, CONFIG.viewHeight);
    }

    ctx.restore();
  }

  updateHUD(dt) { if (this.hintTimer > 0) this.hintTimer -= dt; }

  _text(ctx, txt, x, y, color, align = 'left', size = 12) {
    ctx.font = size + 'px "Press Start 2P", monospace';
    ctx.textAlign = align;
    ctx.fillStyle = PALETTE.midnight;
    ctx.fillText(txt, x + 1, y + 1); // sombra
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }
}
