import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "./constants";
import {
  readBestPoints,
  readBestScores,
  readLeaderboard,
  readNumber,
  saveRunRecords,
  sortLeaderboard
} from "./records";
import type { LeaderboardEntry } from "./types";

const entry = (
  id: string,
  strokes: number,
  points: number,
  roundLength: 3 | 6 | 9 = 3
): LeaderboardEntry => ({ id, playerName: id, strokes, points, roundLength, date: "2026-01-01" });

beforeEach(() => localStorage.clear());

describe("sortLeaderboard", () => {
  it("orders by fewest strokes, then most points", () => {
    const sorted = sortLeaderboard([entry("c", 9, 100), entry("a", 7, 100), entry("b", 7, 300)]);
    expect(sorted.map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  it("filters to one round length and keeps the top 10", () => {
    const entries = [
      ...Array.from({ length: 12 }, (_, i) => entry(`n${i}`, 10 + i, 0, 3)),
      entry("six", 1, 0, 6)
    ];
    const top = sortLeaderboard(entries, 3);
    expect(top).toHaveLength(10);
    expect(top.every((e) => e.roundLength === 3)).toBe(true);
    expect(top[0].id).toBe("n0");
  });

  it("handles an empty list and does not mutate its input", () => {
    expect(sortLeaderboard([], 3)).toEqual([]);
    const input = [entry("b", 9, 0), entry("a", 5, 0)];
    sortLeaderboard(input);
    expect(input.map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("reading saved records", () => {
  it("falls back when nothing is stored", () => {
    expect(readNumber("missing", 7)).toBe(7);
    expect(readLeaderboard()).toEqual([]);
    expect(readBestScores()).toEqual({ 3: null, 6: null, 9: null });
    expect(readBestPoints()).toEqual({ 3: 0, 6: 0, 9: 0 });
  });

  it("survives corrupt JSON and non-array leaderboards", () => {
    localStorage.setItem(STORAGE_KEYS.leaderboard, "{not json");
    expect(readLeaderboard()).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify({ a: 1 }));
    expect(readLeaderboard()).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.bestScore, "{not json");
    expect(readBestScores()[6]).toBeNull();
  });

  it("defaults a missing or invalid round length to 3 and drops non-objects", () => {
    localStorage.setItem(
      STORAGE_KEYS.leaderboard,
      JSON.stringify([
        { ...entry("old", 5, 5), roundLength: undefined },
        { ...entry("bad", 5, 5), roundLength: 4 },
        42,
        null
      ])
    );
    expect(readLeaderboard().map((e) => e.roundLength)).toEqual([3, 3]);
  });

  it("migrates a legacy single best score into the 3-hole slot", () => {
    localStorage.setItem(STORAGE_KEYS.bestScore, "12");
    localStorage.setItem(STORAGE_KEYS.bestPoints, "340");
    expect(readBestScores()).toEqual({ 3: 12, 6: null, 9: null });
    expect(readBestPoints()).toEqual({ 3: 340, 6: 0, 9: 0 });
  });

  it("round-trips what saveRunRecords writes", () => {
    saveRunRecords({
      bestScores: { 3: 10, 6: null, 9: 30 },
      bestPoints: { 3: 500, 6: 0, 9: 900 },
      runsCompleted: 4,
      leaderboard: [entry("a", 10, 500)]
    });
    expect(readBestScores()).toEqual({ 3: 10, 6: null, 9: 30 });
    expect(readBestPoints()).toEqual({ 3: 500, 6: 0, 9: 900 });
    expect(readNumber(STORAGE_KEYS.runsCompleted, 0)).toBe(4);
    expect(readLeaderboard()).toEqual([entry("a", 10, 500)]);
  });
});
