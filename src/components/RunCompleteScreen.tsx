"use client";

import StatCard from "@/components/StatCard";
import Scorecard from "@/components/Scorecard";
import { useGameStore } from "@/stores/gameStore";

export default function RunCompleteScreen() {
  const {
    totalStrokes,
    totalPoints,
    bestScore,
    bestPoints,
    runsCompleted,
    holes,
    holeScores,
    startRun,
    returnHome,
    shotLog
  } = useGameStore();

  return (
    <section className="flex flex-1 items-center py-8">
      <div className="grid w-full gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg bg-white/85 p-6 shadow-glow sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-fairway">
            Run complete
          </p>
          <h1 className="mt-2 text-4xl font-black text-rough sm:text-6xl">
            Card signed. Score posted.
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total strokes" value={totalStrokes} tone="dark" />
            <StatCard label="Total points" value={totalPoints} tone="dark" />
            <StatCard label="Runs completed" value={runsCompleted} />
            <StatCard label="Best strokes" value={bestScore ?? "None"} />
            <StatCard label="Best points" value={bestPoints} />
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startRun}
              className="rounded-lg bg-fairway px-6 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={returnHome}
              className="rounded-lg border border-emerald-900/20 bg-white px-6 py-4 text-base font-black uppercase tracking-wide text-rough transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-300"
            >
              Return home
            </button>
          </div>
        </div>

        <aside>
          <Scorecard holes={holes} scores={holeScores} shotLog={shotLog} showTotal />
        </aside>
      </div>
    </section>
  );
}
