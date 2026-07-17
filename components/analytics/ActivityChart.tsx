"use client";

import type { ActivitySummary } from "@/lib/analytics/types";

export default function ActivityChart({
  activity,
}: {
  activity: ActivitySummary[];
}) {
  const max = Math.max(
    1,
    ...activity.map(
      (entry) => entry.prompts + entry.responses + entry.recommendations,
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      {activity.map((entry) => {
        const total =
          entry.prompts + entry.responses + entry.recommendations;
        const width = `${Math.round((total / max) * 100)}%`;
        return (
          <div key={entry.window}>
            <div className="flex items-baseline justify-between gap-3">
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                {entry.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: "var(--color-muted)",
                  margin: 0,
                }}
              >
                {entry.projectsTouched} projects · {entry.conversations}{" "}
                conversations · {entry.prompts} prompts · {entry.responses}{" "}
                responses · {entry.recommendations} recommendations
              </p>
            </div>
            <div
              className="mt-2 rounded-full"
              style={{
                height: 10,
                background: "var(--color-border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width,
                  height: "100%",
                  background: "var(--color-accent)",
                  borderRadius: 999,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
