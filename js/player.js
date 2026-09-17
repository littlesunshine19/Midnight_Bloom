/* =========================================================================
   player.js  —  Jugador y sus proyectiles
   Personaje original tipo chibi dibujado con rectángulos (pixel-art por
   código) usando la paleta Midnight Bloom. Incluye física, colisiones,
   disparo con enfriamiento, invulnerabilidad y estados de animación.
   ========================================================================= */

// --- Proyectil del jugador ---------------------------------------------------
class Bullet {
  constructor(x, y, dir) {
    this.w = 12; this.h = 6;
    this.x = x; this.y = y;
    this.vx = dir * CONFIG.bulletSpeed;
    this.life = CONFIG.bulletLife;
    this.dead = false;
  }
  update(f, dt) {
    this.x += this.vx * f;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    ctx.fillStyle = PALETTE.purple;                 // estela
    ctx.fillRect(this.x - this.vx, this.y + 1, this.w, this.h - 2);
    ctx.fillStyle = PALETTE.mauve;                  // cuerpo
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = PALETTE.blush;                  // núcleo brillante
    ctx.fillRect(this.x + this.w - 5, this.y + 1, 4, this.h - 2);
  }
}

// --- Jugador -----------------------------------------------------------------
class Player {
  constructor(x, y, game) {
    this.game = game;
    this.w = 28; this.h = 40;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.facing = 1;          // 1 derecha, -1 izquierda
    this.onGround = false;

    this.health = CONFIG.playerMaxHealth;
    this.invuln = 0;          // ms de invulnerabilidad restantes
    this.shootTimer = 0;      // ms hasta poder disparar de nuevo
    this.dead = false;

    // Animación
    this.animTime = 0;        // acumulador para ciclos de caminar
    this.shootAnim = 0;       // ms de animación de disparo
    this.state = 'idle';      // idle | walk | jump | fall | hurt
  }

  takeDamage(n = 1) {
    if (this.invuln > 0 || this.dead) return;
    this.health -= n;
    this.invuln = CONFIG.invulnTime;
    this.game.audio.hurt();
    this.game.shake(8);
    this.game.spawnBurst(this.x + this.w / 2, this.y + this.h / 2, PALETTE.mauve, 10);
    if (this.health <= 0) { this.health = 0; this.dead = true; }
  }

  shoot() {
    if (this.shootTimer > 0) return;
    this.shootTimer = CONFIG.shootCooldown;
    this.shootAnim = 140;
    const bx = this.facing > 0 ? this.x + this.w : this.x - 12;
    const by = this.y + 16;
    this.game.bullets.push(new Bullet(bx, by, this.facing));
    this.game.audio.shoot();
    this.game.spawnBurst(bx + (this.facing > 0 ? 6 : -6), by + 3, PALETTE.blush, 5, 2.5);
  }

  update(f, dt, input, platforms) {
    if (this.dead) return;

    // --- Entrada horizontal ---
    const accel = this.onGround ? 1 : CONFIG.airControl;
    let move = 0;
    if (input.isDown('left'))  move -= 1;
    if (input.isDown('right')) move += 1;
    this.vx = move * CONFIG.moveSpeed * accel;
    if (move !== 0) this.facing = move;

    // --- Salto ---
    if (input.wasPressed('jump') && this.onGround) {
      this.vy = -CONFIG.jumpForce;
      this.onGround = false;
      this.game.audio.jump();
    }

    // --- Disparo ---
    if (input.isDown('shoot')) this.shoot();

    // --- Gravedad ---
    this.vy += CONFIG.gravity * f;
    if (this.vy > CONFIG.maxFallSpeed) this.vy = CONFIG.maxFallSpeed;

    // --- Movimiento + colisiones (ejes separados) ---
    this.x += this.vx * f;
    this._collide(platforms, 'x');
    this.y += this.vy * f;
    this.onGround = false;
    this._collide(platforms, 'y');

    // Límites laterales del mundo
    this.x = Utils.clamp(this.x, 0, this.game.worldWidth - this.w);

    // --- Temporizadores ---
    if (this.shootTimer > 0) this.shootTimer -= dt;
    if (this.shootAnim  > 0) this.shootAnim  -= dt;
    if (this.invuln     > 0) this.invuln     -= dt;

    // --- Estado de animación ---
    if (!this.onGround)      this.state = this.vy < 0 ? 'jump' : 'fall';
    else if (move !== 0)     this.state = 'walk';
    else                     this.state = 'idle';
    if (this.invuln > CONFIG.invulnTime - 250) this.state = 'hurt';
    this.animTime += dt * (this.state === 'walk' ? 0.02 : 0.006);
  }

  // Resuelve colisiones con plataformas en un eje concreto.
  _collide(platforms, axis) {
    for (const p of platforms) {
      if (!Utils.aabb(this, p)) continue;
      if (axis === 'x') {
        if (this.vx > 0) this.x = p.x - this.w;
        else if (this.vx < 0) this.x = p.x + p.w;
        this.vx = 0;
      } else {
        if (this.vy > 0) {           // cayendo -> aterriza encima
          this.y = p.y - this.h;
          this.onGround = true;
        } else if (this.vy < 0) {    // subiendo -> golpea el techo
          this.y = p.y + p.h;
        }
        this.vy = 0;
      }
    }
  }

  // --- Dibujo del personaje (pixel-art por bloques) --------------------------
  draw(ctx) {
    // Parpadeo durante invulnerabilidad
    if (this.invuln > 0 && Math.floor(this.invuln / 80) % 2 === 0) return;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    if (this.facing < 0) { ctx.translate(this.w, 0); ctx.scale(-1, 1); }

    // Rebote vertical al caminar / respirar en idle
    const bob = this.state === 'walk'
      ? Math.round(Math.sin(this.animTime * Math.PI * 2) * 1.5)
      : (this.state === 'idle' ? Math.round(Math.sin(this.animTime * Math.PI * 2) * 1) : 0);

    const O = PALETTE.midnight; // contorno
    const B = PALETTE.mauve;    // cuerpo
    const S = PALETTE.purple;   // sombra
    const L = PALETTE.blush;    // luz
    const D = PALETTE.violet;   // piernas / oscuro

    // Piernas (animadas)
    const legSwing = this.state === 'walk' ? Math.round(Math.sin(this.animTime * Math.PI * 2) * 3) : 0;
    const legY = (this.state === 'jump' || this.state === 'fall') ? 30 : 32;
    ctx.fillStyle = D;
    ctx.fillRect(7,  legY, 6, this.h - legY - legSwing);          // pierna trasera
    ctx.fillRect(16, legY, 6, this.h - legY + legSwing);          // pierna delantera
    ctx.fillStyle = O;
    ctx.fillRect(7,  this.h - 3 - Math.max(0, -legSwing), 6, 3);  // pie (contorno)

    // Cuerpo
    ctx.fillStyle = O; ctx.fillRect(5, 17 + bob, 18, 16);         // contorno cuerpo
    ctx.fillStyle = B; ctx.fillRect(6, 18 + bob, 16, 14);         // relleno cuerpo
    ctx.fillStyle = S; ctx.fillRect(16, 18 + bob, 6, 14);         // sombra lateral
    ctx.fillStyle = L; ctx.fillRect(7, 19 + bob, 4, 4);           // luz de pecho

    // Cabeza (grande, estilo chibi)
    ctx.fillStyle = O; ctx.fillRect(3, 1 + bob, 22, 17);          // contorno cabeza
    ctx.fillStyle = B; ctx.fillRect(4, 2 + bob, 20, 15);         // relleno cabeza
    ctx.fillStyle = S; ctx.fillRect(17, 3 + bob, 6, 13);         // sombra
    ctx.fillStyle = L; ctx.fillRect(5, 3 + bob, 7, 6);           // luz superior
    // Ojos
    ctx.fillStyle = O;
    ctx.fillRect(9,  8 + bob, 3, 4);
    ctx.fillRect(16, 8 + bob, 3, 4);
    ctx.fillStyle = L;
    ctx.fillRect(9,  8 + bob, 1, 1);
    ctx.fillRect(16, 8 + bob, 1, 1);

    // Brazo / disparo
    if (this.shootAnim > 0) {
      ctx.fillStyle = O; ctx.fillRect(22, 20 + bob, 10, 6);      // brazo extendido
      ctx.fillStyle = B; ctx.fillRect(22, 21 + bob, 9, 4);
      ctx.fillStyle = L; ctx.fillRect(30, 20 + bob, 5, 6);       // fogonazo
    } else {
      ctx.fillStyle = O; ctx.fillRect(21, 20 + bob, 5, 8);       // brazo en reposo
      ctx.fillStyle = B; ctx.fillRect(22, 21 + bob, 3, 6);
    }

    ctx.restore();
  }
}
