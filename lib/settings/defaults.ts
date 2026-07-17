import type {
  AppSettings,
  KeyboardShortcut,
  SettingDefinition,
  SettingsSectionId,
} from "./types";

export const APP_NAME = "Tokens";
export const APP_VERSION = "0.1.0";
export const APP_BUILD = "local";
export const APP_LICENSE = "Proprietary";
export const APP_ABOUT =
  "Tokens is a local-first AI command center for comparing providers, reviewing answers, debating trade-offs, and exporting decisions.";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  defaultProviderId: "openai",
  defaultModelIds: {
    openai: "gpt-4o-mini",
    claude: "claude-haiku-4-5",
    gemini: "gemini-2.0-flash",
    grok: "grok-4.5",
    perplexity: "perplexity/sonar",
  },
  autoScrollWhileStreaming: true,
  compactMode: false,
  showResponseStatistics: true,
  rememberRecentSearches: true,
  maxRecentSearches: 8,
  recentSearches: [],
  defaultExportFormat: "markdown",
  includeTimestamps: true,
  includeProviderMetadata: true,
};

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: "theme",
    section: "appearance",
    label: "Theme",
    description: "Choose System, Light, or Dark appearance.",
    type: "enum",
  },
  {
    key: "defaultProviderId",
    section: "workspace",
    label: "Default Provider",
    description: "Preferred provider for new workspace sessions.",
    type: "string",
  },
  {
    key: "defaultModelIds",
    section: "workspace",
    label: "Default Model per Provider",
    description: "Fallback model IDs used when a provider has no selection yet.",
    type: "record",
  },
  {
    key: "autoScrollWhileStreaming",
    section: "workspace",
    label: "Auto-scroll while streaming",
    description: "Keep the active response in view as tokens stream in.",
    type: "boolean",
  },
  {
    key: "compactMode",
    section: "workspace",
    label: "Compact Mode",
    description: "Reduce spacing in workspace response cards.",
    type: "boolean",
  },
  {
    key: "showResponseStatistics",
    section: "workspace",
    label: "Show response statistics",
    description: "Display reading time, word count, and related stats.",
    type: "boolean",
  },
  {
    key: "rememberRecentSearches",
    section: "search",
    label: "Remember recent searches",
    description: "Keep a short list of recent Global Search queries.",
    type: "boolean",
  },
  {
    key: "maxRecentSearches",
    section: "search",
    label: "Maximum recent searches",
    description: "How many recent queries to retain locally.",
    type: "number",
  },
  {
    key: "defaultExportFormat",
    section: "export",
    label: "Default export format",
    description: "Pre-selected format in the Export Center dialog.",
    type: "enum",
  },
  {
    key: "includeTimestamps",
    section: "export",
    label: "Include timestamps",
    description: "Add export timestamps to Markdown and related formats.",
    type: "boolean",
  },
  {
    key: "includeProviderMetadata",
    section: "export",
    label: "Include provider metadata",
    description: "Include provider names and model IDs in exports.",
    type: "boolean",
  },
];

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  label: string;
}[] = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "workspace", label: "Workspace" },
  { id: "search", label: "Search" },
  { id: "export", label: "Export" },
  { id: "keyboard", label: "Keyboard" },
  { id: "about", label: "About" },
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { id: "search", keys: "Ctrl + K", macKeys: "⌘K", action: "Search" },
  { id: "new-conversation", keys: "N", action: "New Conversation" },
  { id: "new-project", keys: "Shift + N", action: "New Project" },
  { id: "export", keys: "E", action: "Export" },
  { id: "shortcuts", keys: "?", action: "Show shortcuts" },
];
