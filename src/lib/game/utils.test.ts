import { afterEach, describe, expect, it, vi } from "vitest";
import { HOLE_YARD_RANGES, UPGRADES } from "./constants";
import type { Upgrade } from "./types";
import {
  countUpgrade,
  createRunHoles,
  getAdjustedThresholds,
  getAvailableUpgradeChoices,
  getClub,
  getHoleFinishPoints,
  getQuality,
  hasUpgrade,
  resolveShot
} from "./utils";

const upgrade = (id: string): Upgrade => {
  const found = UPGRADES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`unknown upgrade ${id}`);
  return found;
};

const flatHole = { number: 1, par: 4, yards: 400 };
const windyHole = { ...flatHole, modifier: "Windy" as const };

afterEach(() => vi.restoreAllMocks());

describe("getClub", () => {
  it("switches club at 151, 71 and 21 yards", () => {
    expect(getClub(400)).toBe("Driver");
    expect(getClub(151)).toBe("Driver");
    expect(getClub(150)).toBe("Iron");
    expect(getClub(71)).toBe("Iron");
    expect(getClub(70)).toBe("Wedge");
    expect(getClub(21)).toBe("Wedge");
    expect(getClub(20)).toBe("Putter");
    expect(getClub(0)).toBe("Putter");
  });
});

describe("hasUpgrade / countUpgrade", () => {
  it("handles no upgrades, one and stacked", () => {
    const steady = upgrade("steady-hands");
    expect(hasUpgrade([], "steady-hands")).toBe(false);
    expect(countUpgrade([], "steady-hands")).toBe(0);
    expect(hasUpgrade([steady], "steady-hands")).toBe(true);
    expect(hasUpgrade([steady], "soft-touch")).toBe(false);
    expect(countUpgrade([steady, upgrade("soft-touch"), steady], "steady-hands")).toBe(2);
  });
});

describe("getAdjustedThresholds", () => {
  it("returns the base zones with no upgrades", () => {
    expect(getAdjustedThresholds([])).toEqual({ perfect: 0.06, good: 0.16, okay: 0.32 });
  });

  it("widens perfect and good per Steady Hands stack, never okay", () => {
    const steady = upgrade("steady-hands");
    const one = getAdjustedThresholds([steady]);
    expect(one.perfect).toBeCloseTo(0.078);
    expect(one.good).toBeCloseTo(0.186);
    expect(one.okay).toBe(0.32);
    const two = getAdjustedThresholds([steady, steady]);
    expect(two.perfect).toBeCloseTo(0.096);
    expect(two.good).toBeCloseTo(0.212);
  });
});

describe("getQuality", () => {
  it("grades by distance from the centre, either side", () => {
    expect(getQuality(0.5, [], "Driver")).toBe("Perfect");
    expect(getQuality(0.559, [], "Driver")).toBe("Perfect");
    expect(getQuality(0.441, [], "Driver")).toBe("Perfect");
    expect(getQuality(0.561, [], "Driver")).toBe("Good");
    expect(getQuality(0.659, [], "Driver")).toBe("Good");
    expect(getQuality(0.661, [], "Driver")).toBe("Okay");
    expect(getQuality(0.819, [], "Driver")).toBe("Okay");
    expect(getQuality(0.821, [], "Driver")).toBe("Bad");
    expect(getQuality(0, [], "Driver")).toBe("Bad");
    expect(getQuality(1, [], "Driver")).toBe("Bad");
  });

  it("Steady Hands turns a Good swing into Perfect and an Okay into Good", () => {
    const steady = [upgrade("steady-hands")];
    expect(getQuality(0.575, [], "Driver")).toBe("Good");
    expect(getQuality(0.575, steady, "Driver")).toBe("Perfect");
    expect(getQuality(0.68, [], "Driver")).toBe("Okay");
    expect(getQuality(0.68, steady, "Driver")).toBe("Good");
  });

  it("Wedge Wizard only forgives wedge shots", () => {
    const wizard = [upgrade("wedge-wizard")];
    expect(getQuality(0.59, wizard, "Wedge")).toBe("Perfect");
    expect(getQuality(0.59, wizard, "Iron")).toBe("Good");
    expect(getQuality(0.59, [], "Wedge")).toBe("Good");
  });
});

describe("getHoleFinishPoints", () => {
  it("awards points by strokes relative to par 4", () => {
    expect(getHoleFinishPoints(1, 4)).toEqual({ label: "Albatross", points: 1000 });
    expect(getHoleFinishPoints(2, 4)).toEqual({ label: "Eagle", points: 800 });
    expect(getHoleFinishPoints(3, 4)).toEqual({ label: "Birdie", points: 500 });
    expect(getHoleFinishPoints(4, 4)).toEqual({ label: "Par", points: 250 });
    expect(getHoleFinishPoints(5, 4)).toEqual({ label: "Bogey", points: 100 });
    expect(getHoleFinishPoints(6, 4)).toEqual({ label: "Double bogey or worse", points: 25 });
    expect(getHoleFinishPoints(15, 4)).toEqual({ label: "Double bogey or worse", points: 25 });
  });
});

describe("resolveShot: full swings", () => {
  const base = { hole: flatHole, upgrades: [] as Upgrade[], usedLuckyBounceThisHole: false };

  it("a Perfect driver from 400 carries 220 and leaves 180", () => {
    const result = resolveShot({ ...base, club: "Driver", quality: "Perfect", distanceRemaining: 400 });
    expect(result).toMatchObject({ shotDistance: 220, nextDistance: 180, points: 75 });
  });

  it("scales carry by swing quality: Good 187, Okay 143, Bad 88", () => {
    const carry = (quality: "Good" | "Okay" | "Bad") =>
      resolveShot({ ...base, club: "Driver", quality, distanceRemaining: 400 }).shotDistance;
    expect(carry("Good")).toBe(187);
    expect(carry("Okay")).toBe(143);
    expect(carry("Bad")).toBe(88);
  });

  it("wind cuts carry to 187 unless Wind Reader is owned", () => {
    const args = {
      ...base,
      hole: windyHole,
      club: "Driver" as const,
      quality: "Perfect" as const,
      distanceRemaining: 400
    };
    expect(resolveShot(args).shotDistance).toBe(187);
    expect(resolveShot({ ...args, upgrades: [upgrade("wind-reader")] }).shotDistance).toBe(220);
  });

  it("Clubhead Speed adds 10% per stack: 242, then 264 with two", () => {
    const speed = upgrade("clubhead-speed");
    const args = { ...base, club: "Driver" as const, quality: "Perfect" as const, distanceRemaining: 400 };
    expect(resolveShot({ ...args, upgrades: [speed] }).shotDistance).toBe(242);
    expect(resolveShot({ ...args, upgrades: [speed, speed] }).shotDistance).toBe(264);
  });

  it("a Perfect shot that reaches the pin holes out and carry is capped at the distance left", () => {
    const result = resolveShot({ ...base, club: "Iron", quality: "Perfect", distanceRemaining: 100 });
    expect(result).toMatchObject({ shotDistance: 100, nextDistance: 0 });
  });

  it("overshooting by 12 or less holes out", () => {
    const result = resolveShot({ ...base, club: "Driver", quality: "Good", distanceRemaining: 180 });
    expect(result).toMatchObject({ shotDistance: 180, nextDistance: 0 });
  });

  it("overshooting by more than 12 leaves a capped recovery (20 yards max)", () => {
    const result = resolveShot({ ...base, club: "Driver", quality: "Good", distanceRemaining: 160 });
    expect(result).toMatchObject({ shotDistance: 160, nextDistance: 20 });
  });

  it("inside 18 yards any non-Bad shot holes out, a Bad one leaves 13", () => {
    const okay = resolveShot({ ...base, club: "Wedge", quality: "Okay", distanceRemaining: 15 });
    expect(okay.nextDistance).toBe(0);
    const bad = resolveShot({ ...base, club: "Wedge", quality: "Bad", distanceRemaining: 15 });
    expect(bad.nextDistance).toBe(13);
  });
});

describe("resolveShot: putting", () => {
  const base = {
    hole: flatHole,
    upgrades: [] as Upgrade[],
    usedLuckyBounceThisHole: false,
    club: "Putter" as const
  };

  it("a Perfect putt always drops", () => {
    expect(resolveShot({ ...base, quality: "Perfect", distanceRemaining: 20 })).toMatchObject({
      shotDistance: 20,
      nextDistance: 0,
      points: 75
    });
  });

  it("a Good putt drops from 2 yards but not from 10", () => {
    expect(resolveShot({ ...base, quality: "Good", distanceRemaining: 2 }).nextDistance).toBe(0);
    const miss = resolveShot({ ...base, quality: "Good", distanceRemaining: 10 });
    expect(miss).toMatchObject({ nextDistance: 2, shotDistance: 8 });
  });

  it("Soft Touch drops a Good putt from distance and logs it", () => {
    const result = resolveShot({
      ...base,
      upgrades: [upgrade("soft-touch")],
      quality: "Good",
      distanceRemaining: 10
    });
    expect(result.nextDistance).toBe(0);
    expect(result.log).toEqual(["Good putt dropped thanks to Soft Touch."]);
  });

  it("Okay leaves 5 and Bad leaves 10", () => {
    expect(resolveShot({ ...base, quality: "Okay", distanceRemaining: 10 })).toMatchObject({
      nextDistance: 5,
      shotDistance: 5
    });
    expect(resolveShot({ ...base, quality: "Bad", distanceRemaining: 25 })).toMatchObject({
      nextDistance: 10,
      shotDistance: 15
    });
  });
});

describe("resolveShot: Lucky Bounce", () => {
  const lucky = [upgrade("lucky-bounce")];
  const driver = { hole: flatHole, club: "Driver" as const, quality: "Bad" as const, distanceRemaining: 400 };

  it("upgrades the first Bad non-putter shot to Okay and logs it", () => {
    const result = resolveShot({ ...driver, upgrades: lucky, usedLuckyBounceThisHole: false });
    expect(result.quality).toBe("Okay");
    expect(result.usedLuckyBounce).toBe(true);
    expect(result.shotDistance).toBe(143);
    expect(result.log).toEqual(["Lucky Bounce! Bad Driver became Okay."]);
  });

  it("does nothing a second time on the same hole", () => {
    const result = resolveShot({ ...driver, upgrades: lucky, usedLuckyBounceThisHole: true });
    expect(result.quality).toBe("Bad");
    expect(result.shotDistance).toBe(88);
    expect(result.log).toEqual([]);
  });

  it("does nothing without the upgrade, and never applies to putts", () => {
    expect(resolveShot({ ...driver, upgrades: [], usedLuckyBounceThisHole: false }).quality).toBe("Bad");
    const putt = resolveShot({
      ...driver,
      club: "Putter",
      distanceRemaining: 20,
      upgrades: lucky,
      usedLuckyBounceThisHole: false
    });
    expect(putt.quality).toBe("Bad");
    expect(putt.usedLuckyBounce).toBe(false);
  });
});

describe("resolveShot: purity", () => {
  it("is deterministic and leaves its inputs untouched", () => {
    const upgrades = Object.freeze([upgrade("clubhead-speed")]) as Upgrade[];
    const hole = Object.freeze({ ...windyHole });
    const args = {
      club: "Driver" as const,
      quality: "Good" as const,
      distanceRemaining: 300,
      hole,
      upgrades,
      usedLuckyBounceThisHole: false
    };
    expect(resolveShot(args)).toEqual(resolveShot(args));
    expect(hole).toEqual(windyHole);
    expect(upgrades).toHaveLength(1);
  });
});

describe("createRunHoles", () => {
  it.each([3, 6, 9] as const)("builds a %i-hole round with an even par mix", (length) => {
    for (let run = 0; run < 25; run++) {
      const holes = createRunHoles(length);
      expect(holes).toHaveLength(length);
      expect(holes.map((hole) => hole.number)).toEqual(Array.from({ length }, (_, i) => i + 1));
      for (const par of [3, 4, 5] as const) {
        const ofPar = holes.filter((hole) => hole.par === par);
        expect(ofPar).toHaveLength(length / 3);
        for (const hole of ofPar) {
          expect(hole.yards).toBeGreaterThanOrEqual(HOLE_YARD_RANGES[par].min);
          expect(hole.yards).toBeLessThanOrEqual(HOLE_YARD_RANGES[par].max);
        }
      }
      for (const hole of holes) expect([undefined, "Windy"]).toContain(hole.modifier);
    }
  });

  it("makes every hole Windy when the dice roll low, and none when high", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(createRunHoles(3).every((hole) => hole.modifier === "Windy")).toBe(true);
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(createRunHoles(3).some((hole) => hole.modifier === "Windy")).toBe(false);
  });
});

describe("getAvailableUpgradeChoices", () => {
  it("offers three distinct upgrades from a fresh run", () => {
    for (let run = 0; run < 25; run++) {
      const ids = getAvailableUpgradeChoices([]).map((choice) => choice.id);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("never re-offers an owned one-off upgrade but keeps offering owned stackables", () => {
    const owned = UPGRADES; // one of everything, so only stackables stay eligible
    for (let run = 0; run < 25; run++) {
      const ids = getAvailableUpgradeChoices(owned).map((choice) => choice.id);
      expect(ids.sort()).toEqual(["clubhead-speed", "steady-hands"]);
    }
  });

  it("does not reorder the shared UPGRADES list", () => {
    const before = UPGRADES.map((candidate) => candidate.id);
    getAvailableUpgradeChoices([]);
    expect(UPGRADES.map((candidate) => candidate.id)).toEqual(before);
  });
});
