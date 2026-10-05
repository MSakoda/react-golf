import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS, UPGRADES } from "@/lib/game/constants";
import type { Hole } from "@/lib/game/types";
import { useGameStore } from "./gameStore";

const initial = useGameStore.getInitialState();
const store = () => useGameStore.getState();

const par3: Hole = { number: 1, par: 3, yards: 100 };
const par4: Hole = { number: 2, par: 4, yards: 300 };

/** Put the store mid-run on hole 1 without relying on random hole generation. */
function playing(holes: Hole[] = [par3, par4], extra: Partial<typeof initial> = {}) {
  useGameStore.setState({
    currentScreen: "playing",
    holes,
    currentHoleIndex: 0,
    distanceRemaining: holes[0].yards,
    ...extra
  });
}

/** One swing, from the click to dismissing the shot result. */
function swing(marker: number) {
  store().takeShot(marker);
  store().completeShotAnimation();
  store().acknowledgeConfirmation();
}

beforeEach(() => {
  localStorage.clear();
  useGameStore.setState(initial, true);
});

describe("startRun", () => {
  it("starts a run of the chosen length on the first hole", () => {
    store().setRoundLength(6);
    store().startRun();
    expect(store().currentScreen).toBe("playing");
    expect(store().holes).toHaveLength(6);
    expect(store().distanceRemaining).toBe(store().holes[0].yards);
    expect(store().totalStrokes).toBe(0);
    expect(store().shotLog.map((entry) => entry.text)).toEqual(["Practice round started. Hole 1 awaits."]);
  });

  it("falls back to Player for a blank name and trims a padded one", () => {
    store().setPlayerName("   ");
    store().startRun();
    expect(store().playerName).toBe("Player");
    store().setPlayerName("  Ada  ");
    store().startRun();
    expect(store().playerName).toBe("Ada");
  });
});

describe("setPlayerName", () => {
  it("caps the name at 24 characters and saves it", () => {
    store().setPlayerName("x".repeat(40));
    expect(store().playerName).toHaveLength(24);
    expect(localStorage.getItem(STORAGE_KEYS.playerName)).toBe("x".repeat(24));
  });
});

describe("takeShot", () => {
  it("queues the result without committing strokes until it is acknowledged", () => {
    playing([par4], { distanceRemaining: 400 });
    store().takeShot(0.5);
    expect(store().isShotAnimating).toBe(true);
    expect(store().pendingShotResult).toMatchObject({ club: "Driver", quality: "Perfect", nextDistance: 180 });
    expect(store().shotAnimation).toMatchObject({ fromDistance: 400, toDistance: 180 });
    expect(store().strokesThisHole).toBe(0);
    expect(store().totalStrokes).toBe(0);
  });

  it("ignores swings while the ball is in flight, a dialog is open, or not playing", () => {
    playing([par4], { distanceRemaining: 400 });
    store().takeShot(0.5);
    const firstResult = store().pendingShotResult;
    store().takeShot(0.99);
    expect(store().pendingShotResult).toBe(firstResult);

    store().completeShotAnimation();
    store().takeShot(0.99);
    expect(store().pendingShotResult).toBe(firstResult);

    useGameStore.setState(initial, true);
    store().takeShot(0.5);
    expect(store().pendingShotResult).toBeNull();
  });

  it("logs newest first and keeps at most eight entries", () => {
    playing([par4], { distanceRemaining: 400 });
    for (let i = 0; i < 12; i++) {
      useGameStore.setState({ distanceRemaining: 400, isShotAnimating: false, confirmation: null });
      store().takeShot(0.5);
      useGameStore.setState({ shotLog: store().pendingShotResult!.shotLog });
    }
    expect(store().shotLog).toHaveLength(8);
    expect(store().shotLog[0].text).toBe("Perfect Driver: 220 yards");
  });
});

describe("a shot that does not hole out", () => {
  it("commits strokes, points and distance once acknowledged, and stays on the hole", () => {
    playing([par4], { distanceRemaining: 400 });
    swing(0.5);
    expect(store().currentScreen).toBe("playing");
    expect(store().confirmation).toBeNull();
    expect(store().distanceRemaining).toBe(180);
    expect(store().strokesThisHole).toBe(1);
    expect(store().totalStrokes).toBe(1);
    expect(store().totalPoints).toBe(75);
  });

  it("offers 'Next shot' on the result dialog", () => {
    playing([par4], { distanceRemaining: 400 });
    store().takeShot(0.5);
    store().completeShotAnimation();
    expect(store().isShotAnimating).toBe(false);
    expect(store().confirmation).toMatchObject({ type: "shot", title: "Perfect Driver", actionLabel: "Next shot" });
  });
});

describe("finishing a hole", () => {
  it("shows the hole result, then the upgrade screen with bonus points", () => {
    playing();
    store().takeShot(0.5); // Perfect Iron from 100 yards holes out
    store().completeShotAnimation();
    expect(store().confirmation?.actionLabel).toBe("See hole result");

    store().acknowledgeConfirmation();
    expect(store().confirmation).toMatchObject({
      type: "hole",
      title: "Hole 1: Hole in one",
      message: "Finished in 1 stroke for 800 bonus points.",
      actionLabel: "Choose upgrade"
    });
    expect(store().currentScreen).toBe("playing");

    store().acknowledgeConfirmation();
    expect(store().currentScreen).toBe("upgrade");
    expect(store().totalPoints).toBe(75 + 800);
    expect(store().holeScores).toEqual([{ holeNumber: 1, par: 3, strokes: 1 }]);
    expect(store().upgradeChoices).toHaveLength(3);
  });

  it("labels the last hole's button 'Finish run'", () => {
    playing([par3]);
    store().takeShot(0.5);
    store().completeShotAnimation();
    store().acknowledgeConfirmation();
    expect(store().confirmation?.actionLabel).toBe("Finish run");
  });
});

describe("chooseUpgrade", () => {
  it("adds the upgrade, resets the hole counters and moves to the next hole", () => {
    playing();
    swing(0.5);
    swing(0.5);
    const lucky = UPGRADES.find((upgrade) => upgrade.id === "lucky-bounce")!;
    store().chooseUpgrade(lucky);
    expect(store().currentScreen).toBe("playing");
    expect(store().currentHoleIndex).toBe(1);
    expect(store().distanceRemaining).toBe(300);
    expect(store().strokesThisHole).toBe(0);
    expect(store().activeUpgrades).toEqual([lucky]);
    expect(store().usedLuckyBounceThisHole).toBe(false);
    expect(store().shotLog[0].text).toBe("Lucky Bounce added. Hole 2 is up.");
  });

  it("does nothing when there is no next hole", () => {
    playing([par3]);
    store().chooseUpgrade(UPGRADES[0]);
    expect(store().activeUpgrades).toEqual([]);
    expect(store().currentHoleIndex).toBe(0);
  });
});

describe("completing a run", () => {
  function finishFinalHole() {
    store().takeShot(0.5);
    store().completeShotAnimation();
    store().acknowledgeConfirmation();
    store().acknowledgeConfirmation();
  }

  it("records the best score, points, run count and leaderboard entry, and saves them", () => {
    playing([par3], { playerName: "Ada", roundLength: 3 });
    finishFinalHole();
    expect(store().currentScreen).toBe("complete");
    expect(store().totalStrokes).toBe(1);
    expect(store().totalPoints).toBe(875);
    expect(store().bestScores[3]).toBe(1);
    expect(store().bestPoints[3]).toBe(875);
    expect(store().runsCompleted).toBe(1);
    expect(store().leaderboard).toHaveLength(1);
    expect(store().leaderboard[0]).toMatchObject({ playerName: "Ada", strokes: 1, points: 875, roundLength: 3 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.bestScore)!)).toMatchObject({ 3: 1 });
    expect(localStorage.getItem(STORAGE_KEYS.runsCompleted)).toBe("1");
  });

  it("never replaces a better saved score or lower points with a worse run", () => {
    playing([par3], {
      roundLength: 3,
      bestScores: { 3: 0.5, 6: null, 9: null },
      bestPoints: { 3: 5000, 6: 0, 9: 0 }
    });
    finishFinalHole();
    expect(store().bestScores[3]).toBe(0.5);
    expect(store().bestPoints[3]).toBe(5000);
  });

  it("keeps other round lengths' records untouched", () => {
    playing([par3], { roundLength: 3, bestScores: { 3: null, 6: 20, 9: null } });
    finishFinalHole();
    expect(store().bestScores[6]).toBe(20);
  });
});

describe("returnHome", () => {
  it("clears the run but keeps records and settings", () => {
    playing([par3], { playerName: "Ada", roundLength: 6, bestScores: { 3: 4, 6: null, 9: null }, runsCompleted: 2 });
    swing(0.5);
    store().returnHome();
    expect(store().currentScreen).toBe("home");
    expect(store().holes).toEqual([]);
    expect(store().totalStrokes).toBe(0);
    expect(store().activeUpgrades).toEqual([]);
    expect(store().playerName).toBe("Ada");
    expect(store().roundLength).toBe(6);
    expect(store().bestScores[3]).toBe(4);
    expect(store().runsCompleted).toBe(2);
  });
});

describe("hydrateRecords", () => {
  it("loads saved records and sorts the leaderboard", () => {
    localStorage.setItem(STORAGE_KEYS.playerName, "Grace");
    localStorage.setItem(STORAGE_KEYS.runsCompleted, "7");
    localStorage.setItem(
      STORAGE_KEYS.leaderboard,
      JSON.stringify([
        { id: "slow", playerName: "S", strokes: 9, points: 1, roundLength: 3, date: "d" },
        { id: "fast", playerName: "F", strokes: 4, points: 1, roundLength: 3, date: "d" }
      ])
    );
    store().hydrateRecords();
    expect(store().playerName).toBe("Grace");
    expect(store().runsCompleted).toBe(7);
    expect(store().leaderboard.map((entry) => entry.id)).toEqual(["fast", "slow"]);
  });
});
