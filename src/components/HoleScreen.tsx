"use client";

import StatCard from "@/components/StatCard";
import FairwayView from "@/components/FairwayView";
import SwingMeter from "@/components/SwingMeter";
import { getClub } from "@/lib/game/utils";
import { useGameStore } from "@/stores/gameStore";

export default function HoleScreen() {
  const state = useGameStore();
  const hole = state.holes[state.currentHoleIndex];
  const club = getClub(state.distanceRemaining);

  if (!hole) return null;

  return (
    <section className="grid flex-1 gap-5 py-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="rounded-lg bg-white/85 p-5 shadow-glow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-fairway">
                Hole {hole.number} of 3
              </p>
              <h1 className="mt-1 text-3xl font-black text-rough sm:text-5xl">
                {Math.round(state.distanceRemaining)} yards left
              </h1>
            </div>
            <div className="rounded-lg bg-sand px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-black uppercase text-emerald-950/60">Modifier</p>
              <p className="text-lg font-black text-rough">{hole.modifier ?? "None"}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Par" value={hole.par} />
            <StatCard label="Stroke" value={state.strokesThisHole + 1} />
            <StatCard label="Club" value={club} />
            <StatCard label="Hole yards" value={hole.yards} />
          </div>
        </div>

        <FairwayView
          holeYards={hole.yards}
          distanceRemaining={state.distanceRemaining}
          currentClub={club}
          shotAnimation={state.shotAnimation}
          onAnimationComplete={state.completeShotAnimation}
        />

        <SwingMeter
          onSwing={state.takeShot}
          disabled={state.isShotAnimating}
          actionLabel={club === "Putter" ? "Putt" : "Swing"}
        />

        <div className="rounded-lg bg-white/80 p-4 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-rough">Active upgrades</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.activeUpgrades.length === 0 ? (
              <span className="text-sm font-semibold text-emerald-950/55">No upgrades yet</span>
            ) : (
              state.activeUpgrades.map((upgrade, index) => (
                <span
                  key={`${upgrade.id}-${index}`}
                  className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-rough"
                >
                  {upgrade.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total strokes" value={state.totalStrokes} tone="dark" />
          <StatCard label="Total points" value={state.totalPoints} tone="dark" />
        </div>
        <div className="rounded-lg bg-rough p-4 text-white shadow-glow">
          <h2 className="text-sm font-black uppercase tracking-wide text-white/70">Shot log</h2>
          <div className="mt-3 space-y-2">
            {state.shotLog.map((entry) => (
              <p key={entry.id} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold">
                {entry.text}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
