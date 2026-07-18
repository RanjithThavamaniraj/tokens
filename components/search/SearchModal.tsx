"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestSearchNavigation,
  searchEngine,
} from "@/lib/search/SearchEngine";
import type { SearchResultItem } from "@/lib/search/types";
import { useSettings } from "@/lib/settings/SettingsContext";
import SearchResult from "./SearchResult";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { settings, rememberSearch } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [indexVersion, setIndexVersion] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Refresh is incremental: only projects whose updatedAt changed since the
  // last refresh get re-tokenized, so opening the palette stays cheap.
  useEffect(() => {
    void searchEngine.refresh().then(() => setIndexVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  const groups = useMemo(() => {
    void indexVersion;
    return query.trim() ? searchEngine.search(query) : [];
  }, [query, indexVersion]);

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  const recentSearches =
    settings.rememberRecentSearches && !query.trim()
      ? settings.recentSearches
      : [];

  function handleSelect(item: SearchResultItem) {
    if (query.trim()) void rememberSearch(query);
    requestSearchNavigation({
      projectId: item.document.projectId,
      anchor: item.document.anchor,
    });
    onClose();
    router.push("/workspace");
  }

  function handleRecentSelect(recent: string) {
    setQuery(recent);
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && flatItems[activeIndex]) {
      event.preventDefault();
      handleSelect(flatItems[activeIndex]);
    } else if (event.key === "Tab") {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  let itemOffset = 0;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center px-4"
      style={{
        background: "rgba(6,7,11,0.72)",
        backdropFilter: "blur(4px)",
        paddingTop: "clamp(64px, 14vh, 160px)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        onKeyDown={handleKeyDown}
        className="w-full max-w-[620px] rounded-lg"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={flatItems.length > 0}
            aria-controls="global-search-results"
            placeholder="Search projects, conversations, responses..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            className="w-full"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
            }}
          />
          <kbd
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              color: "var(--color-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              padding: "2px 6px",
              flexShrink: 0,
            }}
          >
            Esc
          </kbd>
        </div>

        <div
          id="global-search-results"
          role="listbox"
          style={{ maxHeight: "min(52vh, 480px)", overflowY: "auto", padding: 8 }}
        >
          {groups.length === 0 ? (
            recentSearches.length > 0 ? (
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-muted)",
                    padding: "6px 12px 4px",
                  }}
                >
                  Recent
                </p>
                {recentSearches.map((recent) => (
                  <button
                    key={recent}
                    type="button"
                    onClick={() => handleRecentSelect(recent)}
                    className="w-full rounded-lg text-left"
                    style={{
                      background: "transparent",
                      border: "1px solid transparent",
                      padding: "8px 12px",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      color: "var(--color-text)",
                      cursor: "pointer",
                    }}
                  >
                    {recent}
                  </button>
                ))}
              </div>
            ) : (
              <p
                role="status"
                aria-live="polite"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  color: "var(--color-muted)",
                  padding: "18px 12px",
                  textAlign: "center",
                }}
              >
                {query.trim()
                  ? "No matches found."
                  : "Type to search projects, prompts, responses, recommendations, and more."}
              </p>
            )
          ) : (
            groups.map((group) => {
              const groupStart = itemOffset;
              itemOffset += group.items.length;
              return (
                <div key={group.type} style={{ marginBottom: 6 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-muted)",
                      padding: "6px 12px 4px",
                    }}
                  >
                    {group.label}
                  </p>
                  {group.items.map((item, index) => {
                    const flatIndex = groupStart + index;
                    return (
                      <SearchResult
                        key={item.document.id}
                        item={item}
                        active={flatIndex === activeIndex}
                        onSelect={() => handleSelect(item)}
                        onHover={() => setActiveIndex(flatIndex)}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
