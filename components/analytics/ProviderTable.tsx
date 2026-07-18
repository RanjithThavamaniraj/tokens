"use client";

import type { CSSProperties } from "react";
import type { ProviderAnalytics } from "@/lib/analytics/types";

function formatTokens(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString();
}

function formatCost(value: number | null): string {
  if (value === null) return "—";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export default function ProviderTable({
  providers,
}: {
  providers: ProviderAnalytics[];
}) {
  if (providers.length === 0) {
    return (
      <Empty text="No provider activity yet. Run prompts in the workspace to populate this table." />
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead>
          <tr>
            {[
              "Provider",
              "Requests",
              "Responses",
              "Models",
              "Est. tokens",
              "Est. cost",
            ].map((header) => (
              <th key={header} scope="col" style={thStyle}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.providerId}>
              <td style={tdStyle}>{provider.providerName}</td>
              <td style={tdStyle}>{provider.requests.toLocaleString()}</td>
              <td style={tdStyle}>{provider.responses.toLocaleString()}</td>
              <td style={tdStyle}>
                {provider.modelsUsed.length > 0
                  ? provider.modelsUsed.join(", ")
                  : "—"}
              </td>
              <td style={tdStyle}>{formatTokens(provider.estimatedTokens)}</td>
              <td style={tdStyle}>{formatCost(provider.estimatedCostUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.85rem",
        color: "var(--color-muted)",
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "0.72rem",
  color: "var(--color-muted)",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
  color: "var(--color-text)",
  borderBottom: "1px solid var(--color-border)",
};
