import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load minimal assets needed for the preloader
  }

  create() {
    this.scene.start("PreloaderScene");
  }
}
