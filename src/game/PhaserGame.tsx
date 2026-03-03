import * as Phaser from "phaser";
import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { StartGame } from "./main";
import { EventBus } from "./EventBus";

export interface GameRef {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface PhaserGameProps {
  onSceneReady?: (scene: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<GameRef, PhaserGameProps>(
  function PhaserGame({ onSceneReady }, ref) {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (gameRef.current || !containerRef.current) return;

      gameRef.current = StartGame(containerRef.current);

      if (ref && typeof ref === "object") {
        ref.current = { game: gameRef.current, scene: null };
      }

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }, [ref]);

    useEffect(() => {
      const handleSceneReady = (scene: Phaser.Scene) => {
        if (ref && typeof ref === "object" && ref.current) {
          ref.current.scene = scene;
        }
        onSceneReady?.(scene);
      };

      EventBus.on("scene-ready", handleSceneReady);
      return () => {
        EventBus.off("scene-ready", handleSceneReady);
      };
    }, [ref, onSceneReady]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
  }
);
