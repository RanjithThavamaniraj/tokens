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
      className="flex items-center gap-2 overflow-x-auto"
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
