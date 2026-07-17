export type ThemePreference = "system" | "light" | "dark";

export type ExportFormatPreference = "markdown" | "pdf" | "docx" | "json";

export type SettingsSectionId =
  | "general"
  | "appearance"
  | "workspace"
  | "search"
  | "export"
  | "keyboard"
  | "about";

export interface AppSettings {
  // Appearance
  theme: ThemePreference;

  // Workspace
  defaultProviderId: string;
  defaultModelIds: Record<string, string>;
  autoScrollWhileStreaming: boolean;
  compactMode: boolean;
  showResponseStatistics: boolean;

  // Search
  rememberRecentSearches: boolean;
  maxRecentSearches: number;
  recentSearches: string[];

  // Export
  defaultExportFormat: ExportFormatPreference;
  includeTimestamps: boolean;
  includeProviderMetadata: boolean;
}

export interface SettingDefinition<K extends keyof AppSettings = keyof AppSettings> {
  key: K;
  section: SettingsSectionId;
  label: string;
  description: string;
  type: "boolean" | "string" | "number" | "enum" | "record" | "string[]";
}

export interface KeyboardShortcut {
  id: string;
  keys: string;
  action: string;
  macKeys?: string;
}

export const SETTINGS_STORAGE_KEY = "tokens:settings:v1";
export const SETTINGS_VERSION = 1;

export interface StoredSettings {
  version: number;
  settings: AppSettings;
}
