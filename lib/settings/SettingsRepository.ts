// Persistence boundary for Settings. Swap this class for a cloud-backed
// repository later without changing SettingsService, Context, or UI.

import type { AppSettings, StoredSettings } from "./types";
import { SETTINGS_STORAGE_KEY, SETTINGS_VERSION } from "./types";
import { DEFAULT_SETTINGS } from "./defaults";

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
  clear(): Promise<void>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    defaultModelIds: {
      ...DEFAULT_SETTINGS.defaultModelIds,
      ...(partial.defaultModelIds ?? {}),
    },
    recentSearches: Array.isArray(partial.recentSearches)
      ? partial.recentSearches.filter((entry) => typeof entry === "string")
      : DEFAULT_SETTINGS.recentSearches,
  };
}

function isValidSettings(value: unknown): value is AppSettings {
  if (!isObject(value)) return false;
  const theme = value.theme;
  const format = value.defaultExportFormat;
  return (
    (theme === "system" || theme === "light" || theme === "dark") &&
    typeof value.defaultProviderId === "string" &&
    isObject(value.defaultModelIds) &&
    typeof value.autoScrollWhileStreaming === "boolean" &&
    typeof value.compactMode === "boolean" &&
    typeof value.showResponseStatistics === "boolean" &&
    typeof value.rememberRecentSearches === "boolean" &&
    typeof value.maxRecentSearches === "number" &&
    Array.isArray(value.recentSearches) &&
    (format === "markdown" ||
      format === "pdf" ||
      format === "docx" ||
      format === "json") &&
    typeof value.includeTimestamps === "boolean" &&
    typeof value.includeProviderMetadata === "boolean"
  );
}

class LocalStorageSettingsRepository implements SettingsRepository {
  async load(): Promise<AppSettings> {
    if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS, defaultModelIds: { ...DEFAULT_SETTINGS.defaultModelIds } };

      const parsed: unknown = JSON.parse(raw);
      if (!isObject(parsed) || parsed.version !== SETTINGS_VERSION) {
        return { ...DEFAULT_SETTINGS, defaultModelIds: { ...DEFAULT_SETTINGS.defaultModelIds } };
      }

      const stored = parsed as Partial<StoredSettings>;
      if (!isValidSettings(stored.settings)) {
        return mergeWithDefaults(
          isObject(stored.settings) ? (stored.settings as Partial<AppSettings>) : {},
        );
      }
      return mergeWithDefaults(stored.settings);
    } catch {
      return { ...DEFAULT_SETTINGS, defaultModelIds: { ...DEFAULT_SETTINGS.defaultModelIds } };
    }
  }

  async save(settings: AppSettings): Promise<void> {
    if (typeof window === "undefined") return;
    const payload: StoredSettings = {
      version: SETTINGS_VERSION,
      settings,
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }
}

export const settingsRepository: SettingsRepository =
  new LocalStorageSettingsRepository();
