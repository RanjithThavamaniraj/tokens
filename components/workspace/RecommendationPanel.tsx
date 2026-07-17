"use client";

import MarkdownResponse from "@/components/workspace/MarkdownResponse";
import type { ProviderId } from "@/lib/providers/Provider";
import { computeResponseStats } from "@/lib/workspace/responseStats";
import type { RecommendationState } from "@/lib/workspace/recommendation";

export interface RecommendationPanelProps {
  providerOptions: { id: ProviderId; displayName: string }[];
  selectedProviderId: ProviderId;
  onSelectProvider: (id: ProviderId) => void;
  canGenerate: boolean;
  disabledReason?: string;
  recommendation: RecommendationState | null;
  onGenerate: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  copied: boolean;
  onCopy: () => void;
}

export default function RecommendationPanel({
  providerOptions,
  selectedProviderId,
  onSelectProvider,
  canGenerate,
  disabledReason,
  recommendation,
  onGenerate,
  collapsed,
  onToggleCollapse,
  copied,
  onCopy,
}: RecommendationPanelProps) {
  const isLoading = recommendation?.status === "loading";
  const stats =
    recommendation?.status === "done" && recommendation.text
      ? computeResponseStats(recommendation.text)
      : null;

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "12px 16px",
        marginTop: 16,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        Final Recommendation
      </p>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          color: "var(--color-muted)",
          marginTop: 4,
        }}
      >
        {isLoading
          ? "Generating Recommendation..."
          : recommendation?.status === "done"
            ? "Recommendation Complete"
            : "Synthesize one recommendation from all available evidence."}
      </p>

      <label className="flex flex-col gap-2" style={{ marginTop: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          Recommendation Provider
        </span>
        <select
          value={selectedProviderId}
          onChange={(e) => onSelectProvider(e.target.value as ProviderId)}
          disabled={isLoading}
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            padding: "6px 10px",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            borderRadius: 8,
            maxWidth: 280,
          }}
        >
          {providerOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.displayName}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate || isLoading}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          color: "var(--color-text)",
          background: "var(--color-glass)",
          border: "1px solid var(--color-border)",
          borderRadius: 999,
          padding: "8px 16px",
          cursor: canGenerate && !isLoading ? "pointer" : "not-allowed",
          opacity: canGenerate && !isLoading ? 1 : 0.6,
          alignSelf: "flex-start",
          marginTop: 12,
        }}
      >
        {isLoading
          ? "Generating..."
          : recommendation?.status === "done"
            ? "Regenerate Final Recommendation"
            : "Generate Final Recommendation"}
      </button>

      {!canGenerate && disabledReason && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            marginTop: 8,
          }}
        >
          {disabledReason}
        </p>
      )}

      {recommendation?.status === "error" && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-muted)",
            marginTop: 12,
          }}
        >
          {recommendation.error}
        </p>
      )}

      {recommendation?.status === "done" && recommendation.text && (
        <div style={{ marginTop: 12 }}>
          <div className="flex items-center justify-between gap-3">
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--color-text)",
                margin: 0,
              }}
            >
              Recommendation
            </p>
            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
              <button
                type="button"
                onClick={onCopy}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: "var(--color-text)",
                  background: "var(--color-glass)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={onToggleCollapse}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: "var(--color-text)",
                  background: "var(--color-glass)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {collapsed ? "Expand" : "Collapse"}
              </button>
            </div>
          </div>

          {stats && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--color-muted)",
                marginTop: 4,
              }}
            >
              {[
                `${stats.wordCount.toLocaleString()} ${stats.wordCount === 1 ? "word" : "words"}`,
                stats.readingTimeLabel,
                `${stats.characterCount.toLocaleString()} ${stats.characterCount === 1 ? "character" : "characters"}`,
                stats.codeBlockCount > 0
                  ? `${stats.codeBlockCount} ${stats.codeBlockCount === 1 ? "code block" : "code blocks"}`
                  : null,
                stats.tableCount > 0
                  ? `${stats.tableCount} ${stats.tableCount === 1 ? "table" : "tables"}`
                  : null,
                stats.listCount > 0
                  ? `${stats.listCount} ${stats.listCount === 1 ? "list" : "lists"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}

          {!collapsed && (
            <div style={{ marginTop: 10 }}>
              <MarkdownResponse text={recommendation.text} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
