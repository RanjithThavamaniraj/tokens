"use client";

export default function WelcomeStep() {
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
        Welcome to Tokens
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
        Tokens is your local AI command center. Compare answers across
        providers, analyze trade-offs, and reach better decisions — without
        sending your work to a Tokens backend.
      </p>
      <ul
        className="flex flex-col gap-2"
        style={{
          margin: 0,
          paddingLeft: 18,
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          color: "var(--color-text)",
          lineHeight: 1.5,
        }}
      >
        <li>Compare multiple AI providers side by side</li>
        <li>Analyze responses with Consensus, Review, and Debate</li>
        <li>Reach clearer decisions with Final Recommendation</li>
      </ul>
    </div>
  );
}
