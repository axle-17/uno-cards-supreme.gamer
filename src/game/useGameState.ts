import { useState, useEffect, useCallback } from "react";
import { EventBus } from "./EventBus";

export type GameScreen = "loading" | "menu" | "playing" | "paused" | "gameover";

export interface GameState {
  screen: GameScreen;
  score: number;
  loadingProgress: number;
  finalScore: number;
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    screen: "loading",
    score: 0,
    loadingProgress: 0,
    finalScore: 0,
  });

  useEffect(() => {
    const onLoadingProgress = (progress: number) => {
      setState((s) => ({ ...s, loadingProgress: progress }));
    };

    const onLoadingComplete = () => {
      setState((s) => ({ ...s, screen: "menu" }));
    };

    const onScoreUpdate = (score: number) => {
      setState((s) => ({ ...s, score }));
    };

    const onGamePaused = () => {
      setState((s) => ({ ...s, screen: "paused" }));
    };

    const onGameResumed = () => {
      setState((s) => ({ ...s, screen: "playing" }));
    };

    const onGameOver = ({ score }: { score: number }) => {
      setState((s) => ({ ...s, screen: "gameover", finalScore: score }));
    };

    EventBus.on("loading-progress", onLoadingProgress);
    EventBus.on("loading-complete", onLoadingComplete);
    EventBus.on("score-update", onScoreUpdate);
    EventBus.on("game-paused", onGamePaused);
    EventBus.on("game-resumed", onGameResumed);
    EventBus.on("game-over", onGameOver);

    return () => {
      EventBus.off("loading-progress", onLoadingProgress);
      EventBus.off("loading-complete", onLoadingComplete);
      EventBus.off("score-update", onScoreUpdate);
      EventBus.off("game-paused", onGamePaused);
      EventBus.off("game-resumed", onGameResumed);
      EventBus.off("game-over", onGameOver);
    };
  }, []);

  const startGame = useCallback(() => {
    setState((s) => ({ ...s, screen: "playing", score: 0 }));
    EventBus.emit("start-game");
  }, []);

  const pauseGame = useCallback(() => {
    EventBus.emit("pause-game");
  }, []);

  const resumeGame = useCallback(() => {
    EventBus.emit("resume-game");
  }, []);

  const restartGame = useCallback(() => {
    setState((s) => ({ ...s, screen: "playing", score: 0 }));
    EventBus.emit("restart-game");
  }, []);

  const goToMenu = useCallback(() => {
    setState((s) => ({ ...s, screen: "menu", score: 0 }));
    EventBus.emit("go-to-menu");
  }, []);

  return {
    ...state,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    goToMenu,
  };
}
