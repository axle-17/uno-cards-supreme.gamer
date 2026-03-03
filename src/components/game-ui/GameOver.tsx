import { Overlay } from "./Overlay";
import { Button } from "./Button";

interface GameOverProps {
  score: number;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function GameOver({ score, onRestart, onMainMenu }: GameOverProps) {
  return (
    <Overlay>
      <h2 className="game-over__title">Game Over</h2>
      <p className="game-over__score">Score: {score.toLocaleString()}</p>
      <div className="game-over__buttons">
        <Button onClick={onRestart}>Play Again</Button>
        <Button onClick={onMainMenu} variant="secondary">
          Main Menu
        </Button>
      </div>
    </Overlay>
  );
}
