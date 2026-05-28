"use client";

import { useEffect, useMemo, useState } from "react";
import type { Club, ShotAnimation } from "@/lib/game/types";

function progressFromDistance(distance: number, holeYards: number) {
  return Math.max(0, Math.min(1, 1 - distance / holeYards));
}

function pointOnFairway(progress: number) {
  const start = { x: 9, y: 78 };
  const control = { x: 47, y: 21 };
  const cup = { x: 88, y: 24 };
  const inverse = 1 - progress;

  return {
    x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * cup.x,
    y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * cup.y
  };
}

function pointOnGreen(distance: number) {
  const progress = Math.max(0, Math.min(1, 1 - distance / 20));
  return {
    x: 16 + progress * 67,
    y: 56 - Math.sin(progress * Math.PI) * 8
  };
}

export default function FairwayView({
  holeYards,
  distanceRemaining,
  currentClub,
  shotAnimation,
  onAnimationComplete
}: {
  holeYards: number;
  distanceRemaining: number;
  currentClub: Club;
  shotAnimation: ShotAnimation | null;
  onAnimationComplete: () => void;
}) {
  const isPuttingView = currentClub === "Putter" || shotAnimation?.club === "Putter";
  const restingProgress = useMemo(
    () => progressFromDistance(distanceRemaining, holeYards),
    [distanceRemaining, holeYards]
  );
  const restingPoint = useMemo(
    () => (isPuttingView ? pointOnGreen(distanceRemaining) : pointOnFairway(restingProgress)),
    [distanceRemaining, isPuttingView, restingProgress]
  );
  const [ballPoint, setBallPoint] = useState(restingPoint);

  useEffect(() => {
    if (!shotAnimation) {
      setBallPoint(restingPoint);
      return;
    }

    const isPutt = shotAnimation.club === "Putter";
    const from = isPutt
      ? pointOnGreen(shotAnimation.fromDistance)
      : pointOnFairway(progressFromDistance(shotAnimation.fromDistance, shotAnimation.holeYards));
    const to = isPutt
      ? pointOnGreen(shotAnimation.toDistance)
      : pointOnFairway(progressFromDistance(shotAnimation.toDistance, shotAnimation.holeYards));
    setBallPoint(from);

    const frame = window.requestAnimationFrame(() => setBallPoint(to));
    const timeout = window.setTimeout(onAnimationComplete, 1050);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [onAnimationComplete, restingPoint, shotAnimation]);

  return (
    <div className="rounded-lg border border-emerald-900/10 bg-sky/70 p-4 shadow-sm">
      <div className="relative h-56 overflow-hidden rounded-lg bg-gradient-to-b from-sky to-emerald-100">
        {isPuttingView ? (
          <>
            <div className="absolute inset-0 bg-fairway" />
            <div className="absolute left-[5%] top-[10%] h-[80%] w-[90%] rounded-[999px] bg-emerald-500/40" />
            <div className="absolute left-[70%] top-[34%] h-24 w-24 rounded-full bg-emerald-600/45" />
            <div className="absolute left-[8%] top-1/2 h-1 w-[76%] -translate-y-1/2 rounded-full bg-white/25" />
            <div className="absolute left-[82%] top-[56%] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rough shadow-inner" />
            <div className="absolute left-[82%] top-[26%] h-[30%] w-1 bg-rough" />
            <div className="absolute left-[82.5%] top-[25%] h-6 w-8 bg-pin" />
            <div className="absolute left-4 top-4 rounded-lg bg-white/85 px-3 py-2 text-sm font-black text-rough shadow-sm">
              Putting green
            </div>
          </>
        ) : (
          <>
            <div
              className="absolute left-[5%] top-[14%] h-[78%] w-[90%] rounded-[999px] bg-fairway shadow-inner"
              style={{
                clipPath:
                  "polygon(0 82%, 8% 62%, 21% 45%, 35% 22%, 54% 13%, 75% 12%, 100% 0, 96% 31%, 82% 48%, 61% 56%, 42% 51%, 24% 67%, 9% 91%)"
              }}
            />
            <div className="absolute left-[81%] top-[14%] h-16 w-16 rounded-full bg-emerald-600" />
            <div className="absolute left-[88%] top-[24%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rough shadow-inner" />
            <div className="absolute left-[88%] top-[7%] h-12 w-1 bg-rough" />
            <div className="absolute left-[88.5%] top-[7%] h-5 w-7 bg-pin" />
            <div className="absolute left-[5%] bottom-[12%] h-10 w-16 rounded-lg bg-sand/90" />
          </>
        )}
        <div
          className="absolute h-4 w-4 rounded-full border border-emerald-950/20 bg-white shadow-lg transition-all duration-1000 ease-out"
          style={{
            left: `${ballPoint.x}%`,
            top: `${ballPoint.y}%`,
            transform: "translate(-50%, -50%)"
          }}
        />
        {shotAnimation && (
          <div className="absolute left-4 top-4 rounded-lg bg-white/85 px-3 py-2 text-sm font-black text-rough shadow-sm">
            {shotAnimation.quality} {shotAnimation.club}
          </div>
        )}
      </div>
    </div>
  );
}
