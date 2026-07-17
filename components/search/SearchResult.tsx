"use client";

import type { SearchResultItem } from "@/lib/search/types";

export default function SearchResult({
  item,
  active,
  onSelect,
  onHover,
}: {
  item: SearchResultItem;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const { document, snippet, matchStart, matchLength } = item;

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseMove={onHover}
      className="w-full rounded-lg text-left"
      style={{
        background: active ? "var(--color-glass)" : "transparent",
        border: active
          ? "1px solid var(--color-border)"
          : "1px solid transparent",
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: active ? "var(--color-accent)" : "var(--color-text)",
          }}
        >
          {document.title}
        </span>
        <span
          className="shrink-0 truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            color: "var(--color-muted)",
            maxWidth: 180,
          }}
        >
          {document.subtitle ? `${document.subtitle} · ` : ""}
          {document.projectName}
        </span>
      </div>
      {snippet && (
        <p
          className="truncate"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            marginTop: 3,
          }}
        >
          {matchStart >= 0 ? (
            <>
              {snippet.slice(0, matchStart)}
              <mark
                style={{
                  background: "rgba(238,123,48,0.28)",
                  color: "var(--color-text)",
                  borderRadius: 3,
                  padding: "0 1px",
                }}
              >
                {snippet.slice(matchStart, matchStart + matchLength)}
              </mark>
              {snippet.slice(matchStart + matchLength)}
            </>
          ) : (
            snippet
          )}
        </p>
      )}
    </button>
  );
}
