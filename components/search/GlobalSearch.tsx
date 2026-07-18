"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const SearchModal = dynamic(() => import("./SearchModal"));

const noopSubscribe = () => () => {};

function useIsMac(): boolean {
  // Hydration-safe platform detection: the server snapshot renders ⌘K, then
  // the client snapshot corrects it on non-Apple platforms.
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/i.test(navigator.platform),
    () => true,
  );
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const isMac = useIsMac();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex items-center gap-2 rounded-full"
        style={{
          background: "var(--color-glass)",
          border: "1px solid var(--color-border)",
          color: "var(--color-muted)",
          padding: "6px 14px",
          fontFamily: "var(--font-body)",
          fontSize: "0.8rem",
          cursor: "pointer",
        }}
      >
        <svg
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <span>Search</span>
        <kbd
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.66rem",
            border: "1px solid var(--color-border)",
            borderRadius: 5,
            padding: "1px 5px",
          }}
        >
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}
