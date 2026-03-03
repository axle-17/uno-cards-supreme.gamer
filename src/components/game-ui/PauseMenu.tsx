import { Overlay } from "./Overlay";
import { Button } from "./Button";

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onResume, onMainMenu }: PauseMenuProps) {
  return (
    <Overlay transparent blur>
      <div className="pause-menu">
        <h2 className="pause-menu__title">Paused</h2>
        <div className="pause-menu__buttons">
          <Button onClick={onResume}>Resume</Button>
          <Button onClick={onMainMenu} variant="secondary">
            Main Menu
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
