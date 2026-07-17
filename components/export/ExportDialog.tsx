"use client";

import { useMemo, useState } from "react";
import {
  canExportScope,
  runExport,
} from "@/lib/export/ExportService";
import type { ExportFormat, ExportScope, ExportSource } from "@/lib/export/types";
import ExportOptions from "./ExportOptions";

export default function ExportDialog({
  source,
  onClose,
}: {
  source: ExportSource;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<ExportScope>("conversation");
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [status, setStatus] = useState<"idle" | "exporting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validation = useMemo(
    () => canExportScope(source, scope),
    [source, scope],
  );

  async function handleExport() {
    if (!validation.ok) {
      setStatus("error");
      setErrorMessage(validation.reason ?? "Nothing to export.");
      return;
    }

    setStatus("exporting");
    setErrorMessage(null);
    try {
      await runExport(source, scope, format);
      onClose();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to export.",
      );
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
        role="dialog"
        aria-modal="true"
        aria-label="Export Center"
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
