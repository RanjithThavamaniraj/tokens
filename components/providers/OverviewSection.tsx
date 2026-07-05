const ROWS = ["Organization", "Projects", "API Key Status", "Last Synced"];

export default function OverviewSection() {
  return (
    <div>
      {ROWS.map((label, i) => (
        <div
          key={label}
          className="flex items-center justify-between"
          style={{
            padding: "20px 4px",
            borderBottom:
              i < ROWS.length - 1 ? "1px solid var(--color-border)" : "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              color: "var(--color-muted)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            Not Connected
          </span>
        </div>
      ))}
    </div>
  );
}
