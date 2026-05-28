"use client";

import HomeScreen from "@/components/HomeScreen";
import HoleScreen from "@/components/HoleScreen";
import RunCompleteScreen from "@/components/RunCompleteScreen";
import UpgradeScreen from "@/components/UpgradeScreen";
import { useGameStore } from "@/stores/gameStore";

export default function Page() {
  const currentScreen = useGameStore((state) => state.currentScreen);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      {currentScreen === "home" && <HomeScreen />}
      {currentScreen === "playing" && <HoleScreen />}
      {currentScreen === "upgrade" && <UpgradeScreen />}
      {currentScreen === "complete" && <RunCompleteScreen />}
    </main>
  );
}
