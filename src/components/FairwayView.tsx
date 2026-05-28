"use client";

import { useEffect, useMemo, useState } from "react";
import type { Club, ShotAnimation } from "@/lib/game/types";

function progressFromDistance(distance: number, holeYards: number) {
  return Math.max(0, Math.min(1, 1 - distance / holeYards));
}

function getFairwayLayout(par: number) {
  if (par === 3) {
    return {
      start: { x: 18, y: 72 },
      control: { x: 42, y: 38 },
      cup: { x: 70, y: 31 },
      fairway: {
        left: "14%",
        top: "22%",
        width: "64%",
        height: "66%",
        clipPath:
          "polygon(0 82%, 12% 58%, 30% 36%, 52% 20%, 84% 4%, 100% 9%, 92% 42%, 70% 54%, 46% 62%, 20% 78%, 6% 96%)"
      },
      green: { x: 70, y: 31, size: 15 },
      tee: { left: "12%", bottom: "13%" },
      label: "Short approach"
    };
  }

  if (par === 5) {
    return {
      start: { x: 6, y: 82 },
      control: { x: 47, y: 13 },
      cup: { x: 92, y: 20 },
      fairway: {
        left: "3%",
        top: "9%",
        width: "94%",
        height: "84%",
        clipPath:
          "polygon(0 88%, 8% 67%, 18% 51%, 31% 23%, 48% 10%, 65% 18%, 82% 6%, 100% 0, 97% 28%, 84% 43%, 64% 49%, 45% 42%, 27% 61%, 12% 91%)"
      },
      green: { x: 92, y: 20, size: 17 },
      tee: { left: "3%", bottom: "9%" },
      label: "Long fairway"
    };
  }

  return {
    start: { x: 9, y: 78 },
    control: { x: 47, y: 21 },
    cup: { x: 88, y: 24 },
    fairway: {
      left: "5%",
      top: "14%",
      width: "90%",
      height: "78%",
      clipPath:
        "polygon(0 82%, 8% 62%, 21% 45%, 35% 22%, 54% 13%, 75% 12%, 100% 0, 96% 31%, 82% 48%, 61% 56%, 42% 51%, 24% 67%, 9% 91%)"
    },
    green: { x: 88, y: 24, size: 16 },
    tee: { left: "5%", bottom: "12%" },
    label: "Mid-length fairway"
  };
}

function pointOnFairway(progress: number, par: number) {
  const { start, control, cup } = getFairwayLayout(par);
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
  holePar,
  distanceRemaining,
  currentClub,
  shotAnimation,
  onAnimationComplete
}: {
  holeYards: number;
  holePar: number;
  distanceRemaining: number;
  currentClub: Club;
  shotAnimation: ShotAnimation | null;
  onAnimationComplete: () => void;
}) {
  const isPuttingView = currentClub === "Putter" || shotAnimation?.club === "Putter";
  const fairwayLayout = useMemo(() => getFairwayLayout(holePar), [holePar]);
  const restingProgress = useMemo(
    () => progressFromDistance(distanceRemaining, holeYards),
    [distanceRemaining, holeYards]
  );
  const restingPoint = useMemo(
    () => (isPuttingView ? pointOnGreen(distanceRemaining) : pointOnFairway(restingProgress, holePar)),
    [distanceRemaining, holePar, isPuttingView, restingProgress]
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
      : pointOnFairway(
          progressFromDistance(shotAnimation.fromDistance, shotAnimation.holeYards),
          shotAnimation.holePar
        );
    const to = isPutt
      ? pointOnGreen(shotAnimation.toDistance)
      : pointOnFairway(
          progressFromDistance(shotAnimation.toDistance, shotAnimation.holeYards),
          shotAnimation.holePar
        );
    setBallPoint(from);

    const frame = window.requestAnimationFrame(() => setBallPoint(to));
    const timeout = window.setTimeout(onAnimationComplete, 1050);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [onAnimationComplete, restingPoint, shotAnimation]);

  return (
    <div className="rounded-lg border border-emerald-900/10 bg-sky/70 p-2 shadow-sm sm:p-4">
      <div className="relative h-40 rounded-lg bg-gradient-to-b from-sky to-emerald-100 sm:h-56">
        {isPuttingView ? (
          <>
            <div className="absolute inset-0 bg-fairway" />
            <div className="absolute left-[5%] top-[10%] h-[80%] w-[90%] rounded-[999px] bg-emerald-500/40" />
            <div className="absolute left-[70%] top-[34%] h-24 w-24 rounded-full bg-emerald-600/45" />
            <div className="absolute left-[8%] top-1/2 h-1 w-[76%] -translate-y-1/2 rounded-full bg-white/25" />
            <div className="absolute left-[82%] top-[56%] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rough shadow-inner" />
            <div className="absolute left-[82%] top-[26%] h-[30%] w-1 bg-rough" />
            <div className="absolute left-[82.5%] top-[25%] h-6 w-8 bg-pin" />
            <div className="absolute left-3 top-3 rounded-lg bg-white/85 px-2 py-1 text-xs font-black text-rough shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-2 sm:text-sm">
              Putting green
            </div>
          </>
        ) : (
          <>
            <div
              className="absolute rounded-[999px] bg-fairway shadow-inner"
              style={{
                left: fairwayLayout.fairway.left,
                top: fairwayLayout.fairway.top,
                width: fairwayLayout.fairway.width,
                height: fairwayLayout.fairway.height,
                clipPath: fairwayLayout.fairway.clipPath
              }}
            />
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600"
              style={{
                left: `${fairwayLayout.green.x}%`,
                top: `${fairwayLayout.green.y}%`,
                height: `${fairwayLayout.green.size * 0.25}rem`,
                width: `${fairwayLayout.green.size * 0.25}rem`
              }}
            />
            <div
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rough shadow-inner"
              style={{ left: `${fairwayLayout.cup.x}%`, top: `${fairwayLayout.cup.y}%` }}
            />
            <div
              className="absolute h-11 w-1 -translate-y-full bg-rough sm:h-12"
              style={{
                left: `${fairwayLayout.cup.x}%`,
                top: `${fairwayLayout.cup.y}%`
              }}
            />
            <div
              className="absolute h-4 w-6 -translate-y-full bg-pin sm:h-5 sm:w-7"
              style={{
                left: `calc(${fairwayLayout.cup.x}% + 0.125rem)`,
                top: `calc(${fairwayLayout.cup.y}% - 2.75rem)`
              }}
            />
            <div
              className="absolute h-10 w-16 rounded-lg bg-sand/90"
              style={{ left: fairwayLayout.tee.left, bottom: fairwayLayout.tee.bottom }}
            />
            <div className="absolute right-3 bottom-3 rounded-lg bg-white/80 px-2 py-1 text-xs font-black text-rough shadow-sm">
              {fairwayLayout.label}
            </div>
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
          <div className="absolute left-3 top-3 rounded-lg bg-white/85 px-2 py-1 text-xs font-black text-rough shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-2 sm:text-sm">
            {shotAnimation.quality} {shotAnimation.club}
          </div>
        )}
      </div>
    </div>
  );
}
