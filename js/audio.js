/* =========================================================================
   audio.js  —  Gestor de sonido con Web Audio API
   Genera efectos por código (sin archivos externos). Estructura preparada
   para cargar samples/música en fases posteriores (ver métodos loadSample).
   ========================================================================= */

class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;      // se crea tras la primera interacción del usuario
    this.master = null;
    this.samples = {};    // aquí se guardarían buffers de audio externos
  }

  /* El navegador exige un gesto del usuario para iniciar el audio.
     Se llama desde main.js al pulsar PLAY o una tecla. */
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.enabled = false;
      console.warn('Web Audio no disponible:', e);
    }
  }

  toggle() { this.enabled = !this.enabled; }

  /* Genera un tono simple con envolvente (ADSR reducido). */
  tone(freq, dur = 0.12, type = 'square', vol = 0.5, slide = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq + slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // --- Efectos concretos del juego ------------------------------------------
  shoot()     { this.tone(660, 0.10, 'square',   0.30, -300); }
  enemyShoot(){ this.tone(240, 0.14, 'sawtooth', 0.22, -80); }
  jump()    { this.tone(320, 0.14, 'square',   0.35,  260); }
  pickup()  { this.tone(880, 0.09, 'triangle', 0.40,  220); setTimeout(() => this.tone(1180, 0.09, 'triangle', 0.35), 70); }
  hurt()    { this.tone(140, 0.22, 'sawtooth', 0.40, -60); }
  enemyDie(){ this.tone(200, 0.18, 'square',   0.30, -120); }
  victory() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.4), i * 130)); }
  gameOver(){ [392, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, 'sawtooth', 0.4), i * 200)); }

  /* Punto de extensión para audio real en fases futuras:
     const res = await fetch('assets/sfx/shoot.wav');
     this.samples.shoot = await this.ctx.decodeAudioData(await res.arrayBuffer()); */
  async loadSample(/* name, url */) { /* pendiente: fases posteriores */ }
}
