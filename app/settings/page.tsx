"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import SettingsSection from "@/components/settings/SettingsSection";
import ToggleSetting from "@/components/settings/ToggleSetting";
import SelectSetting from "@/components/settings/SelectSetting";
import ShortcutTable from "@/components/settings/ShortcutTable";
import { useSettings } from "@/lib/settings/SettingsContext";
import {
  APP_ABOUT,
  APP_BUILD,
  APP_LICENSE,
  APP_NAME,
  APP_VERSION,
  SETTINGS_SECTIONS,
} from "@/lib/settings/defaults";
import type {
  ExportFormatPreference,
  SettingsSectionId,
  ThemePreference,
} from "@/lib/settings/types";
import { createProvider } from "@/lib/providers/ProviderFactory";
import { onboardingService } from "@/lib/onboarding/OnboardingService";

const WORKSPACE_PROVIDERS = [
  "openai",
  "claude",
  "gemini",
  "grok",
  "perplexity",
] as const;

const noopSubscribe = () => () => {};

function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/i.test(navigator.platform),
    () => true,
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    settings,
    setSetting,
    updateSettings,
    clearSearchHistory,
    resetSettings,
    resetEverything,
  } = useSettings();
  const [active, setActive] = useState<SettingsSectionId>(() => {
    if (typeof window === "undefined") return "general";
    const hash = window.location.hash.replace("#", "");
    return SETTINGS_SECTIONS.some((section) => section.id === hash)
      ? (hash as SettingsSectionId)
      : "general";
  });
  const isMac = useIsMac();

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (SETTINGS_SECTIONS.some((section) => section.id === hash)) {
        setActive(hash as SettingsSectionId);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectSection(id: SettingsSectionId) {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  const providerOptions = useMemo(
    () =>
      WORKSPACE_PROVIDERS.map((id) => ({
        value: id,
        label: createProvider(id)?.displayName ?? id,
      })),
    [],
  );

  async function confirmAndRun(
    message: string,
    action: () => Promise<void>,
  ): Promise<void> {
    if (!window.confirm(message)) return;
    await action();
  }

  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        background: "var(--color-bg)",
        minHeight: "100vh",
      }}
    >
      <Navbar />

      <div
        className="mx-auto w-full max-w-[1100px] px-5 sm:px-8"
        style={{ paddingTop: "clamp(32px, 5vw, 56px)", paddingBottom: 96 }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            color: "var(--color-muted)",
            marginTop: 8,
          }}
        >
          Local preferences for Tokens. Changes save automatically on this
          device.
        </p>

        <div
          className="flex flex-col gap-8 lg:flex-row lg:items-start"
          style={{ marginTop: 32 }}
        >
          <SettingsSidebar active={active} onSelect={selectSection} />

          <div className="min-w-0 flex-1">
            {active === "general" && (
              <SettingsSection
                title="General"
                description="Application identity and local data controls."
              >
                <InfoRow label="Application version" value={APP_VERSION} />
                <InfoRow label="About Tokens" value={APP_ABOUT} />
                <DangerActions
                  onRelaunchOnboarding={() =>
                    void confirmAndRun(
                      "Relaunch the first-run onboarding wizard?",
                      async () => {
                        await onboardingService.relaunch();
                        router.push("/onboarding");
                      },
                    )
                  }
                  onResetSettings={() =>
                    void confirmAndRun(
                      "Reset all settings to defaults? Search history will also be cleared.",
                      resetSettings,
                    )
                  }
                  onResetEverything={() =>
                    void confirmAndRun(
                      "Reset everything? This clears settings, projects, and local Tokens data. This cannot be undone.",
                      async () => {
                        await resetEverything();
                        window.location.href = "/workspace";
                      },
                    )
                  }
                />
              </SettingsSection>
            )}

            {active === "appearance" && (
              <SettingsSection
                title="Appearance"
                description="Control how Tokens looks on this device."
              >
                <SelectSetting
                  label="Theme"
                  description="Choose System, Light, or Dark."
                  value={settings.theme}
                  options={[
                    { value: "system", label: "System" },
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                  onChange={(value) =>
                    void setSetting("theme", value as ThemePreference)
                  }
                />
              </SettingsSection>
            )}

            {active === "workspace" && (
              <SettingsSection
                title="Workspace"
                description="Defaults and display preferences for the workspace."
              >
                <SelectSetting
                  label="Default Provider"
                  description="Preferred provider for new workspace sessions."
                  value={settings.defaultProviderId}
                  options={providerOptions}
                  onChange={(value) => void setSetting("defaultProviderId", value)}
                />

                <div
                  className="rounded-lg"
                  style={{
                    background: "var(--color-glass)",
                    border: "1px solid var(--color-border)",
                    padding: "14px 16px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--color-text)",
                      margin: 0,
                    }}
                  >
                    Default Model per Provider
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      color: "var(--color-muted)",
                      marginTop: 4,
                    }}
                  >
                    Fallback model IDs used when a provider has no selection yet.
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    {WORKSPACE_PROVIDERS.map((id) => (
                      <label key={id} className="flex flex-col gap-1">
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.78rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          {createProvider(id)?.displayName ?? id}
                        </span>
                        <input
                          type="text"
                          value={settings.defaultModelIds[id] ?? ""}
                          onChange={(event) =>
                            void updateSettings({
                              defaultModelIds: {
                                ...settings.defaultModelIds,
                                [id]: event.target.value,
                              },
                            })
                          }
                          className="rounded-lg"
                          style={{
                            background: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text)",
                            padding: "8px 12px",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <ToggleSetting
                  label="Auto-scroll while streaming"
                  description="Keep the active response in view as tokens stream in."
                  checked={settings.autoScrollWhileStreaming}
                  onChange={(checked) =>
                    void setSetting("autoScrollWhileStreaming", checked)
                  }
                />
                <ToggleSetting
                  label="Compact Mode"
                  description="Reduce spacing in workspace response cards."
                  checked={settings.compactMode}
                  onChange={(checked) => void setSetting("compactMode", checked)}
                />
                <ToggleSetting
                  label="Show response statistics"
                  description="Display reading time, word count, and related stats."
                  checked={settings.showResponseStatistics}
                  onChange={(checked) =>
                    void setSetting("showResponseStatistics", checked)
                  }
                />
              </SettingsSection>
            )}

            {active === "search" && (
              <SettingsSection
                title="Search"
                description="Preferences for Global Search."
              >
                <ToggleSetting
                  label="Remember recent searches"
                  description="Keep a short list of recent Global Search queries."
                  checked={settings.rememberRecentSearches}
                  onChange={(checked) =>
                    void setSetting("rememberRecentSearches", checked)
                  }
                />
                <SelectSetting
                  label="Maximum recent searches"
                  description="How many recent queries to retain locally."
                  value={String(settings.maxRecentSearches)}
                  options={[4, 8, 12, 20].map((count) => ({
                    value: String(count),
                    label: String(count),
                  }))}
                  onChange={(value) =>
                    void setSetting("maxRecentSearches", Number(value))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    void confirmAndRun(
                      "Clear all recent search history?",
                      clearSearchHistory,
                    )
                  }
                  className="rounded-full font-semibold self-start"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    padding: "8px 16px",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Clear search history
                </button>
                {settings.recentSearches.length > 0 && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    Recent: {settings.recentSearches.join(" · ")}
                  </p>
                )}
              </SettingsSection>
            )}

            {active === "export" && (
              <SettingsSection
                title="Export"
                description="Defaults for the Export Center."
              >
                <SelectSetting
                  label="Default export format"
                  description="Pre-selected format in the Export Center dialog."
                  value={settings.defaultExportFormat}
                  options={[
                    { value: "markdown", label: "Markdown" },
                    { value: "pdf", label: "PDF" },
                    { value: "docx", label: "DOCX" },
                    { value: "json", label: "JSON" },
                  ]}
                  onChange={(value) =>
                    void setSetting(
                      "defaultExportFormat",
                      value as ExportFormatPreference,
                    )
                  }
                />
                <ToggleSetting
                  label="Include timestamps"
                  description="Add export timestamps to Markdown and related formats."
                  checked={settings.includeTimestamps}
                  onChange={(checked) =>
                    void setSetting("includeTimestamps", checked)
                  }
                />
                <ToggleSetting
                  label="Include provider metadata"
                  description="Include provider names and model IDs in exports."
                  checked={settings.includeProviderMetadata}
                  onChange={(checked) =>
                    void setSetting("includeProviderMetadata", checked)
                  }
                />
              </SettingsSection>
            )}

            {active === "keyboard" && (
              <SettingsSection
                title="Keyboard"
                description="Supported shortcuts across Tokens."
              >
                <ShortcutTable isMac={isMac} />
              </SettingsSection>
            )}

            {active === "about" && (
              <SettingsSection
                title="About"
                description="Application identity and local build details."
              >
                <InfoRow label="Application Name" value={APP_NAME} />
                <InfoRow label="Version" value={APP_VERSION} />
                <InfoRow label="Build" value={APP_BUILD} />
                <InfoRow label="License" value={APP_LICENSE} />
                <InfoRow label="About" value={APP_ABOUT} />
              </SettingsSection>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.78rem",
          color: "var(--color-muted)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          color: "var(--color-text)",
          marginTop: 6,
          marginBottom: 0,
          lineHeight: 1.5,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function DangerActions({
  onRelaunchOnboarding,
  onResetSettings,
  onResetEverything,
}: {
  onRelaunchOnboarding: () => void;
  onResetSettings: () => void;
  onResetEverything: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={onRelaunchOnboarding}
        className="rounded-full font-semibold"
        style={{
          background: "transparent",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
          padding: "8px 16px",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        Relaunch Onboarding
      </button>
      <button
        type="button"
        onClick={onResetSettings}
        className="rounded-full font-semibold"
        style={{
          background: "transparent",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
          padding: "8px 16px",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        Reset Settings
      </button>
      <button
        type="button"
        onClick={onResetEverything}
        className="rounded-full font-semibold"
        style={{
          background: "transparent",
          border: "1px solid rgba(238,123,48,0.5)",
          color: "var(--color-accent)",
          padding: "8px 16px",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        Reset Everything
      </button>
    </div>
  );
}
