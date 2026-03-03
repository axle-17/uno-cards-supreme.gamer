interface HUDProps {
  score: number;
  onPause: () => void;
}

function PauseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function HUD({ score, onPause }: HUDProps) {
  return (
    <div className="hud">
      <div className="hud__score">{score.toLocaleString()}</div>
      <button
        onClick={onPause}
        className="hud__pause-btn"
        aria-label="Pause game"
      >
        <PauseIcon />
      </button>
    </div>
  );
}
