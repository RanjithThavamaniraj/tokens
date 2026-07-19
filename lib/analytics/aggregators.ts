import type {
  Project,
  ProjectWorkspaceState,
} from "@/lib/projects/ProjectRepository";
import type { ProviderId } from "@/lib/providers/Provider";
import { createProvider } from "@/lib/providers/ProviderFactory";
import type {
  ActivitySummary,
  ExportAnalytics,
  ExportEvent,
  ModelAnalytics,
  ProjectAnalytics,
  ProviderAnalytics,
  UsageDashboardData,
} from "./types";

/** Rough public list prices ($ / 1M tokens) for local cost estimates only. */
const MODEL_COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "grok-4.5": { input: 3, output: 15 },
  "perplexity/sonar": { input: 1, output: 1 },
  "mistral-large-latest": { input: 2, output: 6 },
};

function providerName(id: string): string {
  return createProvider(id)?.displayName ?? id;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysAgo(days: number): Date {
  const next = startOfDay(new Date());
  next.setDate(next.getDate() - days);
  return next;
}

function estimateCostUsd(
  modelId: string | undefined,
  inputTokens: number,
  outputTokens: number,
): number | null {
  if (!modelId) return null;
  const rates = MODEL_COST_PER_MILLION[modelId];
  if (!rates) return null;
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

export function buildFingerprint(
  projects: Project[],
  exportEvents: ExportEvent[],
): string {
  const projectPart = projects
    .map((project) => `${project.id}:${project.updatedAt}`)
    .sort()
    .join("|");
  const lastExport = exportEvents[0]?.exportedAt ?? "none";
  return `${projectPart}#exports:${exportEvents.length}:${lastExport}`;
}

export function aggregateUsageDashboard(
  projects: Project[],
  workspaces: Map<string, ProjectWorkspaceState>,
  exportEvents: ExportEvent[],
  fingerprint: string,
): UsageDashboardData {
  let totalConversations = 0;
  let totalPrompts = 0;
  let totalResponses = 0;
  let totalRecommendations = 0;

  const providerMap = new Map<
    string,
    {
      requests: number;
      responses: number;
      models: Set<string>;
      inputTokens: number;
      outputTokens: number;
      hasTokenData: boolean;
      costUsd: number;
      hasCostData: boolean;
    }
  >();

  const modelMap = new Map<string, number>();
  const projectRows: ProjectAnalytics[] = [];

  const activityBuckets: Record<
    ActivitySummary["window"],
    {
      projects: Set<string>;
      conversations: number;
      prompts: number;
      responses: number;
      recommendations: number;
    }
  > = {
    today: {
      projects: new Set(),
      conversations: 0,
      prompts: 0,
      responses: 0,
      recommendations: 0,
    },
    last7Days: {
      projects: new Set(),
      conversations: 0,
      prompts: 0,
      responses: 0,
      recommendations: 0,
    },
    last30Days: {
      projects: new Set(),
      conversations: 0,
      prompts: 0,
      responses: 0,
      recommendations: 0,
    },
  };

  const todayStart = startOfDay(new Date()).getTime();
  const weekStart = daysAgo(7).getTime();
  const monthStart = daysAgo(30).getTime();

  for (const project of projects) {
    const workspace = workspaces.get(project.id);
    if (!workspace) {
      projectRows.push({
        projectId: project.id,
        name: project.name,
        conversationCount: 0,
        lastUpdated: project.updatedAt,
        promptCount: 0,
        responseCount: 0,
      });
      continue;
    }

    let projectConversations = 0;
    let projectPrompts = 0;
    let projectResponses = 0;
    const updatedAt = Date.parse(project.updatedAt);

    for (const [providerId, messages] of Object.entries(workspace.conversations)) {
      if (!messages || messages.length === 0) continue;
      projectConversations += 1;
      totalConversations += 1;

      const prompts = messages.filter((message) => message.role === "user").length;
      const responses = messages.filter(
        (message) => message.role === "assistant" && message.content.trim() !== "",
      ).length;
      projectPrompts += prompts;
      projectResponses += responses;
      totalPrompts += prompts;
      totalResponses += responses;

      const modelId = workspace.selectedModelIds[providerId as ProviderId];
      const usage = workspace.responseUsage[providerId as ProviderId];
      const existing = providerMap.get(providerId) ?? {
        requests: 0,
        responses: 0,
        models: new Set<string>(),
        inputTokens: 0,
        outputTokens: 0,
        hasTokenData: false,
        costUsd: 0,
        hasCostData: false,
      };
      existing.requests += prompts;
      existing.responses += responses;
      if (modelId) {
        existing.models.add(modelId);
        modelMap.set(modelId, (modelMap.get(modelId) ?? 0) + prompts);
      }
      if (usage) {
        const input = usage.inputTokens ?? 0;
        const output = usage.outputTokens ?? 0;
        const total =
          usage.totalTokens ??
          (usage.inputTokens !== undefined || usage.outputTokens !== undefined
            ? input + output
            : undefined);
        if (total !== undefined) {
          existing.hasTokenData = true;
          existing.inputTokens += input;
          existing.outputTokens += output;
          const cost = estimateCostUsd(modelId, input, output);
          if (cost !== null) {
            existing.hasCostData = true;
            existing.costUsd += cost;
          }
        }
      }
      providerMap.set(providerId, existing);

      const touch = (window: ActivitySummary["window"]) => {
        const bucket = activityBuckets[window];
        bucket.projects.add(project.id);
        bucket.conversations += 1;
        bucket.prompts += prompts;
        bucket.responses += responses;
      };
      if (!Number.isNaN(updatedAt)) {
        if (updatedAt >= todayStart) touch("today");
        if (updatedAt >= weekStart) touch("last7Days");
        if (updatedAt >= monthStart) touch("last30Days");
      }
    }

    if (workspace.recommendation?.status === "done" && workspace.recommendation.text) {
      totalRecommendations += 1;
      const touchRec = (window: ActivitySummary["window"]) => {
        activityBuckets[window].projects.add(project.id);
        activityBuckets[window].recommendations += 1;
      };
      if (!Number.isNaN(updatedAt)) {
        if (updatedAt >= todayStart) touchRec("today");
        if (updatedAt >= weekStart) touchRec("last7Days");
        if (updatedAt >= monthStart) touchRec("last30Days");
      }
    }

    projectRows.push({
      projectId: project.id,
      name: project.name,
      conversationCount: projectConversations,
      lastUpdated: project.updatedAt,
      promptCount: projectPrompts,
      responseCount: projectResponses,
    });
  }

  const providers: ProviderAnalytics[] = [...providerMap.entries()]
    .map(([providerId, stats]) => ({
      providerId,
      providerName: providerName(providerId),
      requests: stats.requests,
      responses: stats.responses,
      modelsUsed: [...stats.models].sort(),
      estimatedTokens: stats.hasTokenData
        ? stats.inputTokens + stats.outputTokens
        : null,
      estimatedCostUsd: stats.hasCostData ? stats.costUsd : null,
    }))
    .sort((a, b) => b.requests - a.requests || a.providerName.localeCompare(b.providerName));

  const models: ModelAnalytics[] = [...modelMap.entries()]
    .map(([modelId, requests]) => ({
      modelId,
      requests,
      averageResponseTimeMs: null,
    }))
    .sort((a, b) => b.requests - a.requests || a.modelId.localeCompare(b.modelId));

  const projectsSorted = projectRows.sort((a, b) => {
    if (b.conversationCount !== a.conversationCount) {
      return b.conversationCount - a.conversationCount;
    }
    return Date.parse(b.lastUpdated) - Date.parse(a.lastUpdated);
  });

  const activity: ActivitySummary[] = [
    {
      window: "today",
      label: "Today",
      projectsTouched: activityBuckets.today.projects.size,
      conversations: activityBuckets.today.conversations,
      prompts: activityBuckets.today.prompts,
      responses: activityBuckets.today.responses,
      recommendations: activityBuckets.today.recommendations,
    },
    {
      window: "last7Days",
      label: "Last 7 Days",
      projectsTouched: activityBuckets.last7Days.projects.size,
      conversations: activityBuckets.last7Days.conversations,
      prompts: activityBuckets.last7Days.prompts,
      responses: activityBuckets.last7Days.responses,
      recommendations: activityBuckets.last7Days.recommendations,
    },
    {
      window: "last30Days",
      label: "Last 30 Days",
      projectsTouched: activityBuckets.last30Days.projects.size,
      conversations: activityBuckets.last30Days.conversations,
      prompts: activityBuckets.last30Days.prompts,
      responses: activityBuckets.last30Days.responses,
      recommendations: activityBuckets.last30Days.recommendations,
    },
  ];

  const byFormat: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  for (const event of exportEvents) {
    byFormat[event.format] = (byFormat[event.format] ?? 0) + 1;
    byScope[event.scope] = (byScope[event.scope] ?? 0) + 1;
  }
  const mostExportedContentType =
    Object.entries(byScope).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const exports: ExportAnalytics = {
    totalExports: exportEvents.length,
    byFormat,
    byScope,
    mostExportedContentType,
  };

  return {
    overview: {
      totalProjects: projects.length,
      totalConversations,
      totalPrompts,
      totalResponses,
      totalRecommendations,
    },
    providers,
    models,
    projects: projectsSorted,
    activity,
    exports,
    computedAt: new Date().toISOString(),
    fingerprint,
  };
}
