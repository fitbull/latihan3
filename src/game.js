import Phaser from "phaser";

const IS_MOBILE_PORTRAIT = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
const MOBILE_HEIGHT = Phaser.Math.Clamp(
  Math.round(720 * window.innerHeight / window.innerWidth),
  1280,
  1600,
);
const WIDTH = IS_MOBILE_PORTRAIT ? 720 : 1280;
const HEIGHT = IS_MOBILE_PORTRAIT ? MOBILE_HEIGHT : 720;
const GAME_SECONDS = 45;
const MOBILE_BALL_SIZE = 124 * 1.15;

document.documentElement.classList.toggle("mobile-portrait", IS_MOBILE_PORTRAIT);

const LAYOUT = IS_MOBILE_PORTRAIT ? {
  header: { x: 360, y: 95, width: 410, height: 180 },
  timer: { x: 108, y: 232, width: 176, height: 117 },
  score: { x: 612, y: 232, width: 176, height: 117 },
  balls: {
    y: Math.round(HEIGHT * 0.493 - MOBILE_BALL_SIZE * 0.25),
    size: MOBILE_BALL_SIZE,
    firstX: 90,
    gap: 180,
    queueGap: 164,
    speed: 0.15,
  },
  bins: [
    { x: 175, y: HEIGHT - 451 },
    { x: 545, y: HEIGHT - 451 },
    { x: 360, y: HEIGHT - 176 },
  ],
  bin: { width: 450, height: 300, zoneWidth: 326, zoneHeight: 195, zoneYOffset: 2 },
} : {
  header: { x: 640, y: 78, width: 360, height: 158 },
  timer: { x: 145, y: 96, width: 153, height: 102 },
  score: { x: 1135, y: 96, width: 153, height: 102 },
  balls: { y: 332, size: 106, firstX: 270, gap: 240, queueGap: 185, speed: 0.12 },
  bins: [
    { x: 354, y: 545 },
    { x: 640, y: 545 },
    { x: 926, y: 545 },
  ],
  bin: { width: 404, height: 269, zoneWidth: 272, zoneHeight: 148, zoneYOffset: 10 },
};

const CATEGORY = {
  plural: { arabic: "الجَمْعُ", color: 0x2875d1, dark: 0x1551a0 },
  dual: { arabic: "المُثَنَّى", color: 0xe64e52, dark: 0xa62937 },
  singular: { arabic: "المُفْرَدُ", color: 0xf2b72e, dark: 0xbd7917 },
};

const WORDS = [
  ["الـمُرْشِدُونَ", "plural", 8], ["الزَّمِيلَاتُ", "plural", 20],
  ["الأَصْدِقَاءُ", "plural", 3], ["الـمُسْلِمُونَ", "plural", 4],
  ["الأُسْتَاذَاتُ", "plural", 14], ["الطَّالِبَاتُ", "plural", 18],
  ["الطُّلَّابُ", "plural", 11], ["الطِّفْلَانِ", "dual", 16],
  ["الـمُعَلِّمَتَانِ", "dual", 9], ["الصُّورَتَانِ", "dual", 19],
  ["الكِتَابَانِ", "dual", 5], ["القِصَّتَانِ", "dual", 10],
  ["اللَّاعِبَانِ", "dual", 2], ["الرَّئِيسُ", "singular", 12],
  ["الوَالِدُ", "singular", 17], ["الوَالِدَةُ", "singular", 6],
  ["العَمُّ", "singular", 13], ["الدَّرَّاجَةُ", "singular", 1],
  ["اليَوْمُ", "singular", 7], ["الصَّدِيقَةُ", "singular", 15],
].map(([word, category, imageNumber], id) => ({ id, word, category, imageNumber }));

class SoundKit {
  constructor() {
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.music = new Audio("/assets/audio/music-background.mp3");
    this.music.preload = "auto";
    this.music.loop = true;
    this.music.volume = 0.16;
    this.effects = Object.fromEntries(["click", "correct", "wrong", "complete"].map((name) => {
      const audio = new Audio(`/assets/audio/sfx-${name}.mp3`);
      audio.preload = "auto";
      return [name, audio];
    }));
  }

  playEffect(name, volume = 0.72) {
    if (!this.soundEnabled || !this.effects[name]) return;
    const audio = this.effects[name].cloneNode(true);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  start() { this.playEffect("click"); this.beginMusic(); }
  correct() { this.playEffect("correct"); }
  wrong() { this.playEffect("wrong"); }
  success() { this.playEffect("complete"); }

  beginMusic() {
    if (!this.musicEnabled || !this.music.paused) return;
    this.music.play().catch(() => {});
  }

  stopMusic() { this.music.pause(); }
  setSoundEnabled(enabled) { this.soundEnabled = Boolean(enabled); }
  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (this.musicEnabled) this.beginMusic(); else this.stopMusic();
  }
}

const sounds = new SoundKit();

function makeText(scene, x, y, text, size, options = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: options.kufi ? '"Noto Kufi Arabic", Arial, sans-serif' : '"Noto Sans Arabic", Arial, sans-serif',
    fontSize: `${size}px`,
    fontStyle: options.bold === false ? "normal" : "bold",
    color: options.color || "#17284b",
    align: options.align || "center",
    direction: options.direction || "rtl",
    stroke: options.stroke,
    strokeThickness: options.strokeThickness || 0,
    wordWrap: options.width ? { width: options.width, useAdvancedWrap: true } : undefined,
  }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
}

function drawFactory(scene, dim = false) {
  const background = scene.add.image(WIDTH / 2, HEIGHT / 2, "factory-background");
  if (IS_MOBILE_PORTRAIT) {
    const coverScale = Math.max(WIDTH / background.width, HEIGHT / background.height);
    background.setScale(coverScale);
  } else {
    background.setDisplaySize(WIDTH, HEIGHT);
  }
  if (dim) scene.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x07172b, 0.52);
  return background;
}

function woodSign(scene, x, y, width, height) {
  const g = scene.add.graphics();
  g.fillStyle(0x6f402a, 1).fillRoundedRect(x - width / 2 + 8, y - height / 2 + 9, width, height, 12);
  g.fillGradientStyle(0xffd36a, 0xffc556, 0xe9953a, 0xf1aa46, 1).fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
  g.lineStyle(4, 0xa85e2c, 0.7).strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
  for (let i = -2; i <= 2; i++) g.lineStyle(2, 0x9b6236, 0.25).lineBetween(x - width / 2 + 20, y + i * 18, x + width / 2 - 20, y + i * 18);
  return g;
}

function createButton(scene, x, y, width, height, label, onClick, options = {}) {
  const shadow = scene.add.rectangle(x, y + 7, width, height, options.shadow || 0x593d2d, 0.72).setOrigin(0.5);
  const bg = scene.add.rectangle(x, y, width, height, options.fill || 0xffffff, 1).setStrokeStyle(3, options.stroke || 0x6d4c3b).setOrigin(0.5);
  const text = makeText(scene, x, y - 2, label, options.size || 28, { color: options.color || "#3e2d29", kufi: true });
  const hit = scene.add.zone(x, y, width, height).setInteractive();
  hit.on("pointerover", () => scene.tweens.add({ targets: [bg, text], scale: 1.035, duration: 110 }));
  hit.on("pointerout", () => scene.tweens.add({ targets: [bg, text], scale: 1, duration: 110 }));
  hit.on("pointerdown", () => {
    scene.tweens.add({ targets: [bg, text], scale: 0.97, yoyo: true, duration: 70 });
    onClick();
  });
  return { shadow, bg, text, hit };
}

function createBin(scene, x, y, category) {
  const { width, height, zoneWidth, zoneHeight, zoneYOffset } = LAYOUT.bin;
  const texture = { plural: "bin-plural", dual: "bin-dual", singular: "bin-singular" }[category];
  const imageYOffset = IS_MOBILE_PORTRAIT ? 26 : 24;
  const image = scene.add.image(x, y + imageYOffset, texture).setDisplaySize(width, height);
  const foreground = scene.add.image(x, y + imageYOffset, texture)
    .setDisplaySize(width, height)
    .setCrop(0, 330, 1920, 750)
    .setDepth(30);
  const zone = scene.add.zone(x, y + zoneYOffset, zoneWidth, zoneHeight)
    .setRectangleDropZone(zoneWidth, zoneHeight);
  zone.category = category;
  zone.image = image;
  zone.foreground = foreground;
  zone.baseScaleX = image.scaleX;
  zone.baseScaleY = image.scaleY;
  zone.stuckBalls = [];
  const openingMaskSource = scene.make.graphics({ x: 0, y: 0, add: false });
  openingMaskSource.fillStyle(0xffffff, 1);
  // Keep the balls constrained to the bin width, but reveal enough vertical
  // space for all three stacked rows instead of clipping their top edges.
  const openingWidth = IS_MOBILE_PORTRAIT ? 300 : 250;
  const openingHeight = IS_MOBILE_PORTRAIT ? 250 : 180;
  const openingY = y - openingHeight;
  openingMaskSource.fillRoundedRect(x - openingWidth / 2, openingY, openingWidth, openingHeight, 20);
  zone.ballMaskSource = openingMaskSource;
  zone.ballMask = openingMaskSource.createGeometryMask();
  return zone;
}

function attachCustomPointer(scene) {
  if (IS_MOBILE_PORTRAIT) {
    scene.game.canvas.style.cursor = "default";
    return null;
  }
  scene.game.canvas.style.cursor = "none";
  const cursor = scene.add.image(-200, -200, "game-pointer")
    .setDisplaySize(122, 122)
    .setDepth(1000)
    .setScrollFactor(0);
  const move = (pointer) => cursor.setPosition(pointer.x + 11, pointer.y + 34).setVisible(true);
  scene.input.on("pointermove", move);
  scene.input.on("gameout", () => cursor.setVisible(false));
  scene.input.on("gameover", (pointer) => move(pointer));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off("pointermove", move);
  });
  return cursor;
}

function addTimerWidget(scene, x, y, value = "00:45") {
  const panel = scene.add.image(x, y, "timer-panel").setDisplaySize(LAYOUT.timer.width, LAYOUT.timer.height);
  const text = makeText(scene, x, y + (IS_MOBILE_PORTRAIT ? 21 : 18), value, IS_MOBILE_PORTRAIT ? 28 : 24, {
    color: "#087f9b",
    direction: "ltr",
    stroke: "#ffffff",
    strokeThickness: 2,
  });
  text.panel = panel;
  return text;
}

function addScoreWidget(scene, x, y, score = 0) {
  const panel = scene.add.image(x, y, "score-panel").setDisplaySize(LAYOUT.score.width, LAYOUT.score.height);
  const barWidth = IS_MOBILE_PORTRAIT ? 134 : 116;
  const barHeight = IS_MOBILE_PORTRAIT ? 22 : 19;
  const barY = IS_MOBILE_PORTRAIT ? y + 8 : y + 7;
  const background = scene.add.graphics();
  background.fillStyle(0x6d7480, 0.42).fillRoundedRect(x - barWidth / 2, barY, barWidth, barHeight, 10);
  background.lineStyle(2, 0xffffff, 0.9).strokeRoundedRect(x - barWidth / 2, barY, barWidth, barHeight, 10);
  const fill = scene.add.graphics();
  const text = makeText(scene, x, y + (IS_MOBILE_PORTRAIT ? 19 : 16.5), "٢٠ / ٠", IS_MOBILE_PORTRAIT ? 16 : 14, {
    color: "#ffffff",
    direction: "ltr",
    stroke: "#8f4a42",
    strokeThickness: 2,
  });
  const widget = { x, y, panel, background, fill, text, barWidth, barHeight, barY };
  updateScoreWidget(widget, score);
  return widget;
}

function updateScoreWidget(widget, score) {
  const arabicDigits = (value) => String(value).replace(/\d/g, (n) => "٠١٢٣٤٥٦٧٨٩"[n]);
  const inset = IS_MOBILE_PORTRAIT ? 6 : 5;
  const width = Math.round((widget.barWidth - inset) * Phaser.Math.Clamp(score / WORDS.length, 0, 1));
  widget.fill.clear();
  if (width > 0) {
    widget.fill.fillGradientStyle(0xffa55f, 0xff6c69, 0xff8c5e, 0xff5c68, 1);
    widget.fill.fillRoundedRect(
      widget.x - widget.barWidth / 2 + inset / 2,
      widget.barY + 2,
      width,
      widget.barHeight - 4,
      8,
    );
  }
  widget.text.setText(`٢٠ / ${arabicDigits(score)}`);
}

function queueGameAssets(scene) {
  scene.load.image("factory-background", "assets/images/factory-background.png");
  scene.load.image("cover-title", "assets/images/cover-title.png");
  scene.load.image("cover-start", "assets/images/cover-start.png");
  scene.load.image("instruction-sign-blank", "assets/images/instruction-sign-blank.png");
  scene.load.image("instruction-sign-text", "assets/images/instruction-sign-text.png");
  scene.load.image("result-panel-empty", "assets/images/result-panel-empty-green.png");
  scene.load.image("timer-panel", "assets/images/timer-panel.png");
  scene.load.image("score-panel", "assets/images/score-panel.png");
  scene.load.image("game-pointer", "assets/images/game-pointer.png");
  scene.load.image("bin-plural", "assets/images/bin-plural.png");
  scene.load.image("bin-dual", "assets/images/bin-dual.png");
  scene.load.image("bin-singular", "assets/images/bin-singular.png");
  scene.load.image("feedback-wrong", "assets/images/feedback-wrong.png");
  scene.load.image("feedback-correct", "assets/images/feedback-correct.png");
  scene.load.image("result-stars-2", "assets/images/results/stars-2.png");
  scene.load.image("result-stars-3", "assets/images/results/stars-3.png");
  scene.load.image("result-stars-4", "assets/images/results/stars-4.png");
  scene.load.image("result-stars-5", "assets/images/results/stars-5.png");
  scene.load.image("result-try-again", "assets/images/results/result-try-again.png");
  scene.load.image("result-satisfactory", "assets/images/results/result-satisfactory.png");
  scene.load.image("result-very-good", "assets/images/results/result-very-good.png");
  scene.load.image("result-best", "assets/images/results/result-best.png");
  scene.load.image("button-menu", "assets/images/results/button-menu.png");
  scene.load.image("button-replay", "assets/images/results/button-replay.png");
  for (let imageNumber = 1; imageNumber <= WORDS.length; imageNumber += 1) {
    scene.load.image(`word-ball-${imageNumber}`, `assets/images/balls/ball-${imageNumber}.png`);
  }
}

class LoadingScene extends Phaser.Scene {
  constructor() { super("loading"); }

  preload() {
    this.cameras.main.setBackgroundColor("#10243d");
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const barWidth = IS_MOBILE_PORTRAIT ? 520 : 560;
    const barHeight = IS_MOBILE_PORTRAIT ? 38 : 30;

    makeText(this, centerX, centerY - 105, "جَارِي التَّحْمِيلُ", IS_MOBILE_PORTRAIT ? 42 : 34, {
      color: "#ffffff",
      kufi: true,
      stroke: "#17375e",
      strokeThickness: 4,
    });
    const track = this.add.graphics();
    track.fillStyle(0x07172b, 0.72);
    track.fillRoundedRect(centerX - barWidth / 2, centerY - barHeight / 2, barWidth, barHeight, barHeight / 2);
    track.lineStyle(3, 0xffffff, 0.82);
    track.strokeRoundedRect(centerX - barWidth / 2, centerY - barHeight / 2, barWidth, barHeight, barHeight / 2);
    const progressBar = this.add.graphics();
    const progressText = makeText(this, centerX, centerY + 72, "0%", IS_MOBILE_PORTRAIT ? 34 : 26, {
      color: "#ffffff",
      direction: "ltr",
    });

    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillGradientStyle(0x4cbee0, 0x4cbee0, 0x2875d1, 0x2875d1, 1);
      progressBar.fillRoundedRect(
        centerX - barWidth / 2 + 5,
        centerY - barHeight / 2 + 5,
        Math.max(0, (barWidth - 10) * value),
        barHeight - 10,
        (barHeight - 10) / 2,
      );
      progressText.setText(`${Math.round(value * 100)}%`);
    });
    this.load.on("loaderror", () => {
      progressText.setText("Gagal memuat aset").setColor("#ff6b6b");
    });

    queueGameAssets(this);
  }

  create() {
    this.textures.get("cover-title").add("trimmed", 0, 127, 136, 939, 659);
    this.textures.get("cover-start").add("trimmed", 0, 175, 153, 1571, 382);
    this.textures.get("instruction-sign-text").add("trimmed", 0, 69, 285, 1784, 437);
    this.textures.get("result-panel-empty").add("trimmed", 0, 448, 0, 938, 1154);
    const openCover = () => this.scene.start("cover");
    if (document.fonts?.ready) {
      document.fonts.ready.then(openCover, openCover);
    } else {
      openCover();
    }
  }
}

class CoverScene extends Phaser.Scene {
  constructor() { super("cover"); }

  create() {
    sounds.stopMusic();
    const background = drawFactory(this);
    const introBins = ["plural", "dual", "singular"].map((category, index) => {
      const position = LAYOUT.bins[index];
      return createBin(this, position.x, position.y, category);
    });
    const introTimer = addTimerWidget(this, LAYOUT.timer.x, LAYOUT.timer.y);
    const introScore = addScoreWidget(this, LAYOUT.score.x, LAYOUT.score.y, 0);
    const glassObjects = [
      background,
      ...introBins.flatMap((bin) => [bin.image, bin.foreground]),
      introTimer.panel,
      introTimer,
      introScore.panel,
      introScore.background,
      introScore.fill,
      introScore.text,
    ];
    const glassLayer = this.add.renderTexture(0, 0, WIDTH, HEIGHT).setOrigin(0);
    glassLayer.draw(glassObjects);
    glassObjects.forEach((object) => object.setVisible(false));
    glassLayer.postFX.addBlur(1, 2, 2, 0.8, 0xffffff, 2);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xf3f8ff, 0.11);

    const coverTitle = this.add.image(
      WIDTH / 2,
      IS_MOBILE_PORTRAIT ? Math.round(HEIGHT * 0.32) : 280,
      "cover-title",
      "trimmed",
    );
    const coverTitleWidth = IS_MOBILE_PORTRAIT ? 510 : 430;
    coverTitle.setScale(coverTitleWidth / coverTitle.width);
    const startButton = this.add.image(
      WIDTH / 2,
      IS_MOBILE_PORTRAIT ? Math.round(HEIGHT * 0.56) : 525,
      "cover-start",
      "trimmed",
    );
    const startButtonWidth = IS_MOBILE_PORTRAIT ? 330 : 285;
    startButton.setScale(startButtonWidth / startButton.width)
      .setInteractive({ pixelPerfect: true, alphaTolerance: 16 });
    const buttonScaleX = startButton.scaleX;
    const buttonScaleY = startButton.scaleY;
    startButton.on("pointerover", () => this.tweens.add({
      targets: startButton,
      scaleX: buttonScaleX * 1.035,
      scaleY: buttonScaleY * 1.035,
      duration: 130,
      ease: "Sine.easeOut",
    }));
    startButton.on("pointerout", () => this.tweens.add({
      targets: startButton,
      scaleX: buttonScaleX,
      scaleY: buttonScaleY,
      duration: 130,
      ease: "Sine.easeOut",
    }));
    startButton.on("pointerdown", () => {
      sounds.start();
      if (IS_MOBILE_PORTRAIT && document.fullscreenEnabled && !document.fullscreenElement) {
        document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      }
      this.tweens.add({
        targets: startButton,
        scaleX: buttonScaleX * 0.96,
        scaleY: buttonScaleY * 0.96,
        yoyo: true,
        duration: 80,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.cameras.main.fadeOut(280, 17, 36, 61);
          this.time.delayedCall(280, () => this.scene.start("game"));
        },
      });
    });
    attachCustomPointer(this);
    this.cameras.main.fadeIn(320, 17, 36, 61);
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super("game"); }

  create() {
    this.score = 0;
    this.remaining = GAME_SECONDS;
    this.ended = false;
    this.balls = [];
    this.dragging = null;
    this.feedbackLock = false;
    drawFactory(this);
    const instructionSign = this.add.image(WIDTH / 2, LAYOUT.header.y, "instruction-sign-text", "trimmed");
    const instructionWidth = IS_MOBILE_PORTRAIT ? 600 : 520;
    instructionSign.setScale(instructionWidth / instructionSign.width);

    this.drawTimer();
    this.drawScore();
    this.bins = {};
    ["plural", "dual", "singular"].forEach((category, index) => {
      const position = LAYOUT.bins[index];
      this.bins[category] = createBin(this, position.x, position.y, category);
    });

    Phaser.Utils.Array.Shuffle([...WORDS]).forEach((data, index) => this.createBall(data, index));
    this.input.on("dragstart", (_pointer, ball) => {
      if (this.ended || !ball.active) return;
      this.dragging = ball;
      ball.setDepth(100);
      ball.homeX = ball.x;
      ball.homeY = ball.y;
      this.tweens.add({ targets: ball, scale: 1.12, duration: 90 });
    });
    this.input.on("drag", (_pointer, ball, dragX, dragY) => {
      if (!ball.active) return;
      ball.setPosition(dragX, dragY);
    });
    this.input.on("dragenter", (_pointer, _ball, zone) => this.highlightBin(zone, true));
    this.input.on("dragleave", (_pointer, _ball, zone) => this.highlightBin(zone, false));
    this.input.on("drop", (_pointer, ball, zone) => {
      this.highlightBin(zone, false);
      this.resolveDrop(ball, zone);
      ball.dropped = true;
    });
    this.input.on("dragend", (_pointer, ball, dropped) => {
      this.dragging = null;
      ball.setDepth(20);
      if (!dropped && ball.active) this.returnBall(ball);
    });

    this.clock = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended) return;
        this.remaining = Math.max(0, this.remaining - 1);
        if (this.remaining === 0) {
          this.timerText.setText("00:00").setColor("#ff3b30");
          this.finishGame();
          return;
        }
        this.updateTimer();
      },
    });
    sounds.beginMusic();
    attachCustomPointer(this);
    this.cameras.main.fadeIn(260, 17, 36, 61);
  }

  drawTimer() {
    this.timerText = addTimerWidget(this, LAYOUT.timer.x, LAYOUT.timer.y, "00:45");
  }

  drawScore() {
    this.scoreWidget = addScoreWidget(this, LAYOUT.score.x, LAYOUT.score.y, 0);
    this.scoreText = this.scoreWidget.text;
  }

  updateTimer() {
    this.timerText.setText(`00:${String(this.remaining).padStart(2, "0")}`);
    if (this.remaining <= 10) {
      this.timerText.setColor("#ff3b30");
      this.tweens.add({ targets: this.timerText, scale: 1.15, yoyo: true, duration: 170 });
    }
  }

  updateScore() {
    updateScoreWidget(this.scoreWidget, this.score);
  }

  createBall(data, index) {
    // Four balls are visible on entry; the remaining balls queue just off-screen.
    const startX = index < 4
      ? LAYOUT.balls.firstX + index * LAYOUT.balls.gap
      : -110 - (index - 4) * LAYOUT.balls.queueGap;
    const textureKey = `word-ball-${data.imageNumber}`;
    const ballSize = LAYOUT.balls.size;
    const ball = this.add.container(startX, LAYOUT.balls.y).setSize(ballSize, ballSize).setDepth(20);
    const shadowOuter = this.add.ellipse(4, ballSize * 0.45, ballSize * 0.77, ballSize * 0.14, 0x111827, 0.13);
    const shadowInner = this.add.ellipse(3, ballSize * 0.44, ballSize * 0.6, ballSize * 0.085, 0x111827, 0.24);
    const image = this.add.image(0, 0, textureKey).setDisplaySize(ballSize, ballSize);
    ball.add([shadowOuter, shadowInner, image]);
    // `data` is reserved by Phaser for its DataManager. Overwriting it with a
    // plain object makes Container.destroy() crash during scene transitions.
    ball.wordData = data;
    ball.conveyorIndex = index;
    ball.setInteractive(
      new Phaser.Geom.Circle(ballSize / 2, ballSize / 2, ballSize * 0.47),
      Phaser.Geom.Circle.Contains,
    );
    this.input.setDraggable(ball);
    this.balls.push(ball);
  }

  update(_time, delta) {
    if (this.ended) return;
    for (const ball of this.balls) {
      if (!ball.active || ball === this.dragging || ball.returning) continue;
      // 120 px/s ensures even the twentieth ball enters the play area well
      // before the 45-second round ends.
      ball.x += delta * LAYOUT.balls.speed;
      if (ball.x > WIDTH + 90) {
        const leftmost = Math.min(...this.balls.filter((b) => b.active && b !== ball).map((b) => b.x), -90);
        ball.x = leftmost - 185;
      }
    }
  }

  highlightBin(zone, active) {
    if (!zone) return;
    this.tweens.killTweensOf([zone.image, zone.foreground]);
    this.tweens.add({
      targets: [zone.image, zone.foreground],
      scaleX: zone.baseScaleX * (active ? 1.2 : 1),
      scaleY: zone.baseScaleY * (active ? 1.2 : 1),
      duration: 120,
      ease: "Sine.easeOut",
    });
  }

  resolveDrop(ball, zone) {
    if (this.ended || !ball.active) return;
    if (zone.category === ball.wordData.category) {
      this.score += 1;
      this.updateScore();
      sounds.correct();
      this.showFeedback(ball.x, ball.y - 72, true);
      ball.disableInteractive();
      ball.setActive(false);
      ball.setMask(zone.ballMask);
      zone.stuckBalls.push(ball);
      const count = zone.stuckBalls.length;
      zone.stuckBalls.forEach((stuckBall, stuckIndex) => {
        const row = Math.floor(stuckIndex / 3);
        const column = stuckIndex % 3;
        const rowCount = Math.min(3, count - row * 3);
        const spacing = IS_MOBILE_PORTRAIT ? 68 : 62;
        const rowWidth = spacing * (rowCount - 1);
        const depth = 22 - row;
        stuckBall.setDepth(depth);
        this.tweens.add({
          targets: stuckBall,
          x: zone.x - rowWidth / 2 + column * spacing,
          y: zone.y - (IS_MOBILE_PORTRAIT ? 52 : 42) - row * (IS_MOBILE_PORTRAIT ? 22 : 20),
          scale: IS_MOBILE_PORTRAIT ? 0.82 : 1,
          alpha: 1,
          duration: 360,
          ease: "Back.easeOut",
          onComplete: stuckBall === ball ? () => {
            ball.setVisible(true);
            if (this.score === WORDS.length) this.time.delayedCall(350, () => this.finishGame());
          } : undefined,
        });
      });
      this.time.delayedCall(0, () => zone.stuckBalls.forEach((stuckBall, stuckIndex) => {
        stuckBall.setDepth(22 - Math.floor(stuckIndex / 3));
      }));
    } else {
      sounds.wrong();
      this.showFeedback(ball.x, ball.y - 72, false);
      this.cameras.main.shake(150, 0.004);
      this.returnBall(ball);
    }
  }

  showFeedback(x, y, correct) {
    const feedback = this.add.image(x, y - 100, correct ? "feedback-correct" : "feedback-wrong")
      .setDisplaySize(55, 55)
      .setAlpha(0)
      .setDepth(161);
    this.tweens.add({
      targets: feedback,
      y: y - 24,
      alpha: 1,
      duration: 280,
      ease: "Back.easeOut",
      onComplete: () => this.tweens.add({
        targets: feedback,
        y: y + 20,
        alpha: 0,
        delay: 180,
        duration: 420,
        ease: "Sine.easeIn",
        onComplete: () => feedback.destroy(),
      }),
    });
  }

  returnBall(ball) {
    if (!ball.active) return;
    ball.returning = true;
    this.tweens.add({
      targets: ball,
      x: Phaser.Math.Clamp(ball.homeX ?? ball.x, 70, WIDTH - 70),
      y: ball.homeY ?? LAYOUT.balls.y,
      scale: 1,
      duration: 330,
      ease: "Back.easeOut",
      onComplete: () => { ball.returning = false; },
    });
  }

  finishGame() {
    if (this.ended) return;
    this.ended = true;
    const finalScore = this.score;
    this.clock?.remove(false);
    sounds.stopMusic();
    this.scene.start("result", { score: finalScore });
  }
}

class ResultScene extends Phaser.Scene {
  constructor() { super("result"); }

  init(data) { this.finalScore = data.score ?? 0; }

  create() {
    sounds.stopMusic();
    try {
      sounds.success();
    } catch (_error) {
      // Audio must never prevent the result scene from opening.
    }
    const background = drawFactory(this);
    const resultBins = ["plural", "dual", "singular"].map((category, index) => {
      const position = LAYOUT.bins[index];
      return createBin(this, position.x, position.y, category);
    });
    // These bins are only part of the blurred result backdrop. Leaving their
    // drop zones enabled can intercept taps from the result controls on mobile.
    resultBins.forEach((bin) => bin.disableInteractive());
    const resultTimer = addTimerWidget(this, LAYOUT.timer.x, LAYOUT.timer.y, "00:00");
    resultTimer.setColor("#ff3b30");
    const resultScore = addScoreWidget(this, LAYOUT.score.x, LAYOUT.score.y, this.finalScore);
    const glassObjects = [
      background,
      ...resultBins.flatMap((bin) => [bin.image, bin.foreground]),
      resultTimer.panel,
      resultTimer,
      resultScore.panel,
      resultScore.background,
      resultScore.fill,
      resultScore.text,
    ];
    const glassLayer = this.add.renderTexture(0, 0, WIDTH, HEIGHT).setOrigin(0);
    glassLayer.draw(glassObjects);
    glassObjects.forEach((object) => object.setVisible(false));
    glassLayer.postFX.addBlur(1, 2, 2, 0.8, 0xffffff, 2);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xf3f8ff, 0.11);

    const resultPanelY = IS_MOBILE_PORTRAIT ? Math.round(HEIGHT * 0.36) - 25 : 305;
    const resultPanelWidth = IS_MOBILE_PORTRAIT ? 620 : 520;
    const resultPanelScale = resultPanelWidth / 938;
    const ropeExtension = 333 * resultPanelScale;
    this.add.image(WIDTH / 2, resultPanelY - ropeExtension / 2, "result-panel-empty", "trimmed")
      .setDisplaySize(resultPanelWidth, 1154 * resultPanelScale);
    makeText(
      this,
      WIDTH / 2 - (IS_MOBILE_PORTRAIT ? 137 : 111),
      resultPanelY - (IS_MOBILE_PORTRAIT ? 46 : 40),
      `${this.toArabic(this.finalScore)} / ٢٠`,
      IS_MOBILE_PORTRAIT ? 48 : 43,
      {
      color: "#17205c",
      kufi: true,
      },
    );

    const stars = this.getStars(this.finalScore);
    const starImage = this.add.image(
      WIDTH / 2,
      resultPanelY + (IS_MOBILE_PORTRAIT ? 80 : 70),
      `result-stars-${stars}`,
    ).setDisplaySize(IS_MOBILE_PORTRAIT ? 360 : 293, IS_MOBILE_PORTRAIT ? 76 : 62);
    const starScaleX = starImage.scaleX;
    const starScaleY = starImage.scaleY;
    starImage.setScale(0);
    this.tweens.add({ targets: starImage, scaleX: starScaleX, scaleY: starScaleY, duration: 520, delay: 180, ease: "Back.easeOut" });

    const messageY = resultPanelY + (IS_MOBILE_PORTRAIT ? 180 : 155);
    const resultMessage = this.add.image(WIDTH / 2, messageY, this.getResultTexture(this.finalScore))
      .setDisplaySize(IS_MOBILE_PORTRAIT ? 330 : 255, IS_MOBILE_PORTRAIT ? 84 : 65);
    resultMessage.setAlpha(0).setY(messageY - 20);
    this.tweens.add({ targets: resultMessage, y: messageY, alpha: 1, duration: 380, delay: 520, ease: "Sine.easeOut" });

    if (IS_MOBILE_PORTRAIT) {
      this.createDomResultButton(
        190,
        resultPanelY + 375,
        "button-replay.png",
        "Main semula",
        () => this.scene.start("game"),
      );
      this.createDomResultButton(
        530,
        resultPanelY + 375,
        "button-menu.png",
        "Kembali ke menu utama",
        () => this.scene.start("cover"),
      );
    } else {
      this.createImageButton(510, 590, "button-menu", () => this.scene.start("cover"));
      this.createImageButton(770, 590, "button-replay", () => this.scene.start("game"));
    }
    attachCustomPointer(this);
    this.cameras.main.fadeIn(300, 17, 36, 61);
  }

  toArabic(value) { return String(value).replace(/\d/g, (n) => "٠١٢٣٤٥٦٧٨٩"[n]); }
  getStars(score) { return score <= 5 ? 2 : score <= 10 ? 3 : score <= 15 ? 4 : 5; }
  getResultTexture(score) {
    if (score <= 5) return "result-try-again";
    if (score <= 10) return "result-satisfactory";
    if (score <= 15) return "result-very-good";
    return "result-best";
  }

  createDomResultButton(x, y, imageName, label, onClick, width = 300, height = 84) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-result-button";
    button.setAttribute("aria-label", label);
    button.style.backgroundImage = `url("/assets/images/results/${imageName}")`;

    const syncToCanvas = () => {
      const canvasBounds = this.game.canvas.getBoundingClientRect();
      const scaleX = canvasBounds.width / WIDTH;
      const scaleY = canvasBounds.height / HEIGHT;
      button.style.left = `${canvasBounds.left + (x - width / 2) * scaleX}px`;
      button.style.top = `${canvasBounds.top + (y - height / 2) * scaleY}px`;
      button.style.width = `${width * scaleX}px`;
      button.style.height = `${height * scaleY}px`;
    };
    const stopCanvasInput = (event) => event.stopPropagation();
    const activate = (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.disabled = true;
      sounds.playEffect("click");
      if (imageName === "button-replay.png") sounds.beginMusic();
      onClick();
    };

    button.addEventListener("pointerdown", stopCanvasInput);
    button.addEventListener("pointerup", stopCanvasInput);
    button.addEventListener("click", activate);
    document.body.appendChild(button);
    syncToCanvas();
    window.addEventListener("resize", syncToCanvas);
    document.addEventListener("fullscreenchange", syncToCanvas);
    window.visualViewport?.addEventListener("resize", syncToCanvas);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("resize", syncToCanvas);
      document.removeEventListener("fullscreenchange", syncToCanvas);
      window.visualViewport?.removeEventListener("resize", syncToCanvas);
      button.remove();
    });
  }

  createImageButton(x, y, texture, onClick, width = 230, height = 64) {
    const button = this.add.image(x, y, texture).setDisplaySize(width, height).setInteractive();
    const baseScaleX = button.scaleX;
    const baseScaleY = button.scaleY;
    button.on("pointerover", () => this.tweens.add({
      targets: button,
      scaleX: baseScaleX * 1.06,
      scaleY: baseScaleY * 1.06,
      duration: 110,
      ease: "Sine.easeOut",
    }));
    button.on("pointerout", () => this.tweens.add({
      targets: button,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      duration: 110,
      ease: "Sine.easeOut",
    }));
    button.on("pointerdown", () => {
      sounds.playEffect("click");
      if (texture === "button-replay") sounds.beginMusic();
      this.tweens.killTweensOf(button);
      this.tweens.add({
        targets: button,
        scaleX: baseScaleX * 0.96,
        scaleY: baseScaleY * 0.96,
        yoyo: true,
        duration: 70,
      });
      this.time.delayedCall(90, onClick);
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#10243d",
  scene: [LoadingScene, CoverScene, GameScene, ResultScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false, roundPixels: false },
  input: { activePointers: 3 },
});
