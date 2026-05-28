"use client";

import { useState } from "react";
import type { Hole, HoleScore, ShotLogEntry } from "@/lib/game/types";

function scoreMarkClass(strokes: number, par: number) {
  const relation = strokes - par;
  if (strokes === 1) return "score-triangle";
  if (relation <= -2) return "rounded-full border-4 border-double border-black";
  if (relation === -1) return "rounded-full border-2 border-black";
  if (relation === 1) return "rounded-none border-2 border-black";
  if (relation >= 2) return "rounded-none border-4 border-double border-black";
  return "";
}

export default function Scorecard({
  holes,
  scores,
  shotLog,
  showTotal = false
}: {
  holes: Hole[];
  scores: HoleScore[];
  shotLog: ShotLogEntry[];
  showTotal?: boolean;
}) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const totalStrokes = scores.reduce((sum, score) => sum + score.strokes, 0);
  const totalMark = scores.length === holes.length ? totalStrokes - totalPar : null;

  return (
    <div className="rounded-lg bg-white/90 p-4 text-rough shadow-glow">
      <h2 className="text-sm font-black uppercase tracking-wide text-emerald-950/60">
        Scorecard
      </h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-emerald-900/10">
        <div className="grid grid-cols-4 bg-rough text-center text-xs font-black uppercase tracking-wide text-white">
          <div className="px-2 py-2">Hole</div>
          <div className="px-2 py-2">Par</div>
          <div className="px-2 py-2">Score</div>
          <div className="px-2 py-2">Mark</div>
        </div>
        {holes.map((hole) => {
          const score = scores.find((item) => item.holeNumber === hole.number);
          const markClass = score ? scoreMarkClass(score.strokes, hole.par) : "";

          return (
            <div
              key={hole.number}
              className="grid grid-cols-4 items-center border-t border-emerald-900/10 bg-white text-center text-sm font-bold"
            >
              <div className="px-2 py-3">{hole.number}</div>
              <div className="px-2 py-3">{hole.par}</div>
              <div className="px-2 py-3">{score?.strokes ?? "-"}</div>
              <div className="flex items-center justify-center px-2 py-2">
                {score ? (
                  <span
                    className={`flex h-9 w-9 items-center justify-center text-base font-black ${markClass}`}
                  >
                    <span className="relative z-10">{score.strokes}</span>
                  </span>
                ) : (
                  <span className="text-emerald-950/35">-</span>
                )}
              </div>
            </div>
          );
        })}
        {showTotal && (
          <div className="grid grid-cols-4 items-center border-t border-emerald-900/20 bg-emerald-50 text-center text-sm font-black">
            <div className="px-2 py-3 uppercase tracking-wide">Total</div>
            <div className="px-2 py-3">{totalPar}</div>
            <div className="px-2 py-3">{totalStrokes}</div>
            <div className="px-2 py-3">
              {totalMark === null
                ? "-"
                : totalMark === 0
                  ? "E"
                  : totalMark > 0
                    ? `+${totalMark}`
                    : totalMark}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsLogOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-900/15 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-rough transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-300"
      >
        <span className="relative block h-5 w-4 rounded-sm border-2 border-rough">
          <span className="absolute left-1 top-1 h-0.5 w-2 bg-rough" />
          <span className="absolute left-1 top-2.5 h-0.5 w-2 bg-rough" />
          <span className="absolute left-1 top-4 h-0.5 w-2 bg-rough" />
        </span>
        Shot history
      </button>

      {isLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rough/55 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shot-history-title"
            className="w-full max-w-md rounded-lg bg-rough p-4 text-white shadow-glow"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="shot-history-title"
                className="text-sm font-black uppercase tracking-wide text-white/70"
              >
                Shot history
              </h2>
              <button
                type="button"
                onClick={() => setIsLogOpen(false)}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-emerald-300"
              >
                Close
              </button>
            </div>
            <div className="mt-3 max-h-80 space-y-2 overflow-auto">
              {shotLog.map((entry) => (
                <p
                  key={entry.id}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold"
                >
                  {entry.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
