import { Overlay } from "./Overlay";
import { Button } from "./Button";

interface MainMenuProps {
  onPlay: () => void;
}

export function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <Overlay>
      <div className="menu">
        <h1 className="menu__title">Game Title</h1>
        <p className="menu__subtitle">Your awesome game</p>
        <div className="menu__buttons">
          <Button onClick={onPlay}>Play</Button>
        </div>
      </div>
    </Overlay>
  );
}
