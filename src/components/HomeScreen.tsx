"use client";

import { useEffect } from "react";
import StatCard from "@/components/StatCard";
import { useGameStore } from "@/stores/gameStore";

export default function HomeScreen() {
  const {
    bestScore,
    bestPoints,
    runsCompleted,
    playerName,
    leaderboard,
    hydrateRecords,
    setPlayerName,
    startRun
  } = useGameStore();

  useEffect(() => {
    hydrateRecords();
  }, [hydrateRecords]);

  return (
    <section className="flex flex-1 items-center py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="rounded-lg bg-white/85 p-6 shadow-glow sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-fairway">
            Bogey Run
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-rough sm:text-6xl">
            Practice Round
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-950/70 sm:text-lg">
            A three-hole timing run where clean swings, clever upgrades, and a little course
            management turn into a portfolio-ready roguelike golf loop.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-emerald-950/60">
                Player name
              </span>
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Player"
                maxLength={24}
                className="mt-2 w-full rounded-lg border border-emerald-900/15 bg-white px-4 py-3 text-base font-bold text-rough outline-none transition focus:border-fairway focus:ring-4 focus:ring-emerald-200"
              />
            </label>
            <button
              type="button"
              onClick={startRun}
              className="rounded-lg bg-fairway px-6 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
            >
              Start Run
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Best strokes" value={bestScore ?? "None"} tone="dark" />
            <StatCard label="Best points" value={bestPoints} />
            <StatCard label="Runs completed" value={runsCompleted} />
          </div>
          <div className="rounded-lg bg-rough p-4 text-white shadow-glow">
            <h2 className="text-sm font-black uppercase tracking-wide text-white/70">
              Leaderboard
            </h2>
            <div className="mt-3 space-y-2">
              {leaderboard.length === 0 ? (
                <p className="rounded-lg bg-white/10 px-3 py-3 text-sm font-semibold text-white/75">
                  No completed rounds yet
                </p>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"
                  >
                    <span className="font-black text-sand">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate font-black">{entry.playerName}</p>
                      <p className="text-xs font-semibold text-white/60">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right font-black">
                      <p>{entry.strokes} strokes</p>
                      <p className="text-xs text-white/65">{entry.points} pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
