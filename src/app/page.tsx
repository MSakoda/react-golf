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
      <div className="flex flex-1 flex-col">
        {currentScreen === "home" && <HomeScreen />}
        {currentScreen === "playing" && <HoleScreen />}
        {currentScreen === "upgrade" && <UpgradeScreen />}
        {currentScreen === "complete" && <RunCompleteScreen />}
      </div>
      <footer className="py-3 text-center text-xs font-semibold text-emerald-950/55">
        Copyright Marcus Sakoda 2026
      </footer>
    </main>
  );
}
