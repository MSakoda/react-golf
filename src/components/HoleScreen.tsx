"use client";

import StatCard from "@/components/StatCard";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import FairwayView from "@/components/FairwayView";
import SwingMeter from "@/components/SwingMeter";
import Scorecard from "@/components/Scorecard";
import { getClub } from "@/lib/game/utils";
import { useGameStore } from "@/stores/gameStore";

export default function HoleScreen() {
  const state = useGameStore();
  const hole = state.holes[state.currentHoleIndex];
  const club = getClub(state.distanceRemaining);

  if (!hole) return null;

  return (
    <section className="grid flex-1 gap-3 py-2 sm:gap-5 sm:py-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3 sm:space-y-5">
        <div className="rounded-lg bg-white/85 p-3 shadow-glow sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:flex-wrap sm:gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-fairway sm:text-sm">
                Hole {hole.number} of 3
              </p>
              <h1 className="mt-0.5 text-2xl font-black leading-tight text-rough sm:mt-1 sm:text-5xl">
                {Math.round(state.distanceRemaining)} yards left
              </h1>
            </div>
            <div className="shrink-0 rounded-lg bg-sand px-3 py-2 text-right shadow-sm sm:px-4 sm:py-3">
              <p className="text-[0.65rem] font-black uppercase leading-none text-emerald-950/60 sm:text-xs">
                Modifier
              </p>
              <p className="mt-0.5 text-sm font-black text-rough sm:text-lg">
                {hole.modifier ?? "None"}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:mt-5 sm:gap-3">
            <StatCard label="Par" value={hole.par} compact />
            <StatCard label="Stroke" value={state.strokesThisHole + 1} compact />
            <StatCard label="Club" value={club} compact />
            <StatCard label="Yards" value={hole.yards} compact />
          </div>
        </div>

        <FairwayView
          holeYards={hole.yards}
          holePar={hole.par}
          distanceRemaining={state.distanceRemaining}
          currentClub={club}
          shotAnimation={state.shotAnimation}
          onAnimationComplete={state.completeShotAnimation}
        />

        <SwingMeter
          onSwing={state.takeShot}
          disabled={state.isShotAnimating || Boolean(state.confirmation)}
          actionLabel={club === "Putter" ? "Putt" : "Swing"}
        />

        <div className="rounded-lg bg-white/80 p-3 shadow-sm sm:p-4">
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
        <Scorecard holes={state.holes} scores={state.holeScores} shotLog={state.shotLog} />
      </aside>
      <ConfirmationDialog
        confirmation={state.confirmation}
        onConfirm={state.acknowledgeConfirmation}
      />
    </section>
  );
}
