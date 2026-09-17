const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración del juego
const GRAVITY = 0.6;
const JUMP_STRENGTH = 12;
const MOVE_SPEED = 5;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 15;

// Variables de estado
let gameState = {
    running: true,
    level: 1,
    lives: 3,
    score: 0,
    platformsToReach: 0
};

// Clase Player
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 30;
        this.height = 30;
        this.velocityY = 0;
        this.velocityX = 0;
        this.jumping = false;
        this.color = '#FF6B6B';
    }

    update() {
        this.velocityY += GRAVITY;
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Bordes del canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Game Over si cae
        if (this.y > canvas.height) {
            return false;
        }
        return true;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Ojos
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 5, this.y + 8, 8, 8);
        ctx.fillRect(this.x + 17, this.y + 8, 8, 8);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 7, this.y + 10, 4, 4);
        ctx.fillRect(this.x + 19, this.y + 10, 4, 4);
    }

    jump() {
        if (!this.jumping) {
            this.velocityY = -JUMP_STRENGTH;
            this.jumping = true;
        }
    }

    moveLeft() {
        this.velocityX = -MOVE_SPEED;
    }

    moveRight() {
        this.velocityX = MOVE_SPEED;
    }

    stop() {
        this.velocityX = 0;
    }
}

// Clase Platform
class Platform {
    constructor(x, y, width = PLATFORM_WIDTH, height = PLATFORM_HEIGHT, moving = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.moving = moving;
        this.direction = 1;
        this.speed = 2;
        this.reached = false;
        this.color = '#4ECDC4';
    }

    update() {
        if (this.moving) {
            this.x += this.speed * this.direction;
            if (this.x < 0 || this.x + this.width > canvas.width) {
                this.direction *= -1;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.reached ? '#90EE90' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Borde
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(player) {
        return player.x + player.width > this.x &&
               player.x < this.x + this.width &&
               player.y + player.height >= this.y &&
               player.y + player.height <= this.y + this.height + 10 &&
               player.velocityY >= 0;
    }
}

// Clase Enemy
class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = speed;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.color = '#FF6348';
    }

    update() {
        this.x += this.speed * this.direction;

        if (this.x < 0 || this.x + this.width > canvas.width) {
            this.direction *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Ojos
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 3, this.y + 5, 6, 6);
        ctx.fillRect(this.x + 16, this.y + 5, 6, 6);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 4, this.y + 7, 3, 3);
        ctx.fillRect(this.x + 17, this.y + 7, 3, 3);
    }

    checkCollision(player) {
        return player.x + player.width > this.x &&
               player.x < this.x + this.width &&
               player.y + player.height > this.y &&
               player.y < this.y + this.height;
    }
}

// Generar nivel
function generateLevel(level) {
    const platforms = [];
    const enemies = [];

    // Plataforma base
    platforms.push(new Platform(canvas.width / 2 - 60, canvas.height - 50, 120, 20, false));

    // Generar plataformas hacia arriba
    const platformCount = 5 + level;
    const spacing = canvas.height / (platformCount + 1);

    for (let i = 1; i <= platformCount; i++) {
        const y = canvas.height - (spacing * i);
        const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
        const moving = i % 3 === 0 && level > 2;
        const width = level > 4 ? 60 : PLATFORM_WIDTH;

        platforms.push(new Platform(x, y, width, PLATFORM_HEIGHT, moving));
    }

    // Plataforma final
    platforms.push(new Platform(canvas.width / 2 - 40, 30, 80, PLATFORM_HEIGHT, false));
    gameState.platformsToReach = platforms.length;

    // Generar enemigos con dificultad progresiva
    const enemyCount = Math.min(2 + Math.floor(level / 2), 8);
    const enemySpeed = 2 + (level * 0.5);

    for (let i = 0; i < enemyCount; i++) {
        const x = Math.random() * canvas.width;
        const y = 100 + Math.random() * 400;
        enemies.push(new Enemy(x, y, enemySpeed));
    }

    return { platforms, enemies };
}

// Variables del juego
let player = new Player();
let platforms = [];
let enemies = [];
let keys = {};

// Event Listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        player.jump();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Loop de actualización
function update() {
    if (!gameState.running) return;

    // Movimiento del jugador
    if (keys['ArrowLeft'] || keys['a']) {
        player.moveLeft();
    } else if (keys['ArrowRight'] || keys['d']) {
        player.moveRight();
    } else {
        player.stop();
    }

    // Actualizar jugador
    if (!player.update()) {
        gameState.lives--;
        updateUI();

        if (gameState.lives <= 0) {
            endGame();
        } else {
            resetLevel();
        }
        return;
    }

    // Actualizar plataformas
    platforms.forEach(platform => {
        platform.update();

        if (platform.checkCollision(player)) {
            player.velocityY = 0;
            player.y = platform.y - player.height;
            player.jumping = false;

            // Marcar plataforma como alcanzada
            if (!platform.reached) {
                platform.reached = true;
                gameState.score += 10;
            }
        }
    });

    // Actualizar enemigos
    enemies.forEach(enemy => {
        enemy.update();

        if (enemy.checkCollision(player)) {
            gameState.lives--;
            updateUI();

            if (gameState.lives <= 0) {
                endGame();
            } else {
                resetLevel();
            }
        }
    });

    // Verificar si alcanzó la plataforma final
    const finalPlatform = platforms[platforms.length - 1];
    if (finalPlatform.checkCollision(player)) {
        gameState.level++;
        gameState.score += 100;
        nextLevel();
    }

    updateUI();
}

// Loop de dibujo
function draw() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar plataformas
    platforms.forEach(platform => platform.draw());

    // Dibujar enemigos
    enemies.forEach(enemy => enemy.draw());

    // Dibujar jugador
    player.draw();
}

// Actualizar UI
function updateUI() {
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('platformsLeft').textContent = platforms.filter(p => !p.reached).length;
}

// Siguiente nivel
function nextLevel() {
    const levelData = generateLevel(gameState.level);
    platforms = levelData.platforms;
    enemies = levelData.enemies;

    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.jumping = false;
}

// Reiniciar nivel actual
function resetLevel() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.jumping = false;
    platforms.forEach(p => p.reached = false);
}

// Fin del juego
function endGame() {
    gameState.running = false;
    document.getElementById('gameOverTitle').textContent = gameState.lives > 0 ? '¡Ganaste!' : 'Game Over';
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOver').style.display = 'block';
}

// Loop principal
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar juego
console.log('Iniciando juego...');
console.log('Canvas:', canvas);
console.log('Contexto:', ctx);

const levelData = generateLevel(gameState.level);
platforms = levelData.platforms;
enemies = levelData.enemies;

console.log('Plataformas:', platforms.length);
console.log('Enemigos:', enemies.length);

updateUI();
gameLoop();
