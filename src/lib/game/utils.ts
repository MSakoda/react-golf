import {
  BASE_THRESHOLDS,
  CLUB_DISTANCES,
  HOLE_YARD_RANGES,
  QUALITY_MULTIPLIERS,
  SHOT_POINTS,
  UPGRADES
} from "./constants";
import type { Club, Hole, RoundLength, ShotQuality, Upgrade } from "./types";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function createRunHoles(roundLength: RoundLength): Hole[] {
  const holesPerPar = roundLength / 3;
  const generatedHoles = ([3, 4, 5] as const).flatMap((par) =>
    Array.from({ length: holesPerPar }, () => ({
      par,
      yards: randomInt(HOLE_YARD_RANGES[par].min, HOLE_YARD_RANGES[par].max),
      modifier: Math.random() < 0.35 ? "Windy" as const : undefined
    }))
  );

  return shuffle(generatedHoles).map((hole, index) => ({
    ...hole,
    number: index + 1
  }));
}

export function getClub(distanceRemaining: number): Club {
  if (distanceRemaining >= 151) return "Driver";
  if (distanceRemaining >= 71) return "Iron";
  if (distanceRemaining >= 21) return "Wedge";
  return "Putter";
}

export function hasUpgrade(upgrades: Upgrade[], id: string): boolean {
  return upgrades.some((upgrade) => upgrade.id === id);
}

export function countUpgrade(upgrades: Upgrade[], id: string): number {
  return upgrades.filter((upgrade) => upgrade.id === id).length;
}

export function getAdjustedThresholds(upgrades: Upgrade[]) {
  const steadyStacks = countUpgrade(upgrades, "steady-hands");
  return {
    perfect: BASE_THRESHOLDS.perfect + steadyStacks * 0.018,
    good: BASE_THRESHOLDS.good + steadyStacks * 0.026,
    okay: BASE_THRESHOLDS.okay
  };
}

export function getQuality(
  markerPosition: number,
  upgrades: Upgrade[],
  club: Club
): ShotQuality {
  const thresholds = getAdjustedThresholds(upgrades);
  const distanceFromCenter = Math.abs(markerPosition - 0.5);
  const wedgeForgiveness =
    club === "Wedge" && hasUpgrade(upgrades, "wedge-wizard") ? 0.035 : 0;

  if (distanceFromCenter <= thresholds.perfect + wedgeForgiveness) return "Perfect";
  if (distanceFromCenter <= thresholds.good + wedgeForgiveness) return "Good";
  if (distanceFromCenter <= thresholds.okay + wedgeForgiveness) return "Okay";
  return "Bad";
}

export function getAvailableUpgradeChoices(activeUpgrades: Upgrade[]): Upgrade[] {
  const available = UPGRADES.filter(
    (upgrade) => upgrade.stackable || !hasUpgrade(activeUpgrades, upgrade.id)
  );
  return [...available].sort(() => Math.random() - 0.5).slice(0, 3);
}

export function getHoleFinishPoints(strokes: number, par: number) {
  const relation = strokes - par;
  if (relation <= -3) return { label: "Albatross",points: 1000 };
  if (relation === -2) return { label: "Eagle", points: 800 };
  if (relation === -1) return { label: "Birdie", points: 500 };
  if (relation === 0) return { label: "Par", points: 250 };
  if (relation === 1) return { label: "Bogey", points: 100 };
  return { label: "Double bogey or worse", points: 25 };
}

export function resolveShot(params: {
  club: Club;
  quality: ShotQuality;
  distanceRemaining: number;
  hole: Hole;
  upgrades: Upgrade[];
  usedLuckyBounceThisHole: boolean;
}) {
  const { club, distanceRemaining, hole, upgrades } = params;
  let quality = params.quality;
  const log: string[] = [];
  let usedLuckyBounce = params.usedLuckyBounceThisHole;

  if (
    quality === "Bad" &&
    club !== "Putter" &&
    !usedLuckyBounce &&
    hasUpgrade(upgrades, "lucky-bounce")
  ) {
    quality = "Okay";
    usedLuckyBounce = true;
    log.push(`Lucky Bounce! Bad ${club} became Okay.`);
  }

  if (club === "Putter") {
    if (
      quality === "Perfect" ||
      (quality === "Good" && (distanceRemaining <= 2 || hasUpgrade(upgrades, "soft-touch")))
    ) {
      if (quality === "Good" && hasUpgrade(upgrades, "soft-touch")) {
        log.push("Good putt dropped thanks to Soft Touch.");
      }
      return {
        quality,
        shotDistance: distanceRemaining,
        nextDistance: 0,
        points: SHOT_POINTS[quality],
        usedLuckyBounce,
        log
      };
    }

    const nextDistance = quality === "Good" ? 2 : quality === "Okay" ? 5 : 10;
    return {
      quality,
      shotDistance: Math.max(distanceRemaining - nextDistance, 0),
      nextDistance,
      points: SHOT_POINTS[quality],
      usedLuckyBounce,
      log
    };
  }

  const speedStacks = countUpgrade(upgrades, "clubhead-speed");
  const speedBonus = 1 + speedStacks * 0.1;
  const windPenalty =
    hole.modifier === "Windy" && !hasUpgrade(upgrades, "wind-reader") ? 0.85 : 1;
  const shotDistance = Math.round(
    CLUB_DISTANCES[club] * QUALITY_MULTIPLIERS[quality] * speedBonus * windPenalty
  );
  const overshotBy = shotDistance - distanceRemaining;
  const shouldHole =
    quality === "Perfect" ||
    overshotBy <= 12 ||
    (distanceRemaining <= 18 && quality !== "Bad");
  const nextDistance =
    shotDistance >= distanceRemaining
      ? shouldHole
        ? 0
        : Math.min(Math.max(overshotBy, 8), 20)
      : distanceRemaining - shotDistance;

  return {
    quality,
    shotDistance: Math.min(shotDistance, distanceRemaining),
    nextDistance: Math.max(Math.round(nextDistance), 0),
    points: SHOT_POINTS[quality],
    usedLuckyBounce,
    log
  };
}
