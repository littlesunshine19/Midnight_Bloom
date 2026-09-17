/* =========================================================================
   enemies.js  —  Enemigos y proyectiles enemigos
   Clase base Enemy + proyectil EnemyBullet + 5 tipos:
     · PatrolEnemy  (patrullero: camina y cambia de dirección en los bordes)
     · FlyerEnemy   (volador: oscila y dispara hacia el jugador)
     · ChaserEnemy  (perseguidor: detecta y se acerca al jugador)
     · TurretEnemy  (torreta: fija, dispara ráfagas dirigidas)
     · ArmoredEnemy (blindado: más vida, más lento, más puntos)
   Todos comparten vida, daño (hit) y puntuación. La creación se hace desde
   game.js con una fábrica por 'type', manteniendo compatibilidad con los
   niveles antiguos (sin type -> patrullero).
   ========================================================================= */

// --- Proyectil disparado por un enemigo --------------------------------------
class EnemyBullet {
  constructor(x, y, vx, vy) {
    this.w = 10; this.h = 10;
    this.x = x - this.w / 2; this.y = y - this.h / 2;
    this.vx = vx; this.vy = vy;
    this.life = CONFIG.enemyBulletLife;
    this.dead = false;
    this.t = 0;
  }
  update(f, dt) {
    this.x += this.vx * f;
    this.y += this.vy * f;
    this.life -= dt;
    this.t += dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 0.02);
    ctx.globalAlpha = 0.4 + pulse * 0.3;                 // halo
    ctx.fillStyle = PALETTE.purple;
    ctx.fillRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.violet;
    ctx.fillRect(this.x, this.y, this.w, this.h);        // cuerpo
    ctx.fillStyle = PALETTE.blush;                       // núcleo
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
  }
  get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

// --- Clase base --------------------------------------------------------------
class Enemy {
  constructor(x, y, game) {
    this.game = game;
    this.x = x; this.y = y;
    this.w = 30; this.h = 30;
    this.vx = 0; this.vy = 0;
    this.hp = 1;
    this.maxHp = 1;
    this.scoreValue = CONFIG.scoreEnemy;
    this.dead = false;
    this.hitFlash = 0;   // ms de destello al recibir daño
    this.animTime = 0;
  }

  // Recibe daño de una bala del jugador
  hit(n = 1) {
    this.hp -= n;
    this.hitFlash = 90;
    this.game.spawnBurst(this.x + this.w / 2, this.y + this.h / 2, PALETTE.blush, 6);
    if (this.hp <= 0) {
      this.dead = true;
      this.game.audio.enemyDie();
      this.game.spawnBurst(this.x + this.w / 2, this.y + this.h / 2, PALETTE.purple, 16, 3.8);
      this.game.addScore(this.scoreValue);
    }
  }

  // Dispara un proyectil dirigido hacia (tx, ty)
  fireAt(tx, ty, speed = CONFIG.enemyBulletSpeed) {
    const px = this.x + this.w / 2, py = this.y + this.h / 2;
    let dx = tx - px, dy = ty - py;
    const d = Math.hypot(dx, dy) || 1;
    this.game.enemyBullets.push(new EnemyBullet(px, py, (dx / d) * speed, (dy / d) * speed));
    this.game.audio.enemyShoot();
  }

  // Distancia al centro del jugador
  distToPlayer() {
    const p = this.game.player;
    return Math.hypot(
      (p.x + p.w / 2) - (this.x + this.w / 2),
      (p.y + p.h / 2) - (this.y + this.h / 2)
    );
  }

  update() { /* implementado por subclases */ }
  draw()   { /* implementado por subclases */ }

  get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

// --- 1) Patrullero -----------------------------------------------------------
class PatrolEnemy extends Enemy {
  constructor(x, y, game, range = 120) {
    super(x, y, game);
    this.hp = this.maxHp = 1;
    this.scoreValue = CONFIG.scoreEnemy;
    this.speed = 1.1;
    this.dir = 1;
    this.minX = x - range;
    this.maxX = x + range;
  }
  update(f, dt) {
    this.x += this.speed * this.dir * f;
    if (this.x <= this.minX) { this.x = this.minX; this.dir = 1; }
    if (this.x >= this.maxX) { this.x = this.maxX; this.dir = -1; }
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.animTime += dt * 0.02;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    const flash = this.hitFlash > 0;
    const O = PALETTE.midnight;
    const body = flash ? PALETTE.blush : PALETTE.purple;
    const shade = flash ? PALETTE.mauve : PALETTE.violet;
    const bob = Math.round(Math.sin(this.animTime * Math.PI * 2) * 2);
    ctx.fillStyle = O;
    ctx.fillRect(4,  this.h - 5 + bob, 6, 5);
    ctx.fillRect(20, this.h - 5 - bob, 6, 5);
    ctx.fillStyle = O;    ctx.fillRect(2, 2, this.w - 4, this.h - 6);
    ctx.fillStyle = body; ctx.fillRect(3, 3, this.w - 6, this.h - 8);
    ctx.fillStyle = shade;ctx.fillRect(this.w - 10, 4, 7, this.h - 10);
    const ex = this.dir > 0 ? 15 : 7;
    ctx.fillStyle = O;   ctx.fillRect(ex, 10, 8, 7);
    ctx.fillStyle = PALETTE.blush; ctx.fillRect(this.dir > 0 ? ex + 4 : ex, 11, 3, 4);
    ctx.restore();
  }
}

// --- 2) Volador --------------------------------------------------------------
class FlyerEnemy extends Enemy {
  constructor(x, y, game, range = 130) {
    super(x, y, game);
    this.w = 32; this.h = 24;
    this.hp = this.maxHp = 1;
    this.scoreValue = CONFIG.scoreEnemy;
    this.baseY = y;
    this.minX = x - range;
    this.maxX = x + range;
    this.dir = 1;
    this.speed = 1.3;
    this.phase = Math.random() * Math.PI * 2;
    this.shootTimer = Utils.rand(900, 1800);
  }
  update(f, dt) {
    this.x += this.speed * this.dir * f;
    if (this.x <= this.minX) { this.x = this.minX; this.dir = 1; }
    if (this.x >= this.maxX) { this.x = this.maxX; this.dir = -1; }
    this.phase += dt * 0.004;
    this.y = this.baseY + Math.sin(this.phase) * 24;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && this.distToPlayer() < 520) {
      const p = this.game.player;
      this.fireAt(p.x + p.w / 2, p.y + p.h / 2);
      this.shootTimer = Utils.rand(1500, 2400);
    }
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.animTime += dt * 0.03;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    const flash = this.hitFlash > 0;
    const O = PALETTE.midnight;
    const body = flash ? PALETTE.blush : PALETTE.violet;
    const wing = flash ? PALETTE.mauve : PALETTE.purple;
    const flap = Math.round(Math.sin(this.animTime * Math.PI * 2) * 4);
    // Alas
    ctx.fillStyle = wing;
    ctx.fillRect(-6, 4 - flap, 10, 8);
    ctx.fillRect(this.w - 4, 4 - flap, 10, 8);
    // Cuerpo
    ctx.fillStyle = O;    ctx.fillRect(4, 2, this.w - 8, this.h - 4);
    ctx.fillStyle = body; ctx.fillRect(5, 3, this.w - 10, this.h - 6);
    // Ojo central brillante
    ctx.fillStyle = PALETTE.blush; ctx.fillRect(this.w / 2 - 4, 8, 8, 6);
    ctx.fillStyle = O;             ctx.fillRect(this.w / 2 - 1, 10, 3, 3);
    ctx.restore();
  }
}

// --- 3) Perseguidor ----------------------------------------------------------
class ChaserEnemy extends Enemy {
  constructor(x, y, game, range = 260) {
    super(x, y, game);
    this.w = 28; this.h = 30;
    this.hp = this.maxHp = 2;
    this.scoreValue = CONFIG.scoreEnemy;
    this.baseY = y;
    this.detect = range;
    this.speed = 1.15;
    this.phase = Math.random() * Math.PI * 2;
  }
  update(f, dt) {
    const p = this.game.player;
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    let dx = px - cx, dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;

    if (dist < this.detect) {                 // detecta: se acerca lentamente
      this.x += (dx / dist) * this.speed * f;
      this.y += (dy / dist) * this.speed * f;
    } else {                                  // en reposo: flota suavemente
      this.phase += dt * 0.003;
      this.y = this.baseY + Math.sin(this.phase) * 10;
    }
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.animTime += dt * 0.02;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    const flash = this.hitFlash > 0;
    const O = PALETTE.midnight;
    const body = flash ? PALETTE.blush : PALETTE.violet;
    const near = this.distToPlayer() < this.detect;
    // Cuerpo espectral con base dentada
    ctx.fillStyle = O;    ctx.fillRect(2, 0, this.w - 4, this.h - 6);
    ctx.fillStyle = body; ctx.fillRect(3, 1, this.w - 6, this.h - 8);
    const w = Math.floor(this.animTime * 6) % 2;           // ondulación inferior
    ctx.fillStyle = body;
    ctx.fillRect(3, this.h - 7, 6, 5 + w);
    ctx.fillRect(this.w - 11, this.h - 7, 6, 5 + (1 - w));
    // Ojos (brillan más al detectar)
    ctx.fillStyle = near ? PALETTE.blush : PALETTE.mauve;
    ctx.fillRect(7, 9, 5, 6);
    ctx.fillRect(this.w - 12, 9, 5, 6);
    ctx.restore();
  }
}

// --- 4) Torreta --------------------------------------------------------------
class TurretEnemy extends Enemy {
  constructor(x, y, game) {
    super(x, y, game);
    this.w = 34; this.h = 26;
    this.hp = this.maxHp = 3;
    this.scoreValue = CONFIG.scoreGem;      // 150 puntos
    this.range = 460;
    this.shootTimer = Utils.rand(600, 1400);
    this.angle = 0;
  }
  update(f, dt) {
    const p = this.game.player;
    const px = p.x + p.w / 2, py = p.y + p.h / 2;
    this.angle = Math.atan2(py - (this.y + this.h / 2), px - (this.x + this.w / 2));

    if (this.distToPlayer() < this.range) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.fireAt(px, py);
        this.shootTimer = Utils.rand(1200, 1700);
      }
    }
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.animTime += dt;
  }
  draw(ctx) {
    const flash = this.hitFlash > 0;
    const O = PALETTE.midnight;
    const base = flash ? PALETTE.blush : PALETTE.purple;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    // Cañón (rota hacia el jugador)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);
    ctx.fillStyle = O;             ctx.fillRect(0, -5, 22, 10);
    ctx.fillStyle = PALETTE.mauve; ctx.fillRect(2, -3, 18, 6);
    ctx.fillStyle = PALETTE.blush; ctx.fillRect(16, -2, 4, 4);
    ctx.restore();
    // Base fija
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.fillStyle = O;    ctx.fillRect(2, 6, this.w - 4, this.h - 6);
    ctx.fillStyle = base; ctx.fillRect(3, 7, this.w - 6, this.h - 8);
    ctx.fillStyle = PALETTE.violet; ctx.fillRect(3, this.h - 6, this.w - 6, 5);
    // Indicador de vida
    for (let i = 0; i < this.maxHp; i++) {
      ctx.fillStyle = i < this.hp ? PALETTE.blush : PALETTE.violet;
      ctx.fillRect(5 + i * 8, 9, 5, 4);
    }
    ctx.restore();
  }
}

// --- 5) Blindado -------------------------------------------------------------
class ArmoredEnemy extends PatrolEnemy {
  constructor(x, y, game, range = 110) {
    super(x, y, game, range);
    this.w = 38; this.h = 36;
    this.hp = this.maxHp = 4;
    this.scoreValue = 200;
    this.speed = 0.6;
    this.minX = x - range;
    this.maxX = x + range;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    const flash = this.hitFlash > 0;
    const O = PALETTE.midnight;
    const plate = flash ? PALETTE.blush : PALETTE.violet;
    const trim  = flash ? PALETTE.mauve : PALETTE.purple;
    const bob = Math.round(Math.sin(this.animTime * Math.PI * 2) * 1.5);
    // Patas robustas
    ctx.fillStyle = O;
    ctx.fillRect(6, this.h - 6 + bob, 8, 6);
    ctx.fillRect(this.w - 14, this.h - 6 - bob, 8, 6);
    // Coraza
    ctx.fillStyle = O;    ctx.fillRect(2, 2, this.w - 4, this.h - 8);
    ctx.fillStyle = plate;ctx.fillRect(3, 3, this.w - 6, this.h - 10);
    ctx.fillStyle = trim; ctx.fillRect(3, 3, this.w - 6, 6);          // placa superior
    // Remaches
    ctx.fillStyle = PALETTE.blush;
    ctx.fillRect(7, 5, 2, 2); ctx.fillRect(this.w - 9, 5, 2, 2);
    // Ojo visor según dirección
    const ex = this.dir > 0 ? this.w - 16 : 8;
    ctx.fillStyle = O;             ctx.fillRect(ex, 14, 10, 6);
    ctx.fillStyle = PALETTE.mauve; ctx.fillRect(this.dir > 0 ? ex + 5 : ex, 15, 4, 4);
    // Grietas de daño (aparecen al perder vida)
    if (this.hp <= this.maxHp / 2) {
      ctx.fillStyle = O;
      ctx.fillRect(this.w / 2 - 1, 6, 2, this.h - 16);
    }
    ctx.restore();
  }
}
