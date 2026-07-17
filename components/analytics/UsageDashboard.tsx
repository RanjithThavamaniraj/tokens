"use client";

import type { ReactNode } from "react";
import type {
  ExportAnalytics,
  ModelAnalytics,
  UsageDashboardData,
} from "@/lib/analytics/types";
import StatCard from "./StatCard";
import ProviderTable from "./ProviderTable";
import ProjectTable from "./ProjectTable";
import ActivityChart from "./ActivityChart";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.15rem",
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "var(--color-muted)",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function ModelBars({ models }: { models: ModelAnalytics[] }) {
  if (models.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          color: "var(--color-muted)",
          margin: 0,
        }}
      >
        No model usage recorded yet.
      </p>
    );
  }

  const max = Math.max(1, ...models.map((model) => model.requests));
  return (
    <div className="flex flex-col gap-3">
      {models.slice(0, 8).map((model) => (
        <div key={model.modelId}>
          <div className="flex items-baseline justify-between gap-3">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--color-text)",
              }}
            >
              {model.modelId}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--color-muted)",
              }}
            >
              {model.requests} requests
              {model.averageResponseTimeMs !== null
                ? ` · avg ${Math.round(model.averageResponseTimeMs)}ms`
                : " · avg time unavailable"}
            </span>
          </div>
          <div
            className="mt-2 rounded-full"
            style={{
              height: 8,
              background: "var(--color-border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.round((model.requests / max) * 100)}%`,
                height: "100%",
                background: "var(--color-accent)",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExportSummary({ exports }: { exports: ExportAnalytics }) {
  const formatEntries = Object.entries(exports.byFormat).sort(
    (a, b) => b[1] - a[1],
  );
  const scopeEntries = Object.entries(exports.byScope).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Total exports" value={exports.totalExports} />
      <div
        className="rounded-lg sm:col-span-2"
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
          Format breakdown
        </p>
        {formatEntries.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--color-muted)",
              marginTop: 8,
            }}
          >
            No exports recorded yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {formatEntries.map(([format, count]) => (
              <li
                key={format}
                className="flex items-center justify-between"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  color: "var(--color-text)",
                }}
              >
                <span style={{ textTransform: "uppercase" }}>{format}</span>
                <span style={{ color: "var(--color-muted)" }}>{count}</span>
              </li>
            ))}
          </ul>
        )}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-muted)",
            marginTop: 14,
            marginBottom: 0,
          }}
        >
          Most exported content:{" "}
          {exports.mostExportedContentType ?? "—"}
          {scopeEntries.length > 0
            ? ` (${scopeEntries
                .map(([scope, count]) => `${scope}: ${count}`)
                .join(", ")})`
            : ""}
        </p>
      </div>
    </div>
  );
}

export default function UsageDashboard({ data }: { data: UsageDashboardData }) {
  const { overview } = data;

  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Overview"
        description="Totals computed locally from your projects and conversations."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Projects" value={overview.totalProjects} />
          <StatCard
            label="Total Conversations"
            value={overview.totalConversations}
          />
          <StatCard label="Total Prompts" value={overview.totalPrompts} />
          <StatCard
            label="Total AI Responses"
            value={overview.totalResponses}
          />
          <StatCard
            label="Total Recommendations"
            value={overview.totalRecommendations}
          />
        </div>
      </Section>

      <Section
        title="Providers"
        description="Request and response activity grouped by provider."
      >
        <ProviderTable providers={data.providers} />
      </Section>

      <Section
        title="Models"
        description="Most used models across your local workspace history."
      >
        <ModelBars models={data.models} />
      </Section>

      <Section
        title="Projects"
        description="Most active projects by conversation volume."
      >
        <ProjectTable projects={data.projects} />
      </Section>

      <Section
        title="Activity"
        description="Simple summaries based on project updates in each window."
      >
        <ActivityChart activity={data.activity} />
      </Section>

      <Section
        title="Exports"
        description="Local export events recorded after successful downloads."
      >
        <ExportSummary exports={data.exports} />
      </Section>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.72rem",
          color: "var(--color-muted)",
          margin: 0,
        }}
      >
        Computed locally at {new Date(data.computedAt).toLocaleString()}. No
        data leaves this device.
      </p>
    </div>
  );
}
