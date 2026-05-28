import type { Club, ShotQuality, Upgrade } from "./types";

export const STORAGE_KEYS = {
  bestScore: "rogue-links-best-score",
  bestPoints: "rogue-links-best-points",
  runsCompleted: "rogue-links-runs-completed",
  playerName: "rogue-links-player-name",
  leaderboard: "rogue-links-leaderboard"
} as const;

export const BASE_HOLES = [
  { number: 1, par: 3, yards: 145 },
  { number: 2, par: 4, yards: 325 },
  { number: 3, par: 5, yards: 480 }
] as const;

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
