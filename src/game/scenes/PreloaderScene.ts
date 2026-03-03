import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super("PreloaderScene");
  }

  preload() {
    this.load.on("progress", (value: number) => {
      EventBus.emit("loading-progress", value);
    });

    this.load.on("complete", () => {
      EventBus.emit("loading-complete");
    });

    // Load all game assets here
    // this.load.image('player', 'assets/player.png');
    // this.load.spritesheet('enemies', 'assets/enemies.png', { frameWidth: 64, frameHeight: 64 });
    // this.load.audio('bgm', 'assets/audio/bgm.mp3');
  }

  create() {
    // Create global animations here
    // this.anims.create({ ... });

    // Wait for React to tell us to start the game
    EventBus.on("start-game", this.startGame, this);
    EventBus.emit("scene-ready", this);
  }

  shutdown() {
    // Clean up event listeners when scene is destroyed
    EventBus.off("start-game", this.startGame, this);
  }

  private startGame = () => {
    // Guard against scene being destroyed during hot-reload
    if (!this.scene || !this.scene.manager) return;

    EventBus.off("start-game", this.startGame, this);
    this.scene.start("GameScene");
  };
}
