"use client";

import { EXAMPLE_PROMPTS } from "@/lib/onboarding/types";

export default function PromptStep({
  prompt,
  onChange,
}: {
  prompt: string;
  onChange: (prompt: string) => void;
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
        Ask Your First Question
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
        Choose an example or write your own. We’ll open the Workspace with this
        prompt ready to run across your connected providers.
      </p>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => onChange(example.prompt)}
            className="rounded-full"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              padding: "6px 12px",
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            {example.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-2">
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          Your prompt
        </span>
        <textarea
          value={prompt}
          onChange={(event) => onChange(event.target.value)}
          rows={6}
          placeholder='Try “Compare React vs Vue”…'
          className="w-full rounded-lg"
          style={{
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            padding: "10px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            resize: "vertical",
          }}
        />
      </label>
    </div>
  );
}
