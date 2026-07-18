"use client";

import { useRef } from "react";

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusTab(tab: string) {
    buttonRefs.current[tab]?.focus();
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    onChange(nextTab);
    focusTab(nextTab);
  }

  return (
    <div
      role="tablist"
      className="flex items-center gap-1.5 overflow-x-auto"
      style={{
        scrollbarWidth: "none",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            ref={(el) => {
              buttonRefs.current[tab] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab}`}
            aria-selected={isActive}
            aria-controls="provider-tabpanel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            // shrink-0 guarantees a tab can never be squeezed below its
            // label's width — overflowing tabs scroll instead of clipping.
            className="shrink-0 whitespace-nowrap transition-colors duration-300 ease-out"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: isActive ? "var(--color-text)" : "var(--color-muted)",
              background: isActive ? "var(--color-glass)" : "transparent",
              border: isActive
                ? "1px solid var(--color-border)"
                : "1px solid transparent",
              borderRadius: 9999,
              padding: "8px 12px",
              marginBottom: 8,
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
