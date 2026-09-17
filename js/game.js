/* =========================================================================
   game.js  —  Motor del juego "Midnight Bloom"
   Clase Game: máquina de estados (menú, selección de nivel, ajustes, juego,
   pausa, derrota, nivel completado, victoria), carga de niveles, física de
   alto nivel, cámara lateral con clamp, fondo con paralaje, partículas,
   puntuación, progreso desbloqueado y ajustes en localStorage.
   ========================================================================= */

// --- Partícula simple para efectos visuales ----------------------------------
class Particle {
  constructor(x, y, color, speed) {
    this.x = x; this.y = y;
    const a = Math.random() * Math.PI * 2;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed - 1;
    this.life = Utils.rand(300, 650);
    this.maxLife = this.life;
    this.size = Utils.rand(2, 4);
    this.color = color;
  }
  update(f, dt) {
    this.x += this.vx * f;
    this.y += this.vy * f;
    this.vy += 0.15 * f;
    this.life -= dt;
  }
  draw(ctx) {
    ctx.globalAlpha = Utils.clamp(this.life / this.maxLife, 0, 1);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }
  get dead() { return this.life <= 0; }
}

// --- Juego -------------------------------------------------------------------
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.state = GameState.MENU;
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.ui = new UI(this);

    this.camera = { x: 0, y: 0 };
    this.shakeAmount = 0;
    this.levelIndex = 0;
    this.score = 0;

    // Progreso persistente
    this.bestScore = this._loadNum('mb_best', 0);
    this.unlocked  = this._loadNum('mb_unlocked', 0);   // índice máximo desbloqueado
    this.lastLevel = this._loadNum('mb_last', 0);       // último nivel jugado (CONTINUE)

    // Ajustes persistentes
    this.settings = { sound: this._loadNum('mb_sound', 1) === 1 };
    this.audio.enabled = this.settings.sound;
    this.settingsReturn = GameState.MENU;               // estado al cerrar ajustes

    // Estrellas del fondo (paralaje) generadas una vez
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * 1600,
        y: Math.random() * 400,
        r: Math.random() < 0.8 ? 1 : 2,
        layer: Math.random() < 0.5 ? 0.25 : 0.5,
        tw: Math.random() * Math.PI * 2
      });
    }
    this.time = 0;

    this._resetLevelState();
  }

  _resetLevelState() {
    this.player = null;
    this.platforms = [];
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.pickups = [];
    this.particles = [];
    this.goal = null;
    this.worldWidth = CONFIG.viewWidth;
    this.worldHeight = CONFIG.viewHeight;
    this.collected = 0;
    this.totalPickups = 0;
  }

  // --- Máquina de estados ----------------------------------------------------
  setState(s) {
    this.state = s;
    this.ui.syncOverlays();
  }

  // Navegación de menús
  openMenu()        { this.setState(GameState.MENU); }
  openLevelSelect() { this.setState(GameState.LEVEL_SELECT); }
  openSettings()    { this.settingsReturn = this.state; this.setState(GameState.SETTINGS); }
  closeSettings()   { this.setState(this.settingsReturn || GameState.MENU); }

  // Selecciona un nivel desde la pantalla de selección (partida nueva del nivel)
  selectLevel(i) {
    if (i < 0 || i >= LEVELS.length) return; // sin datos: aún no implementado
    if (i > this.unlocked) return;           // bloqueado
    this.score = 0;
    this.loadLevel(i);
    this.lastLevel = i; this._saveNum('mb_last', i);
    this.setState(GameState.PLAYING);
  }

  // Continúa desde el último nivel jugado (o el primero)
  continueGame() {
    const i = Utils.clamp(Math.min(this.lastLevel, this.unlocked), 0, LEVELS.length - 1);
    this.selectLevel(i);
  }

  loadLevel(i) {
    this._resetLevelState();
    const data = LEVELS[i];
    this.levelIndex = i;
    this.worldWidth = data.width;
    this.worldHeight = data.height;
    this.platforms = data.platforms.map(p => ({ ...p }));
    this.player = new Player(data.spawn.x, data.spawn.y, this);
    this.spawn = { ...data.spawn };
    this.enemies = (data.enemies || []).map(e => this._createEnemy(e));
    this.pickups = (data.pickups || []).map(p => ({
      x: p.x, y: p.y, w: 20, h: 20, taken: false, t: Math.random() * 6,
      type: p.type || 'crystal'   // 'crystal' | 'gem' | 'health'
    }));
    // El contador del HUD solo cuenta coleccionables (no las vidas)
    this.totalPickups = this.pickups.filter(p => p.type !== 'health').length;
    this.goal = { ...data.goal, t: 0 };
    this.camera.x = 0; this.camera.y = 0;
    this.ui.showHint(data.hint || '');
  }

  // Fábrica de enemigos según el campo 'type' de los datos del nivel.
  // Compatible con niveles antiguos: sin type -> patrullero.
  _createEnemy(e) {
    switch (e.type) {
      case 'flyer':   return new FlyerEnemy(e.x, e.y, this, e.range);
      case 'chaser':  return new ChaserEnemy(e.x, e.y, this, e.range);
      case 'turret':  return new TurretEnemy(e.x, e.y, this);
      case 'armored': return new ArmoredEnemy(e.x, e.y, this, e.range);
      case 'patrol':
      default:        return new PatrolEnemy(e.x, e.y, this, e.range);
    }
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.setState(GameState.PLAYING);
  }

  // Avanza al siguiente nivel (conserva la puntuación de la partida en curso)
  nextLevel() {
    const nxt = this.levelIndex + 1;
    if (nxt < LEVELS.length) {
      this.loadLevel(nxt);
      this.lastLevel = nxt; this._saveNum('mb_last', nxt);
      this.setState(GameState.PLAYING);
    } else {
      this._saveBest();
      this.setState(GameState.VICTORY); // no hay más niveles implementados
    }
  }

  togglePause() {
    if (this.state === GameState.PLAYING) this.setState(GameState.PAUSED);
    else if (this.state === GameState.PAUSED) this.setState(GameState.PLAYING);
  }

  // --- Ajustes / progreso ----------------------------------------------------
  toggleSound() {
    this.settings.sound = !this.settings.sound;
    this.audio.enabled = this.settings.sound;
    this._saveNum('mb_sound', this.settings.sound ? 1 : 0);
    if (this.settings.sound) this.audio.pickup(); // pequeña confirmación audible
    this.ui.syncOverlays();
  }

  resetProgress() {
    this.unlocked = 0; this.lastLevel = 0; this.bestScore = 0;
    this._saveNum('mb_unlocked', 0);
    this._saveNum('mb_last', 0);
    this._saveNum('mb_best', 0);
    this.ui.syncOverlays();
  }

  // --- Puntuación / persistencia --------------------------------------------
  addScore(n) { this.score += n; if (this.score > this.bestScore) this.bestScore = this.score; }
  _loadNum(key, def) { try { const v = parseInt(localStorage.getItem(key), 10); return isNaN(v) ? def : v; } catch (e) { return def; } }
  _saveNum(key, val) { try { localStorage.setItem(key, String(val)); } catch (e) {} }
  _saveBest() { this._saveNum('mb_best', this.bestScore); }

  // --- Efectos ---------------------------------------------------------------
  shake(a) { this.shakeAmount = Math.max(this.shakeAmount, a); }
  spawnBurst(x, y, color, count = 8, speed = 2.5) {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color, Utils.rand(1, speed)));
  }

  // --- Actualización ---------------------------------------------------------
  update(dt) {
    const f = Math.min(dt / 16.6667, 2); // factor de frame (limitado)
    this.time += dt;

    // Teclas globales de estado
    if (this.input.wasPressed('pause')) this.togglePause();
    if (this.input.wasPressed('restart') &&
        (this.state === GameState.PLAYING || this.state === GameState.PAUSED)) {
      this.restartLevel();
    }

    if (this.state !== GameState.PLAYING) return;

    this.ui.updateHUD(dt);

    // Jugador
    this.player.update(f, dt, this.input, this.platforms);

    // Balas del jugador
    for (const b of this.bullets) b.update(f, dt);

    // Enemigos
    for (const e of this.enemies) e.update(f, dt);

    // Proyectiles enemigos
    for (const b of this.enemyBullets) b.update(f, dt);

    // Colisiones bala -> enemigo
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const e of this.enemies) {
        if (!e.dead && Utils.aabb(b, e.rect)) { e.hit(1); b.dead = true; break; }
      }
    }

    // Colisiones enemigo -> jugador (daño por contacto)
    for (const e of this.enemies) {
      if (!e.dead && Utils.aabb(this.player, e.rect)) this.player.takeDamage(1);
    }

    // Colisiones proyectil enemigo -> jugador
    for (const b of this.enemyBullets) {
      if (!b.dead && Utils.aabb(this.player, b.rect)) { this.player.takeDamage(1); b.dead = true; }
    }

    // Coleccionables (cristal, gema y vida)
    for (const p of this.pickups) {
      if (!p.taken && Utils.aabb(this.player, p)) {
        p.taken = true;
        if (p.type === 'health') {
          this.player.health = Math.min(CONFIG.playerMaxHealth, this.player.health + 1);
          this.spawnBurst(p.x + 10, p.y + 10, PALETTE.mauve, 12, 3);
        } else {
          this.collected++;
          this.addScore(p.type === 'gem' ? CONFIG.scoreGem : CONFIG.scorePickup);
          this.spawnBurst(p.x + 10, p.y + 10, PALETTE.blush, 12, 3);
        }
        this.audio.pickup();
      }
      p.t += dt * 0.004;
    }

    // Meta del nivel -> completar y desbloquear el siguiente
    this.goal.t += dt * 0.004;
    if (Utils.aabb(this.player, this.goal)) {
      this.addScore(CONFIG.scoreGoal);
      const nxt = this.levelIndex + 1;
      if (nxt > this.unlocked && nxt < CONFIG.totalLevels) {
        this.unlocked = nxt; this._saveNum('mb_unlocked', nxt);
      }
      this._saveBest();
      this.audio.victory();
      this.setState(GameState.LEVEL_COMPLETE);
    }

    // Caída al vacío
    if (this.player.y > this.worldHeight + 200) {
      this.player.takeDamage(1);
      if (!this.player.dead) {
        this.player.x = this.spawn.x; this.player.y = this.spawn.y;
        this.player.vx = 0; this.player.vy = 0;
      }
    }

    // Muerte del jugador
    if (this.player.dead) {
      this._saveBest();
      this.audio.gameOver();
      this.setState(GameState.GAME_OVER);
    }

    // Limpieza de entidades muertas
    this.bullets = this.bullets.filter(b => !b.dead &&
      b.x > this.camera.x - 100 && b.x < this.camera.x + CONFIG.viewWidth + 100);
    this.enemyBullets = this.enemyBullets.filter(b => !b.dead &&
      b.x > this.camera.x - 200 && b.x < this.camera.x + CONFIG.viewWidth + 200 &&
      b.y > -200 && b.y < this.worldHeight + 200);
    this.enemies = this.enemies.filter(e => !e.dead);
    for (const pt of this.particles) pt.update(f, dt);
    this.particles = this.particles.filter(pt => !pt.dead);

    // Cámara lateral (sigue al jugador, con límites del mundo)
    const targetX = this.player.x + this.player.w / 2 - CONFIG.viewWidth / 2;
    this.camera.x += (targetX - this.camera.x) * Math.min(0.15 * f, 1);
    this.camera.x = Utils.clamp(this.camera.x, 0, Math.max(0, this.worldWidth - CONFIG.viewWidth));
    this.camera.y = 0;

    // Decaimiento del temblor
    if (this.shakeAmount > 0) this.shakeAmount = Math.max(0, this.shakeAmount - 0.6 * f);
  }

  // --- Renderizado -----------------------------------------------------------
  render() {
    const ctx = this.ctx;
    this._drawBackground(ctx);

    if (this.player) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.save();
      ctx.translate(Math.round(-this.camera.x + sx), Math.round(-this.camera.y + sy));

      this._drawPlatforms(ctx);
      this._drawPickups(ctx);
      this._drawGoal(ctx);
      for (const e of this.enemies) e.draw(ctx);
      for (const b of this.enemyBullets) b.draw(ctx);
      for (const b of this.bullets) b.draw(ctx);
      this.player.draw(ctx);
      for (const pt of this.particles) pt.draw(ctx);

      ctx.restore();

      if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
        this.ui.drawHUD(ctx);
      }
    }
  }

  _drawBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.viewHeight);
    grad.addColorStop(0, PALETTE.midnight);
    grad.addColorStop(0.6, PALETTE.violet);
    grad.addColorStop(1, '#241a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CONFIG.viewWidth, CONFIG.viewHeight);

    for (const s of this.stars) {
      const px = (s.x - this.camera.x * s.layer) % 1600;
      const x = px < 0 ? px + 1600 : px;
      const tw = 0.5 + 0.5 * Math.sin(this.time * 0.003 + s.tw);
      ctx.globalAlpha = tw;
      ctx.fillStyle = PALETTE.blush;
      ctx.fillRect(x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(46,41,78,0.75)';
    const off = (this.camera.x * 0.35) % 320;
    for (let i = -1; i < CONFIG.viewWidth / 320 + 1; i++) {
      const bx = i * 320 - off;
      ctx.beginPath();
      ctx.moveTo(bx, CONFIG.viewHeight);
      ctx.lineTo(bx + 40, 360);
      ctx.lineTo(bx + 120, 420);
      ctx.lineTo(bx + 200, 340);
      ctx.lineTo(bx + 300, 430);
      ctx.lineTo(bx + 320, CONFIG.viewHeight);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawPlatforms(ctx) {
    for (const p of this.platforms) {
      ctx.fillStyle = PALETTE.midnight;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = PALETTE.purple;
      ctx.fillRect(p.x, p.y, p.w, Math.min(8, p.h));
      ctx.fillStyle = PALETTE.mauve;
      ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.fillStyle = PALETTE.blush;
      for (let x = p.x + 10; x < p.x + p.w - 6; x += 46) ctx.fillRect(x, p.y + 4, 2, 2);
    }
  }

  _drawPickups(ctx) {
    for (const p of this.pickups) {
      if (p.taken) continue;
      const yo = Math.sin(p.t) * 4;
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2 + yo;

      if (p.type === 'health') {
        // Vida: cruz rosa con halo
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = PALETTE.mauve; ctx.fillRect(cx - 9, cy - 9, 18, 18);
        ctx.globalAlpha = 1;
        ctx.fillStyle = PALETTE.midnight; ctx.fillRect(cx - 8, cy - 8, 16, 16);
        ctx.fillStyle = PALETTE.mauve;    ctx.fillRect(cx - 6, cy - 6, 12, 12);
        ctx.fillStyle = PALETTE.blush;
        ctx.fillRect(cx - 2, cy - 6, 4, 12);
        ctx.fillRect(cx - 6, cy - 2, 12, 4);
        continue;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p.t * 0.6);
      if (p.type === 'gem') {
        // Gema: más grande, con núcleo púrpura y brillo
        ctx.fillStyle = PALETTE.purple; ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = PALETTE.mauve;  ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = PALETTE.blush;  ctx.fillRect(-3, -3, 6, 6);
      } else {
        // Cristal (por defecto)
        ctx.fillStyle = PALETTE.blush; ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = PALETTE.mauve; ctx.fillRect(-3, -3, 6, 6);
      }
      ctx.restore();
    }
  }

  _drawGoal(ctx) {
    const g = this.goal;
    const glow = 0.5 + 0.5 * Math.sin(g.t * 2);
    ctx.globalAlpha = 0.25 + glow * 0.25;
    ctx.fillStyle = PALETTE.mauve;
    ctx.fillRect(g.x - 8, g.y - 40, g.w + 16, g.h + 40);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.midnight; ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = PALETTE.purple;   ctx.fillRect(g.x + 4, g.y + 4, g.w - 8, g.h - 8);
    ctx.fillStyle = PALETTE.blush;    ctx.fillRect(g.x + g.w / 2 - 3, g.y + 6, 6, g.h - 12);
  }
}
