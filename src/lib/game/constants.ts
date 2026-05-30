import type { Club, RoundLength, RoundLengthRecords, ShotQuality, Upgrade } from "./types";

export const STORAGE_KEYS = {
  bestScore: "rogue-links-best-score",
  bestPoints: "rogue-links-best-points",
  runsCompleted: "rogue-links-runs-completed",
  playerName: "rogue-links-player-name",
  leaderboard: "rogue-links-leaderboard"
} as const;

export const ROUND_LENGTHS = [3, 6, 9] as const satisfies readonly RoundLength[];

export const DEFAULT_ROUND_LENGTH: RoundLength = 3;

export const EMPTY_BEST_SCORES: RoundLengthRecords<number | null> = {
  3: null,
  6: null,
  9: null
};

export const EMPTY_BEST_POINTS: RoundLengthRecords<number> = {
  3: 0,
  6: 0,
  9: 0
};

export const HOLE_YARD_RANGES = {
  3: { min: 110, max: 190 },
  4: { min: 280, max: 420 },
  5: { min: 440, max: 580 }
} as const;

export const CLUB_DISTANCES: Record<Club, number> = {
  Driver: 220,
  Iron: 150,
  Wedge: 70,
  Putter: 20
};

export const QUALITY_MULTIPLIERS: Record<ShotQuality, number> = {
  Perfect: 1,
  Good: 0.85,
  Okay: 0.65,
  Bad: 0.4
};

export const SHOT_POINTS: Record<ShotQuality, number> = {
  Perfect: 75,
  Good: 35,
  Okay: 10,
  Bad: 0
};

export const BASE_THRESHOLDS = {
  perfect: 0.06,
  good: 0.16,
  okay: 0.32
};

export const UPGRADES: Upgrade[] = [
  {
    id: "steady-hands",
    name: "Steady Hands",
    description: "Widens the perfect and good timing zones.",
    stackable: true
  },
  {
    id: "clubhead-speed",
    name: "Extra Clubhead Speed",
    description: "Non-putter shots gain +10% distance.",
    stackable: true
  },
  {
    id: "soft-touch",
    name: "Soft Touch",
    description: "Good putts also hole out.",
    stackable: false
  },
  {
    id: "wedge-wizard",
    name: "Wedge Wizard",
    description: "Wedge shots gain extra forgiveness near quality thresholds.",
    stackable: false
  },
  {
    id: "lucky-bounce",
    name: "Lucky Bounce",
    description: "Once per hole, a Bad non-putter shot becomes Okay.",
    stackable: false
  },
  {
    id: "wind-reader",
    name: "Wind Reader",
    description: "Ignore Windy distance penalties.",
    stackable: false
  }
];
