// const BASE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const BASE_LETTERS = ['AFIEF', 'AKU', 'BACA', 'BEMO', 'BUDI', 'KINAS', 'KOTA', 'PUTRI', 'SEPEDA', 'TULIS', 'UANG', 'LIMA', 'IKAN', 'HARI', 'GAJAH', 'FAJAR', 'EMAS', 'DINO', 'CARI', 'MAKAN', 'JALAN', 'KACA', 'MATA'];

const baseConfig = {
  type: Phaser.AUTO,
  parent: 'gameEl',
  dom: {
    createContainer: true
  },
  scene: {
    preload: preload,
    create: create
  }
};

let game
function handleWindowLoad() {
  const config = {
    ...baseConfig,
    width: window.innerWidth,
    height: window.innerHeight
  }

  game = new Phaser.Game(config);
}

window.addEventListener("load", handleWindowLoad);

const Background = new Phaser.Class({
  Extends: Phaser.GameObjects.Container,
  initialize: function Background(scene, x, y) {
    Phaser.GameObjects.Container.call(this, scene);

    const image = this.createOne(scene, 0)
    this.add(image)
    this.add(this.createOne(scene, 0 - image.height * image.scaleY))
    this.add(this.createOne(scene, image.height * image.scaleY))
    this.add(this.createOne(scene, image.height * 2 * image.scaleY))

    const keepMove = () => {
      scene.tweens.add({
        targets: this,
        duration: 10000,
        y: 0 + image.height * image.scaleY,
        delay: 0,
        onComplete: () => {
          this.y = 0;
          keepMove();
        }
      })
    }
    keepMove()
  },
  createOne: function (scene, y) {
    const image = new Phaser.GameObjects.Sprite(scene, 0, 0, 'bg');
    image.setDisplayOrigin(0, 0)
    image.setDisplaySize(scene.game.canvas.width, scene.game.canvas.width * image.height / image.width)
    image.setPosition(0, y);
    return image
  }
});

function preload() {
  this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
  this.load.atlasXML('space', 'assets/spaceShooter2_spritesheet.png', 'assets/spaceShooter2_spritesheet.xml');
  this.load.image("bg", "assets/bg.jpg")
  this.load.image("star", "assets/star.png")

  this.load.audio(`audio_manakah`, `assets/audios/Manakah.mp3`);
  this.load.audio(`audio_explosion`, `assets/audios/explosion.mp3`);
  this.load.audio(`audio_completed`, `assets/audios/mission_completed.ogg`);
  BASE_LETTERS.forEach((letter) => {
    this.load.audio(`audio_${letter}`, `assets/audios/${letter}.mp3`);
  })

  window._this = this;
}

function create() {
  this.input.mouse.disableContextMenu();
  this.children.add(new Background(this, 0, 0));

  // cache audios
  const audios = {};
  BASE_LETTERS.forEach((letter) => {
    audios[letter] = this.sound.add(`audio_${letter}`);
  });
  audios.manakah = this.sound.add('audio_manakah');
  audios.explosion = this.sound.add('audio_explosion');
  audios.completed = this.sound.add("audio_completed");

  const options = [];
  let isShooting = false;
  let answer = '';
  let answerCorrect = 0;
  let answerTotal = 0;

  const createShip = () => {
    const atlasTexture = this.textures.get('space')
    // const spaceShip = atlasTexture.get("spaceShips");
    const sprite = this.add.image(0, 0, "space", "spaceShips_005.png");
    sprite.angle = 180;
    this._space = this.add.container(this.game.canvas.width / 2, this.game.canvas.height + 50, [sprite]);

    sprite.setInteractive().on('pointerup', () => {
      if (answer) {
        audios[answer].play();
      }
    });

    this.tweens.add({
      targets: this._space,
      duration: 2000,
      y: this.game.canvas.height - 100,
      ease: 'Back',
      easeParams: [4],
      delay: 0,
      onComplete: generateLevel
    })
  }

  const generateLevel = () => {
    const letters = [...BASE_LETTERS];
    const n = 4;
    const padding = game.canvas.width / (n + 1);
    const ta = []

    for (let i = 0; i < n; i++) {
      const hi = Math.floor(Math.random() * letters.length);
      const letter = letters[hi];
      letters.splice(hi, 1);

      options.push(addOptions(letter, padding * (i + 1), (i % 2) * (this.game.canvas.height / 6) + 100, i))
      ta.push(letter)
    }

    answer = ta[Math.floor(Math.random() * n)]
    audios.manakah.play();
    setTimeout(() => {
      audios[answer].play();
    }, 1000);
  }

  const destroyAnim = (x, y) => {
    const parts = []
    parts.push(this.add.image(x, y, "space", `spaceMeteors_001.png`));
    parts.push(this.add.image(x, y, "space", `spaceMeteors_002.png`));
    parts.push(this.add.image(x, y, "space", `spaceMeteors_003.png`));
    parts.push(this.add.image(x, y, "space", `spaceMeteors_004.png`));

    parts.forEach((p, index) => {
      p.setScale(0.2)
      this.tweens.add({
        targets: p,
        duration: Math.random() * 200 + 300,
        y: y - (Math.random() * 50 + 70),
        x: x + (index - parts.length / 2) * 50,
        ease: 'Power1',
        alpha: 0.2,
        onComplete: () => {
          p.destroy();
        }
      })
    })
  }

  const destroyOptions = (i = -1) => {
    if (i >= 0 && options[i]) {
      destroyAnim(options[i].x, options[i].y);
      options[i].destroy();
      options.splice(i, 1)
    } else {
      options.forEach((option) => {
        destroyAnim(option.x, option.y);
        option.destroy();
      })
      options.splice(0, options.length)
    }
  }

  const handleOptionClick = (x, y, val, index) => {
    if (isShooting) return false;
    isShooting = true;
    const mis = this.add.image(this._space.x, this._space.y, 'space', 'spaceMissiles_001.png');
    const misRotate = Phaser.Math.Angle.Between(mis.x, mis.y, x, y) + Phaser.Math.DegToRad(90);
    mis.rotation = misRotate;

    const judge = () => {
      audios.explosion.play();
      mis.destroy();

      answerTotal++;
      if (val === answer) {
        destroyOptions();
        setTimeout(() => { // reset level or final
          if (answerTotal >= 12) {
            finalBoard();
          } else {
            generateLevel();
          }
        }, 500);
        answerCorrect++;
      } else {
        if (answerCorrect > 0) answerCorrect--;
        destroyOptions(index);
      }
      isShooting = false;
    }

    this.tweens.add({
      targets: this._space,
      duration: 100,
      rotation: misRotate
    })

    this.tweens.add({
      targets: mis,
      duration: 500,
      x: x,
      y: y,
      onComplete: judge
    })
  }

  const addOptions = (text, x, y, index) => {
    const bg = this.add.image(0, 0, "space", `spaceMeteors_00${index + 1}.png`);
    const t = this.add.text(0, 0, text, { fontFamily: 'Finger Paint', fontSize: 50, color: '#ffffff' });
    t.setOrigin(0.5, 0.5);

    const g = this.add.container(x, -50, [bg, t]);
    bg.setInteractive().on('pointerup', () => handleOptionClick(x, y, text, index)); // on click

    g.setScale(0.5)

    this.tweens.add({
      targets: g,
      duration: (Math.random() * 1000) + 1000,
      y: y,
      ease: 'Power1',
      easeParams: [2]
    })
    return g
  }

  const addStar = (x, y, alpha = 1, angle = 0) => {
    const star = this.add.image(x, y, 'star');
    star.alpha = alpha
    star.angle = angle
    return star
  }

  const finalBoard = () => {
    const numStar = Math.floor(answerCorrect / answerTotal * 3);
    const padding = this.game.canvas.width / 4
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const star = addStar(padding * (i + 1), -100, i < numStar ? 1 : 0.3, (i - 1) * 10);
      this.tweens.add({
        targets: star,
        duration: 1000,
        y: this.game.canvas.height / 5 + Math.abs((i - 1) * 20),
        ease: 'Back',
        delay: i * 300,
        easeParams: [4]
      })
      stars.push(star);
    }
    
    audios.completed.play();

    initializeButton("Ulangi", this.game.canvas.width / 2, this.game.canvas.height / 7 * 4, () => {
      answerTotal = 0;
      answerCorrect = 0;
      answer = '';
      stars.forEach((s) => {
        s.destroy();
      })
      generateLevel();
    })
  }

  const initializeButton = (label, x, y, onclick = () => { }) => {
    const menuBg = this.add.image(0, 0, 'space', 'spaceRockets_004.png')
    menuBg.angle = 90;
    const text = this.add.text(0, 0, label, { fontFamily: 'Finger Paint', fontSize: 50, color: '#444444' });
    text.setOrigin(0.5, 0.5)

    const g = this.add.container(x, y, [menuBg, text]);
    g.setScale(0.5, 0.5);

    menuBg.setInteractive().on('pointerup', () => {
      onclick();
      g.destroy();
    }); // on click
  }

  const initializeMenu = () => {
    initializeButton("Mulai", this.game.canvas.width / 2, this.game.canvas.height / 7 * 6, () => {
      createShip();
    })
  }

  WebFont.load({
    google: {
      families: ['Freckle Face', 'Finger Paint', 'Nosifer']
    },
    active: initializeMenu
  });
}
