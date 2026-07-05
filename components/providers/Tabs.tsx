"use client";

export const TAB_NAMES = [
  "Overview",
  "Models",
  "Usage",
  "Billing",
  "Conversations",
] as const;

export type TabName = (typeof TAB_NAMES)[number];

export default function Tabs({
  active,
  onChange,
}: {
  active: TabName;
  onChange: (tab: TabName) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto"
      style={{
        scrollbarWidth: "none",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {TAB_NAMES.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className="whitespace-nowrap transition-colors duration-300 ease-out"
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
              padding: "8px 18px",
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
