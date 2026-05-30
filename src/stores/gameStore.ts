import { create } from "zustand";
import { DEFAULT_ROUND_LENGTH, EMPTY_BEST_POINTS, EMPTY_BEST_SCORES, STORAGE_KEYS } from "@/lib/game/constants";
import { createLogEntry } from "@/lib/game/logging";
import {
  readLeaderboard,
  readBestPoints,
  readBestScores,
  readNumber,
  readString,
  savePlayerName,
  saveRunRecords,
  sortLeaderboard
} from "@/lib/game/records";
import { getFinishName } from "@/lib/game/scoring";
import type { GameState, RoundLength, Upgrade } from "@/lib/game/types";
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
  setRoundLength: (roundLength: RoundLength) => void;
  setLeaderboardRoundLength: (roundLength: RoundLength) => void;
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
  roundLength: DEFAULT_ROUND_LENGTH,
  leaderboardRoundLength: DEFAULT_ROUND_LENGTH,
  bestScores: EMPTY_BEST_SCORES,
  bestPoints: EMPTY_BEST_POINTS,
  runsCompleted: 0,
  playerName: "",
  leaderboard: []
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  hydrateRecords: () => {
    set({
      bestScores: readBestScores(),
      bestPoints: readBestPoints(),
      runsCompleted: readNumber(STORAGE_KEYS.runsCompleted, 0),
      playerName: readString(STORAGE_KEYS.playerName, ""),
      leaderboard: sortLeaderboard(readLeaderboard())
    });
  },

  setRoundLength: (roundLength: RoundLength) => {
    set({ roundLength });
  },

  setLeaderboardRoundLength: (roundLength: RoundLength) => {
    set({ leaderboardRoundLength: roundLength });
  },

  setPlayerName: (playerName: string) => {
    const cleanName = playerName.slice(0, 24);
    savePlayerName(cleanName);
    set({ playerName: cleanName });
  },

  startRun: () => {
    const playerName = get().playerName.trim() || "Player";
    savePlayerName(playerName);
    const holes = createRunHoles(get().roundLength);
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
      shotLog: [createLogEntry("Practice round started. Hole 1 awaits.")],
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
    const nextLog = [
      ...result.log.map(createLogEntry),
      createLogEntry(shotText),
      ...state.shotLog
    ].slice(0, 8);
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
            : `That was a ${pending.quality.toLowerCase()} swing. You hit it ${pending.shotDistance} yards with your ${pending.club}.`,
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
      createLogEntry(`Finished Hole ${hole.number} with ${finish.label}.`),
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
      const currentBestScore = state.bestScores[state.roundLength];
      const bestScore =
        currentBestScore === null
          ? pending.totalStrokes
          : Math.min(currentBestScore, pending.totalStrokes);
      const bestScores = {
        ...state.bestScores,
        [state.roundLength]: bestScore
      };
      const bestPoints = {
        ...state.bestPoints,
        [state.roundLength]: Math.max(state.bestPoints[state.roundLength], finalPoints)
      };
      const runsCompleted = state.runsCompleted + 1;
      const leaderboard = sortLeaderboard([
        ...state.leaderboard,
        {
          id: `${Date.now()}-${Math.random()}`,
          playerName: state.playerName.trim() || "Player",
          strokes: pending.totalStrokes,
          points: finalPoints,
          roundLength: state.roundLength,
          date: new Date().toISOString()
        }
      ]);
      saveRunRecords({ bestScores, bestPoints, runsCompleted, leaderboard });
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
        bestScores,
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
        createLogEntry(`${upgrade.name} added. Hole ${nextHole.number} is up.`),
        ...state.shotLog
      ].slice(0, 8)
    });
  },

  returnHome: () =>
    set({
      ...initialState,
      bestScores: get().bestScores,
      bestPoints: get().bestPoints,
      runsCompleted: get().runsCompleted,
      playerName: get().playerName,
      leaderboard: get().leaderboard,
      roundLength: get().roundLength,
      leaderboardRoundLength: get().leaderboardRoundLength
    })
}));
