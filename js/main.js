window.onload = function () {
    // Obtención de elementos del DOM
    const startButton = document.getElementById("startButton");
    const instructionsButton = document.getElementById("instructionsButton");
    const closeInstructionsButton = document.getElementById("closeInstructionsButton");
    const restartButton = document.getElementById("restartButton");
    const exitButton = document.getElementById("exitButton");
    const musicButton = document.getElementById("musicButton");
    const spaceshipSelect = document.getElementById("spaceshipSelect");
    const spaceshipPreview = document.getElementById("spaceshipPreview");
    const overlayScreens = document.getElementById("overlayScreens");
    const startScreen = document.getElementById("startScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const instructionsScreen = document.getElementById("instructionsScreen");

    // Variable para almacenar la imagen seleccionada de la nave
    let spaceshipImgSrc = spaceshipSelect.value;

    // Evento para actualizar la previsualización de la nave al cambiar la selección
    spaceshipSelect.addEventListener("change", function () {
        spaceshipImgSrc = this.value;
        spaceshipPreview.src = this.value;
    });

    let game; // Variable para almacenar la instancia del juego
    let isMusicPlaying = true; // Estado de la música

    // Eventos de botones
    startButton.addEventListener("click", startGame);
    instructionsButton.addEventListener("click", showInstructions);
    closeInstructionsButton.addEventListener("click", closeInstructions);
    restartButton.addEventListener("click", () => {
        window.location.reload(); // Recargar la página
    });
    exitButton.addEventListener("click", () => {
        window.close();
    });
    musicButton.addEventListener("click", toggleMusic);

    // Función para iniciar el juego
    function startGame() {
        startScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        instructionsScreen.style.display = "none";
        overlayScreens.style.display = "none";
        document.getElementById("gameCanvas").style.display = "block";
        game = new Phaser.Game(config);
    }

    // Función para mostrar las instrucciones
    function showInstructions() {
        instructionsScreen.style.display = "block";
        overlayScreens.style.display = "flex";
        if (game && game.scene.isActive('default')) {
            game.scene.pause('default'); // Pausar el juego
        }
    }

    // Función para cerrar las instrucciones
    function closeInstructions() {
        instructionsScreen.style.display = "none";
        overlayScreens.style.display = "none";
        if (game && game.scene.isPaused('default')) {
            game.scene.resume('default'); // Reanudar el juego
        }
    }

    // Función para mostrar la pantalla de game over
    function showGameOverScreen() {
        gameOverScreen.style.display = "flex";
        overlayScreens.style.display = "flex";
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
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        scene: {
            preload: preload, // Precargar assets
            create: create,   // Crear los elementos del juego
            update: update    // Actualizar el estado del juego
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 }, // Sin gravedad
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
    let powerUps;
    let scoreText;
    let levelText;
    let livesText;
    let levelUpText; // Texto para el mensaje de nivel
    let score = 0;
    let level = 1;
    let lives = 3;
    let backgroundMusic;
    let shootSound;
    let levelUpSound;
    let lastMeteorTime = 0;
    let lastStarTime = 0;
    let lastPowerUpTime = 0;
    let bulletTime = 0;
    let background1;
    // let background2;
    let gameOver = false;
    let tripleShot = false;

    // Función para precargar los assets
    function preload() {
        // this.load.image('background1', 'assets/background1.png');
        // this.load.image('background2', 'assets/background2.png');
        this.load.image('spaceship', spaceshipImgSrc);
        this.load.image('meteor', 'assets/meteor.png');
        this.load.image('bigMeteor', 'assets/big_meteor.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('flame', 'assets/flame.png');
        this.load.image('powerUp', 'assets/powerup.png');
        this.load.audio('backgroundMusic', 'assets/background-music.mp3');
        this.load.audio('shootSound', 'assets/shoot-sound.mp3');
        this.load.audio('levelUpSound', 'assets/level-up-sound.mp3');
        this.load.image('button', 'assets/buttonInstrucciones.png'); // Añadir la imagen del botón
        this.load.image('img_mapa', 'assets/mapas/background.png'); // Añadir la imagen del botón
        this.load.tilemapTiledJSON('mapa', 'assets/mapas/mapaEspacio.json');
    }

    // Función para crear los elementos del juego
    function create() {
        // Crear Mapa
        var mapa = this.make.tilemap({key:'mapa'});
        var espacio = mapa.addTilesetImage('espacio', 'img_mapa');
        var layer_espacio = mapa.createLayer('espacio', espacio);

        // Crear fondos
        // background1 = this.add.tileSprite(400, 300, 800, 600, 'background1');

        // Crear el jugador
        player = this.physics.add.sprite(400, 500, 'spaceship');
        player.setCollideWorldBounds(true); // La nave no puede salir de los límites del mundo

        // Crear controles de cursor
        cursors = this.input.keyboard.createCursorKeys();

        // Crear grupos de balas, meteoros y estrellas
        bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 30 // Aumentar el tamaño máximo para manejar disparos triples
        });

        meteors = this.physics.add.group();
        stars = this.physics.add.group();
        powerUps = this.physics.add.group();

        // Crear textos de puntuación, nivel y vidas
        scoreText = this.add.text(10, 10, 'Puntaje: 0', { fontSize: '20px', fill: '#fff' });
        levelText = this.add.text(700, 10, 'Nivel: 1', { fontSize: '20px', fill: '#fff' });
        livesText = this.add.text(10, 40, 'Vidas: ' + lives, { fontSize: '20px', fill: '#fff' });

        // Crear texto de subida de nivel (inicialmente invisible)
        levelUpText = this.add.text(400, 300, "", {
            fontSize: "40px",
            fill: "#ff0",
        });
        levelUpText.setOrigin(0.5);
        levelUpText.setVisible(false);
  
        // Cargar música de fondo y sonidos
        backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
        shootSound = this.sound.add('shootSound');
        levelUpSound = this.sound.add('levelUpSound');

        backgroundMusic.play(); // Reproducir música de fondo

        // Configurar colisiones
        this.physics.add.overlap(bullets, meteors, hitMeteor, null, this);
        this.physics.add.overlap(player, meteors, hitPlayer, null, this);
        this.physics.add.overlap(player, stars, collectStar, null, this);
        this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);

        // Crear botón en la pantalla del juego
        const instructionsButton = this.add.image(750, 30, 'button').setInteractive();
        instructionsButton.setScale(0.1); // Escalar el botón a un tamaño adecuado
        instructionsButton.on('pointerdown', () => {
            showInstructions(); // Llamar a la función para mostrar las instrucciones
        });

        // Mostrar texto sobre el botón
        this.add.text(instructionsButton.x - 20, instructionsButton.y - 10, 'Instrucciones', { fontSize: '14px', fill: '#fff' });
    }

    // Función para actualizar el estado del juego
    function update(time, delta) {
        if (gameOver) return; // Si el juego ha terminado, no continuar con la actualización

        // Mover el fondo
        // background1.tilePositionY -= 2;

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
            if (tripleShot) {
                shootTripleBullets.call(this, time);
            } else {
                shootBullets.call(this, time);
            }
        }

        // Reciclar balas fuera de la pantalla
        bullets.children.each(function (bullet) {
            if (bullet.active && bullet.y < 0) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.destroy();
            }
        }, this);

        // Destruir meteoros fuera de la pantalla
        meteors.children.each(function (meteor) {
            if (meteor.active && meteor.y > 600) {
                meteor.destroy(); // Destruir meteoros fuera de pantalla
            }
        }, this);

        // Destruir estrellas fuera de la pantalla
        stars.children.each(function (star) {
            if (star.active && star.y > 600) {
                star.destroy(); // Destruir estrellas fuera de pantalla
            }
        }, this);

        // Generar meteoros
        if (time > lastMeteorTime) {
            let meteorType = Math.random() < 0.5 ? 'meteor' : 'bigMeteor'; // Elegir aleatoriamente el tipo de meteoro
            let meteor = meteors.create(Phaser.Math.Between(0, 800), 0, meteorType);
            meteor.setVelocity(0, Phaser.Math.Between(100, 200));
            lastMeteorTime = time + 2000;
        }

        // Generar estrellas
        if (time > lastStarTime) {
            let star = stars.create(Phaser.Math.Between(0, 800), 0, 'star');
            star.setVelocity(0, 150);
            lastStarTime = time + 3000;
        }

        // Generar potenciadores
        if (time > lastPowerUpTime) {
            let powerUp = powerUps.create(Phaser.Math.Between(0, 800), 0, 'powerUp');
            powerUp.setVelocity(0, 150);
            lastPowerUpTime = time + 10000; // Generar un potenciador cada 10 segundos
        }
    }

    // Función para mostrar las instrucciones
    function showInstructions() {
        instructionsScreen.style.display = "block";
        overlayScreens.style.display = "flex";
        if (game && game.scene.isActive('default')) {
            game.scene.pause('default'); // Pausar el juego
        }
    }

    // Función para cerrar las instrucciones
    function closeInstructions() {
        instructionsScreen.style.display = "none";
        overlayScreens.style.display = "none";
        if (game && game.scene.isPaused('default')) {
            game.scene.resume('default'); // Reanudar el juego
        }
    }

    // Función llamada cuando una bala impacta un meteoro
    function hitMeteor(bullet, meteor) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.destroy(); // Destruir la bala para liberar memoria
        meteor.destroy();
        incrementaScore.call(this, 10); // Incrementar el puntaje por 10
    }

    // Función llamada cuando el jugador colisiona con un meteoro
    function hitPlayer(player, meteor) {
        meteor.destroy();
        if (lives > 0) {
            lives -= 1;
            livesText.setText('Vidas: ' + lives);
            createBlinkEffect.call(this, player); // Llamar a la función de parpadeo
        } else {
            endGame.call(this);
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

    // Función para verificar si es necesario subir de nivel
    function checkLevelUp() {
        let residuo = score % 100; // Calcula el residuo
        console.log('Residuo:', residuo); // Mostrar resultado en la consola
        if (score > 0 && residuo === 0) {
            levelUp.call(this);
        }
    }

    // Función para incrementar el puntaje y verificar el nivel
    function incrementaScore(puntos) {
        let startingScore = score; // Guardar el puntaje inicial

        score += puntos; // Incrementar el puntaje
        scoreText.setText('Puntaje: ' + score); // Actualizar el texto del puntaje

        // Verificar cada múltiplo de 100 cruzado
        for (let i = Math.floor(startingScore / 100) + 1; i <= Math.floor(score / 100); i++) {
            if (i * 100 <= score) {
                levelUp.call(this);
            }
        }
    }

    // Función para finalizar el juego
    function endGame() {
        player.setTint(0xff0000);
        backgroundMusic.stop();
        showGameOverScreen(); // Mostrar la pantalla de game over

        game.scene.pause();
        this.physics.pause();
        gameOver = true; // Marcar que el juego ha terminado
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
        // background2.setVisible(false);
        backgroundMusic.stop();
        backgroundMusic.play();
        game.scene.resume();
        this.physics.resume();
        gameOver = false; // Reiniciar el estado del juego
    }

    // Función llamada cuando el jugador recoge una estrella
    function collectStar(player, star) {
        star.destroy();
        incrementaScore.call(this, 1); // Incrementar el puntaje por 1
    }

    // Función para recoger un potenciador
    function collectPowerUp(player, powerUp) {
        powerUp.destroy();
        tripleShot = true; // Activar disparo triple
        // Desactivar disparo triple después de 10 segundos
        this.time.addEvent({
            delay: 10000,
            callback: () => { tripleShot = false; },
            callbackScope: this
        });
    }

    // Función para disparar una bala a la vez
    function shootBullets(time){
        let bullet = bullets.get(player.x, player.y - 20);
        if (bullet) {
            bullet.setActive(true).setVisible(true).setVelocityY(-300);
            shootSound.play();
            bulletTime = time + 200;
        }
    }

    // Función para disparar tres balas a la vez
    function shootTripleBullets(time) {
        let bullet1 = bullets.get(player.x - 20, player.y - 20);
        let bullet2 = bullets.get(player.x, player.y - 20);
        let bullet3 = bullets.get(player.x + 20, player.y - 20);

        if (bullet1 && bullet2 && bullet3) {
            bullet1.setActive(true).setVisible(true).setVelocityY(-300).setVelocityX(-100);
            bullet2.setActive(true).setVisible(true).setVelocityY(-300);
            bullet3.setActive(true).setVisible(true).setVelocityY(-300).setVelocityX(100);
        }

        shootSound.play();
        bulletTime = time + 200;
    }

    // Función para subir de nivel
    function levelUp() {
        level += 1;
        meteors.clear(true, true);
        stars.clear(true, true);
        powerUps.clear(true, true);
        levelText.setText('Nivel: ' + level);
        levelUpSound.play();

        levelUpText.setText("¡Subiste al nivel " + level + "!");
        levelUpText.setVisible(true);
        this.time.addEvent({
            delay: 2000,
            callback: () => {
            levelUpText.setVisible(false);
            },
            callbackScope: this,
        });

        // background1.setVisible(true);
        backgroundMusic.stop();
        backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
        backgroundMusic.play();
    }

};
