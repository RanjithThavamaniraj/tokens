export default function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="flex items-center justify-center text-center"
      style={{ padding: "64px 24px" }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          color: "var(--color-muted)",
        }}
      >
        {text}
      </p>
    </div>
  );
}
