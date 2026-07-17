"use client";

import { SettingsProvider } from "@/lib/settings/SettingsContext";
import GlobalShortcuts from "@/components/settings/GlobalShortcuts";
import FirstRunGate from "@/components/onboarding/FirstRunGate";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <GlobalShortcuts />
      <FirstRunGate />
      {children}
    </SettingsProvider>
  );
}
