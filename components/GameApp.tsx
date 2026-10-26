"use client";

import { useEffect } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { CreateLife } from "@/components/screens/CreateLife";
import { TitleScreen } from "@/components/screens/TitleScreen";
import { useGame } from "@/store/gameStore";

function useTheme() {
  const theme = useGame((s) => s.settings.theme);
  const reduceMotion = useGame((s) => s.settings.reduceMotion);
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => root.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches));
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3" aria-busy="true">
      <span className="animate-pulse text-5xl font-black text-accent">%</span>
      <span className="text-sm font-semibold text-muted">Loading life 1 mod N…</span>
    </div>
  );
}

export function GameApp() {
  const { hydrated, hydrate, screen, game } = useGame();
  useEffect(() => hydrate(), [hydrate]);
  useTheme();
  if (!hydrated) return <Splash />;
  if (screen === "create") return <CreateLife />;
  if (screen === "game" && game) return <GameScreen state={game} />;
  return <TitleScreen />;
}
