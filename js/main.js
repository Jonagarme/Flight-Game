window.onload = function () {
    // Obtención de elementos del DOM
    const startButton = document.getElementById("startButton");
    const restartButton = document.getElementById("restartButton");
    const exitButton = document.getElementById("exitButton");
    const musicButton = document.getElementById("musicButton");
    const spaceshipSelect = document.getElementById("spaceshipSelect");
    const spaceshipPreview = document.getElementById("spaceshipPreview");

    // Variable para almacenar la imagen seleccionada de la nave
    let spaceshipImgSrc = spaceshipSelect.value;

    // Evento para actualizar la previsualización de la nave al cambiar la selección
    spaceshipSelect.addEventListener("change", function () {
        spaceshipImgSrc = this.value;
        spaceshipPreview.src = this.value;
    });

    let game; // Variable para almacenar la instancia del juego
    let isMusicPlaying = true; // Estado de la música

    startButton.addEventListener("click", startGame);
    restartButton.addEventListener("click", () => {
        window.location.reload(); // Recargar la página
    });
    exitButton.addEventListener("click", () => {
        window.close();
    });
    musicButton.addEventListener("click", toggleMusic);

    // Función para iniciar el juego
    function startGame() {
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("gameCanvas").style.display = "block";
        game = new Phaser.Game(config);
    }

    // Función para alternar la música
    function toggleMusic() {
        if (isMusicPlaying) {
            game.sound.pauseAll();
            musicButton.src = "assets/music-off.png";
        } else {
            game.sound.resumeAll();
            musicButton.src = "assets/music-on.png";
        }
        isMusicPlaying = !isMusicPlaying;
    }

    // Configuración del juego
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'gameCanvas',
        scene: {
            preload: preload, // Precargar assets
            create: create,   // Crear los elementos del juego
            update: update    // Actualizar el estado del juego
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        }
    };

    // Variables del juego
    let player;
    let cursors;
    let bullets;
    let meteors;
    let stars;
    let scoreText;
    let levelText;
    let livesText;
    let score = 0;
    let level = 1;
    let lives = 3;
    let backgroundMusic;
    let shootSound;
    let levelUpSound;
    let lastMeteorTime = 0;
    let lastStarTime = 0;
    let bulletTime = 0;
    let background1;
    let background2;

    // Función para precargar los assets
    function preload() {
        this.load.image('background1', 'assets/background1.png');
        this.load.image('background2', 'assets/background2.png');
        this.load.image('spaceship', spaceshipImgSrc);
        this.load.image('meteor', 'assets/meteor.png');
        this.load.image('bigMeteor', 'assets/big_meteor.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('flame', 'assets/flame.png');
        this.load.audio('backgroundMusic', 'assets/background-music.mp3');
        this.load.audio('shootSound', 'assets/shoot-sound.mp3');
        this.load.audio('levelUpSound', 'assets/level-up-sound.mp3');
    }

    // Función para crear los elementos del juego
    function create() {
        // Crear fondos
        background1 = this.add.tileSprite(400, 300, 800, 600, 'background1');
        background2 = this.add.tileSprite(400, 300, 800, 600, 'background2');
        background2.setVisible(false);

        // Crear el jugador
        player = this.physics.add.sprite(400, 500, 'spaceship');
        player.setCollideWorldBounds(true); // La nave no puede salir de los límites del mundo

        // Crear controles de cursor
        cursors = this.input.keyboard.createCursorKeys();

        // Crear grupos de balas, meteoros y estrellas
        bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        meteors = this.physics.add.group();
        stars = this.physics.add.group();

        // Crear textos de puntuación, nivel y vidas
        scoreText = this.add.text(10, 10, 'Puntaje: 0', { fontSize: '20px', fill: '#fff' });
        levelText = this.add.text(700, 10, 'Nivel: 1', { fontSize: '20px', fill: '#fff' });
        livesText = this.add.text(10, 40, 'Vidas: ' + lives, { fontSize: '20px', fill: '#fff' });

        // Cargar música de fondo y sonidos
        backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
        shootSound = this.sound.add('shootSound');
        levelUpSound = this.sound.add('levelUpSound');

        backgroundMusic.play(); // Reproducir música de fondo
    }

    // Función para actualizar el estado del juego
    function update(time, delta) {
        // Mover el fondo
        background1.tilePositionY -= 2;
        if (level === 2) {
            background2.tilePositionY -= 2;
        }

        // Movimiento del jugador
        if (cursors.left.isDown) {
            player.setVelocityX(-200);
        } else if (cursors.right.isDown) {
            player.setVelocityX(200);
        } else {
            player.setVelocityX(0);
        }

        if (cursors.up.isDown) {
            player.setVelocityY(-200);
        } else if (cursors.down.isDown) {
            player.setVelocityY(200);
        } else {
            player.setVelocityY(0);
        }

        // Disparar balas
        if (cursors.space.isDown && time > bulletTime) {
            let bullet = bullets.get(player.x, player.y - 20);
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setVelocityY(-300);
                shootSound.play();
                bulletTime = time + 200;
            }
        }

        // Reciclar balas fuera de la pantalla
        bullets.children.each(function (bullet) {
            if (bullet.active && bullet.y < 0) {
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        }, this);

        // Generar meteoros
        if (time > lastMeteorTime) {
            let meteor = meteors.create(Phaser.Math.Between(0, 800), 0, 'meteor');
            meteor.setVelocity(0, Phaser.Math.Between(100, 200));
            lastMeteorTime = time + 2000;
        }

        // Generar estrellas
        if (time > lastStarTime) {
            let star = stars.create(Phaser.Math.Between(0, 800), 0, 'star');
            star.setVelocity(0, 150);
            lastStarTime = time + 3000;
        }

        // Verificar colisiones
        this.physics.add.overlap(bullets, meteors, hitMeteor, null, this);
        this.physics.add.overlap(player, meteors, hitPlayer, null, this);
        this.physics.add.overlap(player, stars, collectStar, null, this);

        // Función llamada cuando una bala impacta un meteoro
        function hitMeteor(bullet, meteor) {
            bullet.setActive(false);
            bullet.setVisible(false);
            meteor.destroy();
            score += 10;
            scoreText.setText('Puntaje: ' + score);
        }

        // Función llamada cuando el jugador colisiona con un meteoro
        function hitPlayer(player, meteor) {
            meteor.destroy();
            if (lives > 0) {
                lives -= 1;
                livesText.setText('Vidas: ' + lives);
                createBlinkEffect.call(this, player); // Llamar a la función de parpadeo
            } else {
                endGame();
            }
        }

        // Función para crear un efecto de parpadeo en la nave
        function createBlinkEffect(sprite) {
            this.tweens.add({
                targets: sprite,
                alpha: 0,
                ease: 'Linear',
                duration: 100,
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    sprite.alpha = 1;
                }
            });
        }

        // Función para finalizar el juego
        function endGame() {
            player.setTint(0xff0000);
            backgroundMusic.stop();
            const gameOverScreen = document.getElementById("gameOverScreen");
            gameOverScreen.style.display = "block";

            restartButton.removeEventListener("click", restartGame);
            restartButton.addEventListener("click", restartGame);

            game.scene.pause();
            this.physics.pause();
        }

        // Función para reiniciar el juego
        function restartGame() {
            const gameOverScreen = document.getElementById("gameOverScreen");
            gameOverScreen.style.display = "none";
            player.clearTint();
            score = 0;
            level = 1;
            lives = 3;
            scoreText.setText('Puntaje: ' + score);
            levelText.setText('Nivel: ' + level);
            livesText.setText('Vidas: ' + lives);
            background1.setVisible(true);
            background2.setVisible(false);
            backgroundMusic.stop();
            backgroundMusic.play();
            game.scene.resume();
            this.physics.resume();
        }

        // Función llamada cuando el jugador recoge una estrella
        function collectStar(player, star) {
            star.destroy();
            score += 1;
            scoreText.setText('Puntaje: ' + score);
            if (score >= 100 && level === 1) {
                levelUp.call(this);
            }
        }

        // Función para subir de nivel
        function levelUp() {
            level = 2;
            meteors.clear(true, true);
            stars.clear(true, true);
            levelText.setText('Nivel: 2');
            levelUpSound.play();
            background1.setVisible(false);
            background2.setVisible(true);
            backgroundMusic.stop();
            backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
            backgroundMusic.play();
        }
    }
};
