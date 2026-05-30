export type Screen = "home" | "playing" | "upgrade" | "complete";

export type Club = "Driver" | "Iron" | "Wedge" | "Putter";

export type ShotQuality = "Perfect" | "Good" | "Okay" | "Bad";

export type RoundLength = 3 | 6 | 9;

export type RoundLengthRecords<T> = Record<RoundLength, T>;

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

export interface HoleScore {
  holeNumber: number;
  par: number;
  strokes: number;
}

export interface ShotAnimation {
  id: string;
  fromDistance: number;
  toDistance: number;
  holeYards: number;
  holePar: number;
  club: Club;
  quality: ShotQuality;
}

export interface PendingShotResult {
  nextDistance: number;
  club: Club;
  quality: ShotQuality;
  shotDistance: number;
  strokesThisHole: number;
  totalStrokes: number;
  totalPoints: number;
  usedLuckyBounceThisHole: boolean;
  shotLog: ShotLogEntry[];
}

export interface GameConfirmation {
  type: "shot" | "hole";
  title: string;
  message: string;
  actionLabel: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  strokes: number;
  points: number;
  roundLength: RoundLength;
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
  confirmation: GameConfirmation | null;
  shotLog: ShotLogEntry[];
  holeScores: HoleScore[];
  upgradeChoices: Upgrade[];
  roundLength: RoundLength;
  leaderboardRoundLength: RoundLength;
  bestScores: RoundLengthRecords<number | null>;
  bestPoints: RoundLengthRecords<number>;
  runsCompleted: number;
  playerName: string;
  leaderboard: LeaderboardEntry[];
}
