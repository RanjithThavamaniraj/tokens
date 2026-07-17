"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS } from "./defaults";
import { settingsService } from "./SettingsService";
import type { AppSettings, ThemePreference } from "./types";

type SettingsContextValue = {
  settings: AppSettings;
  hydrated: boolean;
  setSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  rememberSearch: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  resetSettings: () => Promise<void>;
  resetEverything: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveTheme(theme);
}

function useSettingsStore(): AppSettings {
  return useSyncExternalStore(
    (onStoreChange) => settingsService.subscribe(onStoreChange),
    () => settingsService.getSnapshot(),
    () => DEFAULT_SETTINGS,
  );
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettingsStore();
  const [hydrated, setHydrated] = useState(false);
  const themeRef = useRef(settings.theme);

  useEffect(() => {
    let cancelled = false;
    void settingsService.initialize().then(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    themeRef.current = settings.theme;
    applyTheme(settings.theme);

    if (settings.theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(themeRef.current);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme]);

  const setSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      await settingsService.set(key, value);
    },
    [],
  );

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    await settingsService.update(patch);
  }, []);

  const rememberSearch = useCallback(async (query: string) => {
    await settingsService.rememberSearch(query);
  }, []);

  const clearSearchHistory = useCallback(async () => {
    await settingsService.clearSearchHistory();
  }, []);

  const resetSettings = useCallback(async () => {
    await settingsService.resetSettings();
  }, []);

  const resetEverything = useCallback(async () => {
    await settingsService.resetEverything();
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      hydrated,
      setSetting,
      updateSettings,
      rememberSearch,
      clearSearchHistory,
      resetSettings,
      resetEverything,
    }),
    [
      settings,
      hydrated,
      setSetting,
      updateSettings,
      rememberSearch,
      clearSearchHistory,
      resetSettings,
      resetEverything,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

/** Subscribe to a single setting key to limit re-renders. */
export function useSetting<K extends keyof AppSettings>(
  key: K,
): [AppSettings[K], (value: AppSettings[K]) => Promise<void>] {
  const { settings, setSetting } = useSettings();
  const value = settings[key];
  const setter = useCallback(
    (next: AppSettings[K]) => setSetting(key, next),
    [key, setSetting],
  );
  return [value, setter];
}
