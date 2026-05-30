import { EMPTY_BEST_POINTS, EMPTY_BEST_SCORES, STORAGE_KEYS } from "./constants";
import type { LeaderboardEntry, RoundLength, RoundLengthRecords } from "./types";

export function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : Number(value);
}

export function readString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

export function readLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(STORAGE_KEYS.leaderboard);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => typeof entry === "object" && entry !== null)
      .map((entry) => ({
        ...entry,
        roundLength: isRoundLength(entry.roundLength) ? entry.roundLength : 3
      }));
  } catch {
    return [];
  }
}

function isRoundLength(value: unknown): value is RoundLength {
  return value === 3 || value === 6 || value === 9;
}

function readRecordMap<T>(
  key: string,
  fallback: RoundLengthRecords<T>,
  normalize: (value: unknown, roundLength: RoundLength) => T
): RoundLengthRecords<T> {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return {
      3: normalize(parsed?.[3], 3),
      6: normalize(parsed?.[6], 6),
      9: normalize(parsed?.[9], 9)
    };
  } catch {
    return fallback;
  }
}

export function readBestScores(): RoundLengthRecords<number | null> {
  const savedScores = readRecordMap(STORAGE_KEYS.bestScore, EMPTY_BEST_SCORES, (value) =>
    typeof value === "number" && value > 0 ? value : null
  );
  const legacyBestScore = readNumber(STORAGE_KEYS.bestScore, 0);

  return {
    ...savedScores,
    3: savedScores[3] ?? (legacyBestScore > 0 ? legacyBestScore : null)
  };
}

export function readBestPoints(): RoundLengthRecords<number> {
  const savedPoints = readRecordMap(STORAGE_KEYS.bestPoints, EMPTY_BEST_POINTS, (value) =>
    typeof value === "number" ? value : 0
  );
  const legacyBestPoints = readNumber(STORAGE_KEYS.bestPoints, 0);

  return {
    ...savedPoints,
    3: Math.max(savedPoints[3], Number.isFinite(legacyBestPoints) ? legacyBestPoints : 0)
  };
}

export function savePlayerName(playerName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.playerName, playerName);
}

export function saveRunRecords(records: {
  bestScores: RoundLengthRecords<number | null>;
  bestPoints: RoundLengthRecords<number>;
  runsCompleted: number;
  leaderboard: LeaderboardEntry[];
}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.bestScore, JSON.stringify(records.bestScores));
  window.localStorage.setItem(STORAGE_KEYS.bestPoints, JSON.stringify(records.bestPoints));
  window.localStorage.setItem(STORAGE_KEYS.runsCompleted, String(records.runsCompleted));
  window.localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(records.leaderboard));
}

export function sortLeaderboard(entries: LeaderboardEntry[], roundLength?: RoundLength) {
  const sortedEntries = [...entries]
    .filter((entry) => roundLength === undefined || entry.roundLength === roundLength)
    .sort((a, b) => a.strokes - b.strokes || b.points - a.points);

  return roundLength === undefined ? sortedEntries : sortedEntries.slice(0, 10);
}
