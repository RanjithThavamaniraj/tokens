"use client";

import { useState } from "react";
import {
  PROMPT_LIBRARY,
  filterPrompts,
  type LibraryPrompt,
  type PromptCategory,
} from "@/lib/prompts/PromptLibrary";

const CATEGORIES: PromptCategory[] = [
  "Development",
  "Architecture",
  "Debugging",
  "Writing",
  "Business",
  "Education",
];

type CategoryFilter = PromptCategory | "All";

interface PromptLibraryPanelProps {
  onSelect: (prompt: LibraryPrompt) => void;
}

export default function PromptLibraryPanel({
  onSelect,
}: PromptLibraryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");

  const filtered = filterPrompts(PROMPT_LIBRARY, query, category);

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        padding: "12px 14px",
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          Prompt Library
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            color: "var(--color-muted)",
          }}
        >
          {isExpanded ? "Hide" : "Show"}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts..."
            aria-label="Search prompts"
            className="w-full rounded-lg"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              padding: "8px 12px",
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
            }}
          />

          <div className="flex flex-wrap gap-2">
            {(["All", ...CATEGORIES] as CategoryFilter[]).map((option) => {
              const isActive = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    color: isActive ? "#06070B" : "var(--color-text)",
                    background: isActive ? "#EE7B30" : "var(--color-glass)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 999,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                color: "var(--color-muted)",
              }}
            >
              No prompts match.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => onSelect(prompt)}
                  className="flex flex-col items-start gap-1 rounded-lg text-left"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    padding: "10px 12px",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {prompt.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.7rem",
                        color: "var(--color-muted)",
                        background: "var(--color-glass)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        flexShrink: 0,
                      }}
                    >
                      {prompt.category}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    {prompt.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
