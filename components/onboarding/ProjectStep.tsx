"use client";

import { PROJECT_NAME_SUGGESTIONS } from "@/lib/onboarding/types";

export default function ProjectStep({
  name,
  onChange,
  createdName,
}: {
  name: string;
  onChange: (name: string) => void;
  createdName: string | null;
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
        Create Your First Project
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
        Projects keep conversations, reviews, debates, and recommendations
        organized locally. Pick a name or use a suggestion.
      </p>

      <label className="flex flex-col gap-2">
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          Project name
        </span>
        <input
          type="text"
          value={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder="My Project"
          className="w-full rounded-lg"
          style={{
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            padding: "10px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
          }}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {PROJECT_NAME_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className="rounded-full"
            style={{
              background:
                name === suggestion ? "var(--color-accent)" : "transparent",
              color:
                name === suggestion ? "#06070B" : "var(--color-text)",
              border: "1px solid var(--color-border)",
              padding: "6px 12px",
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {createdName && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--color-accent)",
            margin: 0,
          }}
        >
          Project “{createdName}” is ready.
        </p>
      )}
    </div>
  );
}
