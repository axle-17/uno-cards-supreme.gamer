import type { GameInputEvent } from "./types";
import { GAME_INPUT_EVENT } from "./TouchOverlay";

/**
 * Input state for Phaser scenes
 */
export interface GameInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  fire: boolean;
  pause: boolean;
  axis: { x: number; y: number };
}

/**
 * Connect TouchOverlay input to a Phaser scene.
 * Call in scene's create() method.
 *
 * @example
 * ```typescript
 * // In scene create():
 * this.gameInput = connectPhaserInput(this);
 *
 * // In update():
 * this.player.setVelocityX(this.gameInput.axis.x * 400);
 * if (this.gameInput.jump) this.player.setVelocityY(-600);
 * ```
 */
export function connectPhaserInput(scene: {
  events: { on: Function };
}): GameInputState {
  const state: GameInputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    fire: false,
    pause: false,
    axis: { x: 0, y: 0 },
  };

  const listener = (e: Event) => {
    const event = (e as CustomEvent<GameInputEvent>).detail;

    switch (event.action) {
      case "MOVE":
        if (event.axis) state.axis = event.axis;
        break;
      case "MOVE_LEFT":
        state.left = event.phase === "down";
        break;
      case "MOVE_RIGHT":
        state.right = event.phase === "down";
        break;
      case "MOVE_UP":
        state.up = event.phase === "down";
        break;
      case "MOVE_DOWN":
        state.down = event.phase === "down";
        break;
      case "JUMP":
        state.jump = event.phase === "down";
        break;
      case "FIRE":
        state.fire = event.phase === "down";
        break;
      case "PAUSE":
        state.pause = event.phase === "down";
        break;
    }
  };

  window.addEventListener(GAME_INPUT_EVENT, listener);

  // Cleanup when scene shuts down
  scene.events.on("shutdown", () => {
    window.removeEventListener(GAME_INPUT_EVENT, listener);
  });

  return state;
}
