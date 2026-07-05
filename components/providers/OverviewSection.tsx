import type { ProviderOverview } from "@/lib/providers/Provider";

export default function OverviewSection({
  overview,
}: {
  overview: ProviderOverview;
}) {
  const ROWS: { label: string; value: string }[] = [
    { label: "Organization", value: overview.organization },
    { label: "Projects", value: overview.projects },
    { label: "API Key Status", value: overview.apiKeyStatus },
    { label: "Last Synced", value: overview.lastSynced },
  ];

  return (
    <div>
      {ROWS.map((row, i) => (
        <div
          key={row.label}
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
            {row.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
