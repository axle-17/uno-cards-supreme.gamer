import * as Phaser from "phaser";
import { EventBus } from "../EventBus";

export class GameScene extends Phaser.Scene {
  private score: number = 0;
  private isPaused: boolean = false;

  constructor() {
    super("GameScene");
  }

  create() {
    this.score = 0;
    this.isPaused = false;

    this.cameras.main.setBackgroundColor("#16213e");

    // Set up event listeners from React
    EventBus.on("pause-game", this.handlePause, this);
    EventBus.on("resume-game", this.handleResume, this);
    EventBus.on("restart-game", this.handleRestart, this);
    EventBus.on("go-to-menu", this.handleGoToMenu, this);

    // Keyboard shortcuts
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.isPaused) {
        this.handleResume();
      } else {
        this.handlePause();
      }
    });

    // Placeholder game content - replace with your game
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "🎮 Your Game Here", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Example: click to score
    this.input.on("pointerdown", () => {
      if (!this.isPaused) {
        this.addScore(10);
      }
    });

    EventBus.emit("scene-ready", this);
    EventBus.emit("score-update", this.score);
  }

  update() {
    if (this.isPaused) return;
    // Game logic here
  }

  shutdown() {
    EventBus.off("pause-game", this.handlePause, this);
    EventBus.off("resume-game", this.handleResume, this);
    EventBus.off("restart-game", this.handleRestart, this);
    EventBus.off("go-to-menu", this.handleGoToMenu, this);
  }

  // Public API for game logic
  addScore(points: number) {
    this.score += points;
    EventBus.emit("score-update", this.score);
  }

  triggerGameOver() {
    EventBus.emit("game-over", { score: this.score });
  }

  private handlePause = () => {
    if (this.isPaused) return;
    this.isPaused = true;
    this.scene.pause();
    EventBus.emit("game-paused");
  };

  private handleResume = () => {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.scene.resume();
    EventBus.emit("game-resumed");
  };

  private handleRestart = () => {
    this.scene.restart();
  };

  private handleGoToMenu = () => {
    // Reset state and go back to PreloaderScene (which waits for start-game)
    this.isPaused = false;
    this.scene.stop();
    this.scene.start("PreloaderScene");
  };
}
