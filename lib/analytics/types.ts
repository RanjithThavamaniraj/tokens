export type ActivityWindow = "today" | "last7Days" | "last30Days";

export interface AnalyticsOverview {
  totalProjects: number;
  totalConversations: number;
  totalPrompts: number;
  totalResponses: number;
  totalRecommendations: number;
}

export interface ProviderAnalytics {
  providerId: string;
  providerName: string;
  requests: number;
  responses: number;
  modelsUsed: string[];
  estimatedTokens: number | null;
  estimatedCostUsd: number | null;
}

export interface ModelAnalytics {
  modelId: string;
  requests: number;
  /** Milliseconds; null when timing data is unavailable locally. */
  averageResponseTimeMs: number | null;
}

export interface ProjectAnalytics {
  projectId: string;
  name: string;
  conversationCount: number;
  lastUpdated: string;
  promptCount: number;
  responseCount: number;
}

export interface ActivitySummary {
  window: ActivityWindow;
  label: string;
  projectsTouched: number;
  conversations: number;
  prompts: number;
  responses: number;
  recommendations: number;
}

export interface ExportAnalytics {
  totalExports: number;
  byFormat: Record<string, number>;
  byScope: Record<string, number>;
  mostExportedContentType: string | null;
}

export interface UsageDashboardData {
  overview: AnalyticsOverview;
  providers: ProviderAnalytics[];
  models: ModelAnalytics[];
  projects: ProjectAnalytics[];
  activity: ActivitySummary[];
  exports: ExportAnalytics;
  computedAt: string;
  fingerprint: string;
}

export interface ExportEvent {
  id: string;
  exportedAt: string;
  format: string;
  scope: string;
}

export const ANALYTICS_CACHE_KEY = "tokens:analytics-cache:v1";
export const ANALYTICS_EXPORTS_KEY = "tokens:analytics-exports:v1";
