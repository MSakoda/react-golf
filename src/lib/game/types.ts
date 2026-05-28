export type Screen = "home" | "playing" | "upgrade" | "complete";

export type Club = "Driver" | "Iron" | "Wedge" | "Putter";

export type ShotQuality = "Perfect" | "Good" | "Okay" | "Bad";

export interface Hole {
  number: number;
  par: number;
  yards: number;
  modifier?: "Windy";
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  stackable: boolean;
}

export interface ShotLogEntry {
  id: string;
  text: string;
}

export interface ShotAnimation {
  id: string;
  fromDistance: number;
  toDistance: number;
  holeYards: number;
  club: Club;
  quality: ShotQuality;
}

export interface PendingShotResult {
  nextDistance: number;
  strokesThisHole: number;
  totalStrokes: number;
  totalPoints: number;
  usedLuckyBounceThisHole: boolean;
  shotLog: ShotLogEntry[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  strokes: number;
  points: number;
  date: string;
}

export interface GameState {
  currentScreen: Screen;
  currentHoleIndex: number;
  holes: Hole[];
  distanceRemaining: number;
  strokesThisHole: number;
  totalStrokes: number;
  totalPoints: number;
  activeUpgrades: Upgrade[];
  usedLuckyBounceThisHole: boolean;
  isShotAnimating: boolean;
  shotAnimation: ShotAnimation | null;
  pendingShotResult: PendingShotResult | null;
  shotLog: ShotLogEntry[];
  upgradeChoices: Upgrade[];
  bestScore: number | null;
  bestPoints: number;
  runsCompleted: number;
  playerName: string;
  leaderboard: LeaderboardEntry[];
}
