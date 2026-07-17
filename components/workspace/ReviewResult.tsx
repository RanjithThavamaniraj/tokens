"use client";

import MarkdownResponse from "@/components/workspace/MarkdownResponse";

interface ReviewResultProps {
  reviewerDisplayName: string;
  focusLabel: string;
  status: "loading" | "done" | "error";
  text?: string;
  error?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCopy: () => void;
  copied: boolean;
}

export default function ReviewResult({
  reviewerDisplayName,
  focusLabel,
  status,
  text,
  error,
  collapsed,
  onToggleCollapse,
  onCopy,
  copied,
}: ReviewResultProps) {
  return (
    <div
      className="rounded-lg"
      style={{
        borderLeft: "2px solid #EE7B30",
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "10px 12px",
        marginTop: 10,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Review by {reviewerDisplayName} · {focusLabel}
        </h3>
        {status === "done" && (
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
              {copied ? "Copied" : "Copy Review"}
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
        )}
      </div>

      {status === "loading" && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-muted)",
            marginTop: 10,
          }}
        >
          Reviewing...
        </p>
      )}

      {status === "error" && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-muted)",
            marginTop: 10,
          }}
        >
          {error}
        </p>
      )}

      {status === "done" && !collapsed && text && (
        <div style={{ marginTop: 10 }}>
          <MarkdownResponse text={text} />
        </div>
      )}
    </div>
  );
}
