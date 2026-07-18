"use client";

import { MotionConfig } from "framer-motion";
import { SettingsProvider } from "@/lib/settings/SettingsContext";
import GlobalShortcuts from "@/components/settings/GlobalShortcuts";
import FirstRunGate from "@/components/onboarding/FirstRunGate";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user" makes every framer-motion animation in the app
    // respect the OS-level prefers-reduced-motion setting automatically:
    // transform/layout animations (the floating/falling coins, hover
    // scale, etc.) resolve instantly instead of animating, with no
    // per-component changes needed.
    <MotionConfig reducedMotion="user">
      <SettingsProvider>
        <GlobalShortcuts />
        <FirstRunGate />
        {children}
      </SettingsProvider>
    </MotionConfig>
  );
}
