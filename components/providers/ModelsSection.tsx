import EmptyState from "@/components/providers/EmptyState";
import type { ProviderModel } from "@/lib/providers/Provider";

export default function ModelsSection({
  models,
  error,
}: {
  models: ProviderModel[] | null;
  error: string | null;
}) {
  if (error) {
    return <EmptyState text={error} />;
  }

  if (models && models.length > 0) {
    return (
      <div>
        {models.map((model, i) => (
          <div
            key={model.id}
            style={{
              padding: "14px 4px",
              borderBottom:
                i < models.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                color: "var(--color-text)",
              }}
            >
              {model.name}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <EmptyState text="No models available until your account is connected." />
  );
}
