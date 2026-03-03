import { Overlay } from "./Overlay";

interface LoadingScreenProps {
  progress: number;
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  const percent = Math.round(progress * 100);

  return (
    <Overlay>
      <div className="loading">
        <div className="loading__text">Loading...</div>
        <div className="loading__bar">
          <div className="loading__progress" style={{ width: `${percent}%` }} />
        </div>
        <div className="loading__percent">{percent}%</div>
      </div>
    </Overlay>
  );
}
