"use client";

import StatCard from "@/components/StatCard";
import { useGameStore } from "@/stores/gameStore";

export default function UpgradeScreen() {
  const { currentHoleIndex, totalPoints, totalStrokes, upgradeChoices, chooseUpgrade } =
    useGameStore();

  return (
    <section className="flex flex-1 items-start py-3 sm:items-center sm:py-8">
      <div className="w-full">
        <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
          <StatCard label="Completed" value={`Hole ${currentHoleIndex + 1}`} tone="dark" />
          <StatCard label="Total strokes" value={totalStrokes} />
          <StatCard label="Total points" value={totalPoints} />
        </div>
        <div className="rounded-lg bg-white/85 p-3 shadow-glow sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-fairway sm:text-sm">
            Choose one upgrade
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-rough sm:mt-2 sm:text-5xl">
            Tune your bag before the next tee
          </h1>
          <div className="mt-3 grid gap-2 sm:mt-6 sm:gap-4 md:grid-cols-3">
            {upgradeChoices.map((upgrade) => (
              <button
                key={upgrade.id}
                type="button"
                onClick={() => chooseUpgrade(upgrade)}
                className="rounded-lg border border-emerald-900/10 bg-gradient-to-br from-white to-emerald-50 p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-fairway hover:shadow-glow focus:outline-none focus:ring-4 focus:ring-emerald-300 sm:min-h-48 sm:p-5"
              >
                <span className="text-xs font-black uppercase tracking-wide text-fairway">
                  {upgrade.stackable ? "Stackable" : "Unique"}
                </span>
                <h2 className="mt-1 text-lg font-black leading-tight text-rough sm:mt-3 sm:text-2xl">
                  {upgrade.name}
                </h2>
                <p className="mt-1 text-xs leading-5 text-emerald-950/70 sm:mt-3 sm:text-sm sm:leading-6">
                  {upgrade.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
