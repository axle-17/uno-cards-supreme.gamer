import * as Phaser from "phaser";

// Typed events for React ↔ Phaser communication
export type GameEvents = {
  // Phaser → React
  "scene-ready": (scene: Phaser.Scene) => void;
  "loading-progress": (progress: number) => void;
  "loading-complete": () => void;
  "score-update": (score: number) => void;
  "game-over": (data: { score: number }) => void;
  "game-paused": () => void;
  "game-resumed": () => void;

  // React → Phaser
  "start-game": () => void;
  "pause-game": () => void;
  "resume-game": () => void;
  "restart-game": () => void;
  "go-to-menu": () => void;
};

export const EventBus = new Phaser.Events.EventEmitter();
