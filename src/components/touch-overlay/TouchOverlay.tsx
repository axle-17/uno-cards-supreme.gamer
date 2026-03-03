import React, { useRef, useCallback, useEffect, useState } from "react";
import type {
  TouchOverlayConfig,
  ActionId,
  ActionPhase,
  GameInputEvent,
} from "./types";
import { DEFAULT_KEY_MAP } from "./types";

/** Custom event name for game input */
export const GAME_INPUT_EVENT = "game:input";

/** Dispatch a game input event */
function dispatchGameInput(
  action: ActionId,
  phase: ActionPhase,
  axis?: { x: number; y: number },
  value?: number
) {
  const detail: GameInputEvent = { action, phase };
  if (axis) detail.axis = axis;
  if (typeof value === "number") detail.value = value;
  window.dispatchEvent(new CustomEvent(GAME_INPUT_EVENT, { detail }));
}

/** Detect device type */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipod|blackberry|opera mini|iemobile|ipad|tablet/.test(
    ua
  );
}

interface JoystickState {
  active: boolean;
  center: { x: number; y: number };
  axis: { x: number; y: number };
  digital: { left: boolean; right: boolean; up: boolean; down: boolean };
}

export function TouchOverlay({
  showJoystick = true,
  showButtonA = true,
  showButtonB = true,
  showPause = true,
  buttonALabel = "A",
  buttonBLabel = "B",
  deadzone = 0.08,
  threshold = 0.35,
  analogOnly = false,
  forceShow = false,
}: TouchOverlayConfig = {}) {
  const [isMobile] = useState(() => isMobileDevice());
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<JoystickState>({
    active: false,
    center: { x: 0, y: 0 },
    axis: { x: 0, y: 0 },
    digital: { left: false, right: false, up: false, down: false },
  });

  const RADIUS = 52;
  const CENTER_OFFSET = 44;

  // Don't render on desktop unless forced
  const shouldShow = forceShow || isMobile;

  // Emit analog movement
  const emitAnalog = useCallback(
    (x: number, y: number) => {
      const ax = Math.abs(x) < deadzone ? 0 : x;
      const ay = Math.abs(y) < deadzone ? 0 : y;
      stateRef.current.axis = {
        x: Number(ax.toFixed(3)),
        y: Number(ay.toFixed(3)),
      };
      dispatchGameInput("MOVE", "change", stateRef.current.axis);
    },
    [deadzone]
  );

  // Emit digital directions based on analog axis
  const emitDigitals = useCallback(
    (x: number, y: number) => {
      if (analogOnly) return;
      const next = {
        left: x <= -threshold,
        right: x >= threshold,
        up: y <= -threshold,
        down: y >= threshold,
      };
      const prev = stateRef.current.digital;

      if (next.left !== prev.left)
        dispatchGameInput("MOVE_LEFT", next.left ? "down" : "up");
      if (next.right !== prev.right)
        dispatchGameInput("MOVE_RIGHT", next.right ? "down" : "up");
      if (next.up !== prev.up)
        dispatchGameInput("MOVE_UP", next.up ? "down" : "up");
      if (next.down !== prev.down)
        dispatchGameInput("MOVE_DOWN", next.down ? "down" : "up");

      stateRef.current.digital = next;
    },
    [analogOnly, threshold]
  );

  // Update knob position
  const setKnobPosition = useCallback((dx: number, dy: number) => {
    if (knobRef.current) {
      knobRef.current.style.left = `${CENTER_OFFSET + dx}px`;
      knobRef.current.style.top = `${CENTER_OFFSET + dy}px`;
    }
  }, []);

  // Joystick handlers
  const handleJoystickStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const rect = joyBaseRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      stateRef.current.active = true;
      stateRef.current.center = { x, y };
      setKnobPosition(0, 0);
      emitAnalog(0, 0);
      emitDigitals(0, 0);
    },
    [emitAnalog, emitDigitals, setKnobPosition]
  );

  // Global pointer move/up handlers
  useEffect(() => {
    if (!shouldShow || !showJoystick) return;

    const handleMove = (e: PointerEvent) => {
      if (!stateRef.current.active || !joyBaseRef.current) return;
      e.preventDefault();

      const rect = joyBaseRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let dx = x - stateRef.current.center.x;
      let dy = y - stateRef.current.center.y;
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, RADIUS);
      dx *= clamped / len;
      dy *= clamped / len;

      setKnobPosition(dx, dy);

      const ax = dx / RADIUS;
      const ay = dy / RADIUS;
      emitAnalog(ax, ay);
      emitDigitals(ax, ay);
    };

    const handleEnd = () => {
      if (!stateRef.current.active) return;
      stateRef.current.active = false;
      setKnobPosition(0, 0);
      emitAnalog(0, 0);
      emitDigitals(0, 0);
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [shouldShow, showJoystick, emitAnalog, emitDigitals, setKnobPosition]);

  // Keyboard handler for desktop
  useEffect(() => {
    if (isMobile && !forceShow) return;

    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      const action = DEFAULT_KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();

      if (action === "PAUSE") {
        dispatchGameInput("PAUSE", "down");
        setTimeout(() => dispatchGameInput("PAUSE", "up"), 30);
        return;
      }

      if (!keysDown.has(e.code)) {
        keysDown.add(e.code);
        dispatchGameInput(action, "down");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const action = DEFAULT_KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();

      if (keysDown.has(e.code)) {
        keysDown.delete(e.code);
        dispatchGameInput(action, "up");
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isMobile, forceShow]);

  // Button press handler
  const createButtonHandler = (action: ActionId) => {
    let isDown = false;
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        isDown = true;
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.25)";
        dispatchGameInput(action, "down");
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        if (!isDown) return;
        isDown = false;
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.1)";
        dispatchGameInput(action, "up");
      },
      onPointerCancel: (e: React.PointerEvent) => {
        e.preventDefault();
        if (!isDown) return;
        isDown = false;
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.1)";
        dispatchGameInput(action, "up");
      },
      onPointerLeave: (e: React.PointerEvent) => {
        e.preventDefault();
        if (!isDown) return;
        isDown = false;
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.1)";
        dispatchGameInput(action, "up");
      },
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.buttons !== 1) return;
        isDown = true;
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.25)";
        dispatchGameInput(action, "down");
      },
    };
  };

  const handlePause = (e: React.PointerEvent) => {
    e.preventDefault();
    dispatchGameInput("PAUSE", "down");
    setTimeout(() => dispatchGameInput("PAUSE", "up"), 30);
  };

  if (!shouldShow) return null;

  return (
    <div style={styles.overlay}>
      {/* Joystick */}
      {showJoystick && (
        <div
          ref={joyBaseRef}
          style={styles.joyBase}
          onPointerDown={handleJoystickStart}
        >
          <div ref={knobRef} style={styles.joyKnob} />
        </div>
      )}

      {/* A Button (Jump) */}
      {showButtonA && (
        <div
          style={{ ...styles.btn, ...styles.btnA }}
          {...createButtonHandler("JUMP")}
        >
          {buttonALabel}
        </div>
      )}

      {/* B Button (Fire) */}
      {showButtonB && (
        <div
          style={{ ...styles.btn, ...styles.btnB }}
          {...createButtonHandler("FIRE")}
        >
          {buttonBLabel}
        </div>
      )}

      {/* Pause Button */}
      {showPause && (
        <div style={styles.btnPause} onPointerDown={handlePause}>
          ⏸
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    userSelect: "none",
    touchAction: "none",
    zIndex: 10,
  },
  joyBase: {
    position: "absolute",
    left: 16,
    bottom: 16,
    width: 120,
    height: 120,
    borderRadius: 60,
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(2px)",
    pointerEvents: "auto",
    touchAction: "none",
    WebkitTapHighlightColor: "transparent",
  },
  joyKnob: {
    position: "absolute",
    left: 44,
    top: 44,
    width: 32,
    height: 32,
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.35)",
    // No transition - immediate response for better game feel
  },
  btn: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace",
    fontSize: 18,
    color: "#fff",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.35)",
    pointerEvents: "auto",
    touchAction: "none",
    WebkitTapHighlightColor: "transparent",
  },
  btnA: {
    right: 24,
    bottom: 24,
  },
  btnB: {
    right: 112,
    bottom: 72,
  },
  btnPause: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 48,
    height: 48,
    fontWeight: 700,
    fontFamily: "monospace",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    pointerEvents: "auto",
    touchAction: "none",
    WebkitTapHighlightColor: "transparent",
  },
};

export default TouchOverlay;
