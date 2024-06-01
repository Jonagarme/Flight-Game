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

  // Eventos de botones
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
    parent: "gameCanvas",
    scene: {
      preload: preload, // Precargar assets
      create: create, // Crear los elementos del juego
      update: update, // Actualizar el estado del juego
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }, // Sin gravedad
        debug: false,
      },
    },
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
  let levelUpText; // Texto para el mensaje de nivel
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
  let gameOver = false;
  let powerUps;
  let lastPowerUpTime = 0;

  // Función para precargar los assets
  function preload() {
    this.load.image("background1", "assets/background1.png");
    this.load.image("background2", "assets/background2.png");
    this.load.image("spaceship", spaceshipImgSrc);
    this.load.image("meteor", "assets/meteor.png");
    this.load.image("bigMeteor", "assets/big_meteor.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("flame", "assets/flame.png");
    this.load.audio("backgroundMusic", "assets/background-music.mp3");
    this.load.audio("shootSound", "assets/shoot-sound.mp3");
    this.load.audio("levelUpSound", "assets/level-up-sound.mp3");
    this.load.image("powerUp", "assets/powerup.png");
    this.load.image("bulletPlus", "assets/bulletPlus.png");
  }

  // Función para crear los elementos del juego
  function create() {
    // Crear fondos
    background1 = this.add.tileSprite(400, 300, 800, 600, "background1");
    background2 = this.add.tileSprite(400, 300, 800, 600, "background2");
    background2.setVisible(false);

    // Crear el jugador
    player = this.physics.add.sprite(400, 500, "spaceship");
    player.setCollideWorldBounds(true); // La nave no puede salir de los límites del mundo

    powerUps = this.physics.add.group();
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);

    // Crear controles de cursor
    cursors = this.input.keyboard.createCursorKeys();

    // Crear grupos de balas, meteoros y estrellas
    bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 10,
    });

    meteors = this.physics.add.group();
    stars = this.physics.add.group();

    // Crear textos de puntuación, nivel y vidas
    scoreText = this.add.text(10, 10, "Puntaje: 0", {
      fontSize: "20px",
      fill: "#fff",
    });
    levelText = this.add.text(700, 10, "Nivel: 1", {
      fontSize: "20px",
      fill: "#fff",
    });
    livesText = this.add.text(10, 40, "Vidas: " + lives, {
      fontSize: "20px",
      fill: "#fff",
    });

    // Crear texto de subida de nivel (inicialmente invisible)
    levelUpText = this.add.text(400, 300, "", {
      fontSize: "40px",
      fill: "#ff0",
    });
    levelUpText.setOrigin(0.5);
    levelUpText.setVisible(false);

    // Cargar música de fondo y sonidos
    backgroundMusic = this.sound.add("backgroundMusic", { loop: true });
    shootSound = this.sound.add("shootSound");
    levelUpSound = this.sound.add("levelUpSound");

    backgroundMusic.play(); // Reproducir música de fondo
  }

  // Función para actualizar el estado del juego
  function update(time, delta) {
    if (gameOver) return; // Si el juego ha terminado, no continuar con la actualización

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

    // Generar nuevas balas
    if (time > lastPowerUpTime) {
      let powerUp = powerUps.create(Phaser.Math.Between(0, 800), 0, "powerUp");
      powerUp.setVelocity(0, Phaser.Math.Between(100, 200));
      lastPowerUpTime = time + Phaser.Math.Between(5000, 10000); // Generar cada 5 a 10 segundos
    }

    bullets.children.each((bullet) => {
      if (bullet.active && (bullet.y < 0 || bullet.y > config.height)) {
        if (bullet.texture.key === "bulletPlus") {
          bullet.destroy();
        } else {
          bullet.setActive(false);
          bullet.setVisible(false);
        }
      }
    }, this);

    // Generar meteoros
    if (time > lastMeteorTime) {
      let meteorType = Math.random() < 0.5 ? "meteor" : "bigMeteor"; // Elegir aleatoriamente el tipo de meteoro
      let meteor = meteors.create(Phaser.Math.Between(0, 800), 0, meteorType);
      meteor.setVelocity(0, Phaser.Math.Between(100, 200));
      lastMeteorTime = time + 2000;
    }

    // Generar estrellas
    if (time > lastStarTime) {
      let star = stars.create(Phaser.Math.Between(0, 800), 0, "star");
      star.setVelocity(0, 150);
      lastStarTime = time + 3000;
    }

    // Verificar colisiones
    this.physics.add.overlap(bullets, meteors, hitMeteor, null, this);
    this.physics.add.overlap(player, meteors, hitPlayer, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
  }

  // Función llamada cuando una bala impacta un meteoro
  function hitMeteor(bullet, meteor) {
    bullet.setActive(false);
    bullet.setVisible(false);
    meteor.destroy();
    incrementaScore.call(this, 10); // Incrementar el puntaje por 10
  }

  // Función llamada cuando el jugador colisiona con un meteoro
  function hitPlayer(player, meteor) {
    meteor.destroy();
    if (lives > 0) {
      lives -= 1;
      livesText.setText("Vidas: " + lives);
      createBlinkEffect.call(this, player); // Llamar a la función de parpadeo
    } else {
      endGame.call(this);
    }
  }

  function collectPowerUp(player, powerUp) {
    powerUp.destroy();
    createEnhancedBullets(); // Llamar a la función para crear balas mejoradas

    // Cambiar el tipo de bala durante 3 segundos
    bullets.children.each((bullet) => {
      bullet.setTexture("bulletPlus"); // Cambiar la textura a 'enhancedBullet'
    });

    // Temporizador para restaurar el tipo de bala después de 3 segundos
    this.time.delayedCall(3000, () => {
      bullets.children.each((bullet) => {
        bullet.setTexture("bullet"); // Restaurar la textura a 'bullet'
      });
    });

    // Destruir balas mejoradas que estén arriba de la pantalla
    bullets.children.each((bullet) => {
      if (bullet.texture.key === "bulletPlus" && bullet.y < 0) {
        bullet.destroy();
      }
    });
  }

  function createEnhancedBullets() {
    let enhancedBullets = bullets.createMultiple({
      key: "enhancedBullet",
      quantity: 5,
      active: false,
      visible: false,
    });

    if (enhancedBullets) {
      enhancedBullets.forEach((bullet) => {
        bullet.setCollideWorldBounds(true);
        bullet.setVelocityY(-500); // Velocidad más rápida que las balas normales
        bullet.setAccelerationY(-500); // Aceleración para que suban más rápido
      });
    }
  }

  // Función para crear un efecto de parpadeo en la nave
  function createBlinkEffect(sprite) {
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 100,
      ease: "Linear",
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        sprite.setAlpha(1); // Asegurarse de que la nave vuelva a ser completamente visible
      },
    });
  }

  // Función para verificar si es necesario subir de nivel
  function checkLevelUp() {
    let residuo = score % 100; // Calcula el residuo
    console.log("Residuo:", residuo); // Mostrar resultado en la consola
    if (score > 0 && residuo === 0) {
      levelUp.call(this);
    }
  }

  // Función para incrementar el puntaje y verificar el nivel
  function incrementaScore(points) {
    score += points;
    scoreText.setText("Puntaje: " + score);

    // Cambiar de nivel cada 100 puntos
    if (score >= level * 100) {
      level += 1;
      levelText.setText("Nivel: " + level);
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

      if (level === 2) {
        background1.setVisible(false);
        background2.setVisible(true);
      }
    }
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
    scoreText.setText("Puntaje: " + score);
    levelText.setText("Nivel: " + level);
    livesText.setText("Vidas: " + lives);
    background1.setVisible(true);
    background2.setVisible(false);
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

  // Función para subir de nivel
  function levelUp() {
    level += 1;
    meteors.clear(true, true);
    stars.clear(true, true);
    levelText.setText("Nivel: " + level);
    levelUpSound.play();
    background1.setVisible(false);
    background2.setVisible(true);
    backgroundMusic.stop();
    backgroundMusic = this.sound.add("backgroundMusic", { loop: true });
    backgroundMusic.play();
  }
};
