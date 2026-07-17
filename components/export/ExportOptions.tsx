"use client";

import {
  EXPORT_FORMAT_OPTIONS,
  EXPORT_SCOPE_OPTIONS,
  type ExportFormat,
  type ExportScope,
} from "@/lib/export/types";

export default function ExportOptions({
  scope,
  format,
  onScopeChange,
  onFormatChange,
}: {
  scope: ExportScope;
  format: ExportFormat;
  onScopeChange: (scope: ExportScope) => void;
  onFormatChange: (format: ExportFormat) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2" style={{ border: "none", padding: 0, margin: 0 }}>
        <legend
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: 4,
          }}
        >
          Export
        </legend>
        {EXPORT_SCOPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--color-text)",
            }}
          >
            <input
              type="radio"
              name="export-scope"
              value={option.value}
              checked={scope === option.value}
              onChange={() => onScopeChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2" style={{ border: "none", padding: 0, margin: 0 }}>
        <legend
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: 4,
          }}
        >
          Format
        </legend>
        {EXPORT_FORMAT_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--color-text)",
            }}
          >
            <input
              type="radio"
              name="export-format"
              value={option.value}
              checked={format === option.value}
              onChange={() => onFormatChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
