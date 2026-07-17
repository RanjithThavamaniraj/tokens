"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import UsageDashboard from "@/components/analytics/UsageDashboard";
import { analyticsService } from "@/lib/analytics/AnalyticsService";
import type { UsageDashboardData } from "@/lib/analytics/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<UsageDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void analyticsService
      .getDashboard()
      .then((dashboard) => {
        if (cancelled) return;
        setData(dashboard);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Unable to load analytics.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        background: "var(--color-bg)",
        minHeight: "100vh",
      }}
    >
      <Navbar />

      <div
        className="mx-auto w-full max-w-[1100px] px-5 sm:px-8"
        style={{ paddingTop: "clamp(32px, 5vw, 56px)", paddingBottom: 96 }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Usage & Insights
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            color: "var(--color-muted)",
            marginTop: 8,
          }}
        >
          Local analytics from your Tokens projects, conversations, and
          exports. Nothing is sent to a server.
        </p>

        <div style={{ marginTop: 36 }}>
          {loading && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--color-muted)",
              }}
            >
              Computing local analytics…
            </p>
          )}
          {error && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--color-accent)",
              }}
            >
              {error}
            </p>
          )}
          {data && <UsageDashboard data={data} />}
        </div>
      </div>
    </main>
  );
}
