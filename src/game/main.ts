import * as Phaser from "phaser";
import { BootScene, PreloaderScene, GameScene } from "./scenes";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scene: [BootScene, PreloaderScene, GameScene],
  transparent: true, // Allow React UI to show through
};

export function StartGame(parent: string | HTMLElement): Phaser.Game {
  return new Phaser.Game({ ...config, parent });
}
