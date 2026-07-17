"use client";

import { SettingsProvider } from "@/lib/settings/SettingsContext";
import GlobalShortcuts from "@/components/settings/GlobalShortcuts";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <GlobalShortcuts />
      {children}
    </SettingsProvider>
  );
}
