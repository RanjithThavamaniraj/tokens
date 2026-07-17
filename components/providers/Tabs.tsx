"use client";

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto"
      style={{
        scrollbarWidth: "none",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
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
