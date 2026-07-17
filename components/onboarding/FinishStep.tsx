"use client";

export default function FinishStep({
  onWorkspace,
  onDocs,
}: {
  onWorkspace: () => void;
  onDocs: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2rem)",
          color: "var(--color-text)",
          margin: 0,
        }}
      >
        You’re Ready
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          color: "var(--color-muted)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Connect keys when you need them, run a prompt across providers, then
        use Consensus, Review, Debate, and Recommendation to decide with
        confidence. Everything stays local unless you choose to export.
      </p>
      <div className="flex flex-wrap gap-3" style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={onWorkspace}
          className="rounded-full font-semibold"
          style={{
            background: "#EE7B30",
            color: "#06070B",
            padding: "10px 20px",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Workspace
        </button>
        <button
          type="button"
          onClick={onDocs}
          className="rounded-full font-semibold"
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
          Open Documentation
        </button>
      </div>
    </div>
  );
}
