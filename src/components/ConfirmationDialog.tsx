"use client";

import type { GameConfirmation } from "@/lib/game/types";

export default function ConfirmationDialog({
  confirmation,
  onConfirm
}: {
  confirmation: GameConfirmation | null;
  onConfirm: () => void;
}) {
  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rough/55 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-glow"
      >
        <p className="text-xs font-black uppercase tracking-wide text-fairway">
          {confirmation.type === "shot" ? "Shot result" : "Hole complete"}
        </p>
        <h2 id="confirmation-title" className="mt-2 text-3xl font-black text-rough">
          {confirmation.title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-emerald-950/70">
          {confirmation.message}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-lg bg-fairway px-5 py-3 text-base font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        >
          {confirmation.actionLabel}
        </button>
      </div>
    </div>
  );
}
