"use client";

const FEATURES = [
  {
    title: "Consensus",
    body: "See where providers agree, where they diverge, and how confident the overlap is.",
  },
  {
    title: "AI Review",
    body: "Ask one provider to critique another’s answer on focus areas like correctness or architecture.",
  },
  {
    title: "AI Debate",
    body: "Run structured critiques and rebuttals so trade-offs surface before you decide.",
  },
  {
    title: "Final Recommendation",
    body: "Synthesize responses, consensus, reviews, and debate into one actionable recommendation.",
  },
] as const;

export default function DecisionStep() {
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
        Discover Decision Intelligence
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
        After providers answer, Tokens helps you decide — not just collect
        text.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
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
              {feature.title}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                color: "var(--color-muted)",
                marginTop: 6,
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
