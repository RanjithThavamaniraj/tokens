"use client";

import ReviewResult from "@/components/workspace/ReviewResult";

export type DebateEntryStatus = "loading" | "done" | "error";

export interface DebateRound1EntryView {
  key: string; // unique per entry, e.g. `${reviewerId}->${revieweeId}`
  reviewerDisplayName: string;
  revieweeDisplayName: string;
  status: DebateEntryStatus;
  text?: string;
  error?: string;
}

export interface DebateRound2EntryView {
  key: string; // unique per entry, e.g. providerId
  providerDisplayName: string;
  status: DebateEntryStatus;
  text?: string;
  error?: string;
}

export interface DebatePanelProps {
  overallStatus: "round1" | "round2" | "complete";
  round1: DebateRound1EntryView[];
  round2: DebateRound2EntryView[];
  collapsedKeys: Set<string>;
  onToggleCollapse: (key: string) => void;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
}

function sectionHeading(text: string) {
  return (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "var(--color-text)",
        marginTop: 10,
      }}
    >
      {text}
    </p>
  );
}

export default function DebatePanel({
  overallStatus,
  round1,
  round2,
  collapsedKeys,
  onToggleCollapse,
  copiedKey,
  onCopy,
}: DebatePanelProps) {
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
        AI Debate
      </p>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          color: "var(--color-muted)",
          marginTop: 4,
        }}
      >
        {overallStatus === "round1"
          ? "Running Round 1..."
          : overallStatus === "round2"
            ? "Running Round 2..."
            : "Debate Complete"}
      </p>

      {sectionHeading("Round 1")}
      {round1.map((entry) => (
        <div key={entry.key} style={{ marginTop: 8 }}>
          <ReviewResult
            reviewerDisplayName={entry.reviewerDisplayName}
            focusLabel={`reviewing ${entry.revieweeDisplayName}`}
            status={entry.status}
            text={entry.text}
            error={entry.error}
            collapsed={collapsedKeys.has(entry.key)}
            onToggleCollapse={() => onToggleCollapse(entry.key)}
            onCopy={() => onCopy(entry.key, entry.text ?? "")}
            copied={copiedKey === entry.key}
          />
        </div>
      ))}

      {round2.length > 0 && (
        <>
          {sectionHeading("Round 2")}
          {round2.map((entry) => (
            <div key={entry.key} style={{ marginTop: 8 }}>
              <ReviewResult
                reviewerDisplayName={entry.providerDisplayName}
                focusLabel="Round 2 response"
                status={entry.status}
                text={entry.text}
                error={entry.error}
                collapsed={collapsedKeys.has(entry.key)}
                onToggleCollapse={() => onToggleCollapse(entry.key)}
                onCopy={() => onCopy(entry.key, entry.text ?? "")}
                copied={copiedKey === entry.key}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
