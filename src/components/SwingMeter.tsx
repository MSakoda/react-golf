"use client";

import { useEffect, useRef, useState } from "react";

export default function SwingMeter({
  onSwing,
  disabled = false,
  actionLabel = "Swing"
}: {
  onSwing: (position: number) => void;
  disabled?: boolean;
  actionLabel?: string;
}) {
  const [position, setPosition] = useState(0.5);
  const [flash, setFlash] = useState(false);
  const direction = useRef(1);
  const positionRef = useRef(0.5);
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = (time: number) => {
      const previous = lastTime.current ?? time;
      const delta = Math.min((time - previous) / 1000, 0.04);
      lastTime.current = time;
      let next = positionRef.current + direction.current * delta * 0.9;
      if (next >= 1) {
        next = 1;
        direction.current = -1;
      }
      if (next <= 0) {
        next = 0;
        direction.current = 1;
      }
      positionRef.current = next;
      setPosition(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handleSwing();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function handleSwing() {
    if (disabled) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 170);
    onSwing(positionRef.current);
  }

  return (
    <div className="rounded-lg border border-emerald-900/10 bg-white/90 p-4 shadow-glow">
      <div className="relative h-12 overflow-hidden rounded-lg bg-gradient-to-r from-red-100 via-emerald-100 to-red-100">
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-pin" />
        <div className="absolute left-[42%] top-0 h-full w-[16%] bg-emerald-400/30" />
        <div className="absolute left-[48%] top-0 h-full w-[4%] bg-white/70" />
        <div
          className={`absolute top-1/2 h-9 w-3 -translate-y-1/2 rounded-full bg-rough shadow-lg transition-transform ${flash ? "scale-125" : ""}`}
          style={{ left: `calc(${position * 100}% - 6px)` }}
        />
      </div>
      <button
        type="button"
        onClick={handleSwing}
        disabled={disabled}
        className="mt-4 w-full rounded-lg bg-rough px-5 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-950/45"
      >
        {disabled ? "Ball in flight" : actionLabel}
      </button>
      <p className="mt-2 text-center text-xs font-semibold text-emerald-950/60">
        Press Space or Enter to {actionLabel.toLowerCase()}
      </p>
    </div>
  );
}
