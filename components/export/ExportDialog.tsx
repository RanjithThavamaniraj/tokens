"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  canExportScope,
  runExport,
} from "@/lib/export/ExportService";
import type { ExportFormat, ExportScope, ExportSource } from "@/lib/export/types";
import { useSettings } from "@/lib/settings/SettingsContext";
import { analyticsService } from "@/lib/analytics/AnalyticsService";
import ExportOptions from "./ExportOptions";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function ExportDialog({
  source,
  onClose,
}: {
  source: ExportSource;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [scope, setScope] = useState<ExportScope>("conversation");
  const [format, setFormat] = useState<ExportFormat>(
    settings.defaultExportFormat,
  );
  const [status, setStatus] = useState<"idle" | "exporting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validation = useMemo(
    () => canExportScope(source, scope),
    [source, scope],
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = dialogRef.current;
    if (container) {
      const focusable = getFocusableElements(container);
      focusable[0]?.focus();
    }
    return () => previouslyFocused?.focus();
  }, []);

  async function handleExport() {
    if (!validation.ok) {
      setStatus("error");
      setErrorMessage(validation.reason ?? "Nothing to export.");
      return;
    }

    setStatus("exporting");
    setErrorMessage(null);
    try {
      await runExport(source, scope, format, {
        includeTimestamps: settings.includeTimestamps,
        includeProviderMetadata: settings.includeProviderMetadata,
      });
      void analyticsService.recordExport(format, scope);
      onClose();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to export.",
      );
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center px-4"
      style={{
        background: "rgba(6,7,11,0.72)",
        backdropFilter: "blur(4px)",
        paddingTop: "clamp(64px, 14vh, 140px)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Export Center"
        onKeyDown={handleKeyDown}
        className="w-full max-w-[440px] rounded-lg"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          padding: "20px 22px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Export Center
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "var(--color-muted)",
            marginTop: 6,
          }}
        >
          Export conversations, reviews, debates, recommendations, or the entire
          project.
        </p>

        <div style={{ marginTop: 20 }}>
          <ExportOptions
            scope={scope}
            format={format}
            onScopeChange={(next) => {
              setScope(next);
              setErrorMessage(null);
              setStatus("idle");
            }}
            onFormatChange={setFormat}
          />
        </div>

        {!validation.ok && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-muted)",
              marginTop: 16,
            }}
          >
            {validation.reason}
          </p>
        )}

        {status === "error" && errorMessage && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-accent)",
              marginTop: 12,
            }}
          >
            {errorMessage}
          </p>
        )}

        <div className="flex items-center gap-3" style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => {
              void handleExport();
            }}
            disabled={!validation.ok || status === "exporting"}
            className="flex-1 rounded-full font-semibold"
            style={{
              background: "#EE7B30",
              color: "#06070B",
              padding: "10px 20px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              opacity: !validation.ok || status === "exporting" ? 0.7 : 1,
              cursor:
                !validation.ok || status === "exporting"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {status === "exporting" ? "Exporting..." : "Export"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full font-semibold"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              padding: "10px 20px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
