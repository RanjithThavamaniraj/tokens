import { DEFAULT_SETTINGS } from "./defaults";
import {
  settingsRepository,
  type SettingsRepository,
} from "./SettingsRepository";
import type { AppSettings } from "./types";

const PROVIDER_IDS = new Set([
  "openai",
  "claude",
  "gemini",
  "grok",
  "perplexity",
]);

const THEMES = new Set(["system", "light", "dark"]);
const EXPORT_FORMATS = new Set(["markdown", "pdf", "docx", "json"]);

export function validateSettings(settings: AppSettings): AppSettings {
  const maxRecent = Math.min(
    50,
    Math.max(0, Math.floor(Number(settings.maxRecentSearches) || 0)),
  );

  const defaultProviderId = PROVIDER_IDS.has(settings.defaultProviderId)
    ? settings.defaultProviderId
    : DEFAULT_SETTINGS.defaultProviderId;

  const defaultModelIds: Record<string, string> = {
    ...DEFAULT_SETTINGS.defaultModelIds,
  };
  for (const [key, value] of Object.entries(settings.defaultModelIds ?? {})) {
    if (PROVIDER_IDS.has(key) && typeof value === "string" && value.trim()) {
      defaultModelIds[key] = value.trim();
    }
  }

  const recentSearches = settings.rememberRecentSearches
    ? settings.recentSearches
        .filter((entry) => typeof entry === "string" && entry.trim())
        .map((entry) => entry.trim())
        .slice(0, maxRecent)
    : [];

  return {
    theme: THEMES.has(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
    defaultProviderId,
    defaultModelIds,
    autoScrollWhileStreaming: Boolean(settings.autoScrollWhileStreaming),
    compactMode: Boolean(settings.compactMode),
    showResponseStatistics: Boolean(settings.showResponseStatistics),
    rememberRecentSearches: Boolean(settings.rememberRecentSearches),
    maxRecentSearches: maxRecent,
    recentSearches,
    defaultExportFormat: EXPORT_FORMATS.has(settings.defaultExportFormat)
      ? settings.defaultExportFormat
      : DEFAULT_SETTINGS.defaultExportFormat,
    includeTimestamps: Boolean(settings.includeTimestamps),
    includeProviderMetadata: Boolean(settings.includeProviderMetadata),
  };
}

export class SettingsService {
  private settings: AppSettings = validateSettings(DEFAULT_SETTINGS);
  private listeners = new Set<(settings: AppSettings) => void>();
  private hydrated = false;

  constructor(private readonly repository: SettingsRepository) {}

  async initialize(): Promise<AppSettings> {
    const loaded = validateSettings(await this.repository.load());
    this.settings = loaded;
    this.hydrated = true;
    this.emit();
    return loaded;
  }

  getSnapshot(): AppSettings {
    return this.settings;
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.settings);
  }

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const next = validateSettings({
      ...this.settings,
      ...patch,
      defaultModelIds: {
        ...this.settings.defaultModelIds,
        ...(patch.defaultModelIds ?? {}),
      },
    });
    this.settings = next;
    await this.repository.save(next);
    this.emit();
    return next;
  }

  async set<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ): Promise<AppSettings> {
    return this.update({ [key]: value } as Partial<AppSettings>);
  }

  async rememberSearch(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed || !this.settings.rememberRecentSearches) return;
    const next = [
      trimmed,
      ...this.settings.recentSearches.filter(
        (entry) => entry.toLowerCase() !== trimmed.toLowerCase(),
      ),
    ].slice(0, this.settings.maxRecentSearches);
    await this.set("recentSearches", next);
  }

  async clearSearchHistory(): Promise<AppSettings> {
    return this.set("recentSearches", []);
  }

  async resetSettings(): Promise<AppSettings> {
    const next = validateSettings({
      ...DEFAULT_SETTINGS,
      defaultModelIds: { ...DEFAULT_SETTINGS.defaultModelIds },
      recentSearches: [],
    });
    this.settings = next;
    await this.repository.save(next);
    this.emit();
    return next;
  }

  /**
   * Clears settings plus known Tokens localStorage namespaces
   * (projects, search navigation). Credentials in sessionStorage are also
   * cleared. Does not touch unrelated browser data.
   */
  async resetEverything(): Promise<AppSettings> {
    if (typeof window !== "undefined") {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith("tokens:")) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));

      const sessionKeys: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith("tokens:")) sessionKeys.push(key);
      }
      sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
    }

    return this.resetSettings();
  }
}

export const settingsService = new SettingsService(settingsRepository);
