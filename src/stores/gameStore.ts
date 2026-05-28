import { create } from "zustand";
import { STORAGE_KEYS } from "@/lib/game/constants";
import type { GameState, LeaderboardEntry, ShotLogEntry, Upgrade } from "@/lib/game/types";
import {
  createRunHoles,
  getAvailableUpgradeChoices,
  getClub,
  getHoleFinishPoints,
  getQuality,
  resolveShot
} from "@/lib/game/utils";

interface GameActions {
  hydrateRecords: () => void;
  setPlayerName: (playerName: string) => void;
  startRun: () => void;
  takeShot: (markerPosition: number) => void;
  completeShotAnimation: () => void;
  acknowledgeConfirmation: () => void;
  chooseUpgrade: (upgrade: Upgrade) => void;
  returnHome: () => void;
}

const initialState: GameState = {
  currentScreen: "home",
  currentHoleIndex: 0,
  holes: [],
  distanceRemaining: 0,
  strokesThisHole: 0,
  totalStrokes: 0,
  totalPoints: 0,
  activeUpgrades: [],
  usedLuckyBounceThisHole: false,
  isShotAnimating: false,
  shotAnimation: null,
  pendingShotResult: null,
  confirmation: null,
  shotLog: [],
  holeScores: [],
  upgradeChoices: [],
  bestScore: null,
  bestPoints: 0,
  runsCompleted: 0,
  playerName: "",
  leaderboard: []
};

function logEntry(text: string): ShotLogEntry {
  return { id: `${Date.now()}-${Math.random()}`, text };
}

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : Number(value);
}

function readString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function readLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(STORAGE_KEYS.leaderboard);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  return [...entries]
    .sort((a, b) => a.strokes - b.strokes || b.points - a.points)
    .slice(0, 10);
}

function getFinishName(strokes: number, par: number) {
  const relation = strokes - par;
  if (strokes === 1) return "Hole in one";
  if (relation <= -2) return "Eagle";
  if (relation === -1) return "Birdie";
  if (relation === 0) return "Par";
  if (relation === 1) return "Bogey";
  if (relation === 2) return "Double bogey";
  return "Triple bogey or worse";
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  hydrateRecords: () => {
    const savedBestScore = readNumber(STORAGE_KEYS.bestScore, 0);
    set({
      bestScore: savedBestScore > 0 ? savedBestScore : null,
      bestPoints: readNumber(STORAGE_KEYS.bestPoints, 0),
      runsCompleted: readNumber(STORAGE_KEYS.runsCompleted, 0),
      playerName: readString(STORAGE_KEYS.playerName, ""),
      leaderboard: sortLeaderboard(readLeaderboard())
    });
  },

  setPlayerName: (playerName: string) => {
    const cleanName = playerName.slice(0, 24);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.playerName, cleanName);
    }
    set({ playerName: cleanName });
  },

  startRun: () => {
    const playerName = get().playerName.trim() || "Player";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.playerName, playerName);
    }
    const holes = createRunHoles();
    set({
      currentScreen: "playing",
      currentHoleIndex: 0,
      holes,
      distanceRemaining: holes[0].yards,
      strokesThisHole: 0,
      totalStrokes: 0,
      totalPoints: 0,
      activeUpgrades: [],
      usedLuckyBounceThisHole: false,
      isShotAnimating: false,
      shotAnimation: null,
      pendingShotResult: null,
      confirmation: null,
      playerName,
      shotLog: [logEntry("Practice round started. Hole 1 awaits.")],
      holeScores: [],
      upgradeChoices: []
    });
  },

  takeShot: (markerPosition: number) => {
    const state = get();
    const hole = state.holes[state.currentHoleIndex];
    if (!hole || state.currentScreen !== "playing" || state.isShotAnimating || state.confirmation) {
      return;
    }

    const club = getClub(state.distanceRemaining);
    const baseQuality = getQuality(markerPosition, state.activeUpgrades, club);
    const result = resolveShot({
      club,
      quality: baseQuality,
      distanceRemaining: state.distanceRemaining,
      hole,
      upgrades: state.activeUpgrades,
      usedLuckyBounceThisHole: state.usedLuckyBounceThisHole
    });
    const strokesThisHole = state.strokesThisHole + 1;
    const totalStrokes = state.totalStrokes + 1;
    const shotText =
      club === "Putter"
        ? `${result.quality} putt: ${result.nextDistance === 0 ? "holed" : `${result.nextDistance} yards left`}`
        : `${result.quality} ${club}: ${result.shotDistance} yards`;
    const nextLog = [...result.log.map(logEntry), logEntry(shotText), ...state.shotLog].slice(0, 8);
    const totalPoints = state.totalPoints + result.points;

    set({
      isShotAnimating: true,
      shotAnimation: {
        id: `${Date.now()}-${Math.random()}`,
        fromDistance: state.distanceRemaining,
        toDistance: result.nextDistance,
        holeYards: hole.yards,
        holePar: hole.par,
        club,
        quality: result.quality
      },
      pendingShotResult: {
        nextDistance: result.nextDistance,
        club,
        quality: result.quality,
        shotDistance: result.shotDistance,
        strokesThisHole,
        totalStrokes,
        totalPoints,
        usedLuckyBounceThisHole: result.usedLuckyBounce,
        shotLog: nextLog
      }
    });
  },

  completeShotAnimation: () => {
    const state = get();
    const pending = state.pendingShotResult;
    if (!pending) return;

    set({
      isShotAnimating: false,
      shotAnimation: null,
      confirmation: {
        type: "shot",
        title: `${pending.quality} ${pending.club}`,
        message:
          pending.club === "Putter"
            ? pending.nextDistance === 0
              ? `That was a ${pending.quality.toLowerCase()} putt, and it dropped.`
              : `That was a ${pending.quality.toLowerCase()} putt that left ${pending.nextDistance} yards.`
            : `That was a ${pending.quality.toLowerCase()} swing. You hit it ${pending.shotDistance} yards with ${pending.club}.`,
        actionLabel: pending.nextDistance === 0 ? "See hole result" : "Next shot"
      }
    });
  },

  acknowledgeConfirmation: () => {
    const state = get();
    const hole = state.holes[state.currentHoleIndex];
    const pending = state.pendingShotResult;
    if (!hole || !pending || !state.confirmation) return;

    if (state.confirmation.type === "shot" && pending.nextDistance === 0) {
      const finish = getHoleFinishPoints(pending.strokesThisHole, hole.par);
      const finishName = getFinishName(pending.strokesThisHole, hole.par);
      set({
        confirmation: {
          type: "hole",
          title: `Hole ${hole.number}: ${finishName}`,
          message: `Finished in ${pending.strokesThisHole} stroke${pending.strokesThisHole === 1 ? "" : "s"} for ${finish.points} bonus points.`,
          actionLabel: state.currentHoleIndex === state.holes.length - 1 ? "Finish run" : "Choose upgrade"
        }
      });
      return;
    }

    if (pending.nextDistance > 0) {
      set({
        confirmation: null,
        pendingShotResult: null,
        distanceRemaining: pending.nextDistance,
        strokesThisHole: pending.strokesThisHole,
        totalStrokes: pending.totalStrokes,
        totalPoints: pending.totalPoints,
        usedLuckyBounceThisHole: pending.usedLuckyBounceThisHole,
        shotLog: pending.shotLog
      });
      return;
    }

    const finish = getHoleFinishPoints(pending.strokesThisHole, hole.par);
    const finishedLog = [
      logEntry(`Finished Hole ${hole.number} with ${finish.label}.`),
      ...pending.shotLog
    ].slice(0, 8);
    const isFinalHole = state.currentHoleIndex === state.holes.length - 1;
    const finalPoints = pending.totalPoints + finish.points;
    const holeScores = [
      ...state.holeScores.filter((score) => score.holeNumber !== hole.number),
      {
        holeNumber: hole.number,
        par: hole.par,
        strokes: pending.strokesThisHole
      }
    ].sort((a, b) => a.holeNumber - b.holeNumber);

    if (isFinalHole) {
      const currentBestScore = state.bestScore;
      const bestScore =
        currentBestScore === null
          ? pending.totalStrokes
          : Math.min(currentBestScore, pending.totalStrokes);
      const bestPoints = Math.max(state.bestPoints, finalPoints);
      const runsCompleted = state.runsCompleted + 1;
      const leaderboard = sortLeaderboard([
        ...state.leaderboard,
        {
          id: `${Date.now()}-${Math.random()}`,
          playerName: state.playerName.trim() || "Player",
          strokes: pending.totalStrokes,
          points: finalPoints,
          date: new Date().toISOString()
        }
      ]);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.bestScore, String(bestScore));
        window.localStorage.setItem(STORAGE_KEYS.bestPoints, String(bestPoints));
        window.localStorage.setItem(STORAGE_KEYS.runsCompleted, String(runsCompleted));
        window.localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(leaderboard));
      }
      set({
        currentScreen: "complete",
        confirmation: null,
        pendingShotResult: null,
        distanceRemaining: 0,
        strokesThisHole: pending.strokesThisHole,
        totalStrokes: pending.totalStrokes,
        totalPoints: finalPoints,
        shotLog: finishedLog,
        holeScores,
        bestScore,
        bestPoints,
        runsCompleted,
        leaderboard
      });
      return;
    }

    set({
      currentScreen: "upgrade",
      confirmation: null,
      pendingShotResult: null,
      distanceRemaining: 0,
      strokesThisHole: pending.strokesThisHole,
      totalStrokes: pending.totalStrokes,
      totalPoints: finalPoints,
      shotLog: finishedLog,
      holeScores,
      upgradeChoices: getAvailableUpgradeChoices(state.activeUpgrades)
    });
  },

  chooseUpgrade: (upgrade: Upgrade) => {
    const state = get();
    const nextHoleIndex = state.currentHoleIndex + 1;
    const nextHole = state.holes[nextHoleIndex];
    if (!nextHole) return;

    set({
      currentScreen: "playing",
      currentHoleIndex: nextHoleIndex,
      distanceRemaining: nextHole.yards,
      strokesThisHole: 0,
      activeUpgrades: [...state.activeUpgrades, upgrade],
      usedLuckyBounceThisHole: false,
      isShotAnimating: false,
      shotAnimation: null,
      pendingShotResult: null,
      confirmation: null,
      upgradeChoices: [],
      shotLog: [
        logEntry(`${upgrade.name} added. Hole ${nextHole.number} is up.`),
        ...state.shotLog
      ].slice(0, 8)
    });
  },

  returnHome: () =>
    set({
      ...initialState,
      bestScore: get().bestScore,
      bestPoints: get().bestPoints,
      runsCompleted: get().runsCompleted,
      playerName: get().playerName,
      leaderboard: get().leaderboard
    })
}));
