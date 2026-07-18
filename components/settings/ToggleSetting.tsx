"use client";

export default function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex items-start justify-between gap-4 rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        padding: "14px 16px",
        cursor: "pointer",
      }}
    >
      <span className="min-w-0">
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-muted)",
            marginTop: 4,
          }}
        >
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="toggle-track"
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          background: checked ? "var(--color-accent)" : "var(--color-border)",
          position: "relative",
          flexShrink: 0,
          marginTop: 2,
          transition: "background 0.15s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#fff",
            transition: "left 0.15s ease",
          }}
        />
      </span>
    </label>
  );
}
