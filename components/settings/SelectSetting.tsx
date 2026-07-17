"use client";

export default function SelectSetting({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label
      className="flex flex-col gap-2 rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        padding: "14px 16px",
      }}
    >
      <span
        style={{
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
          fontFamily: "var(--font-body)",
          fontSize: "0.78rem",
          color: "var(--color-muted)",
        }}
      >
        {description}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg"
        style={{
          marginTop: 4,
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
          padding: "8px 12px",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
