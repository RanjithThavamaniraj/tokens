"use client";

export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          color: "var(--color-muted)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.6rem",
          color: "var(--color-text)",
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {value}
      </p>
      {hint && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            color: "var(--color-muted)",
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
