// Local persistence for analytics cache and export event log only.
// Project/conversation content is never duplicated here.

import type { ExportEvent, UsageDashboardData } from "./types";
import { ANALYTICS_CACHE_KEY, ANALYTICS_EXPORTS_KEY } from "./types";

export interface AnalyticsRepository {
  loadCache(): Promise<UsageDashboardData | null>;
  saveCache(data: UsageDashboardData): Promise<void>;
  clearCache(): Promise<void>;
  listExportEvents(): Promise<ExportEvent[]>;
  appendExportEvent(event: ExportEvent): Promise<void>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class LocalStorageAnalyticsRepository implements AnalyticsRepository {
  async loadCache(): Promise<UsageDashboardData | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(ANALYTICS_CACHE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isObject(parsed) || typeof parsed.fingerprint !== "string") {
        return null;
      }
      return parsed as unknown as UsageDashboardData;
    } catch {
      return null;
    }
  }

  async saveCache(data: UsageDashboardData): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(data));
  }

  async clearCache(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ANALYTICS_CACHE_KEY);
  }

  async listExportEvents(): Promise<ExportEvent[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(ANALYTICS_EXPORTS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (entry): entry is ExportEvent =>
          isObject(entry) &&
          typeof entry.id === "string" &&
          typeof entry.exportedAt === "string" &&
          typeof entry.format === "string" &&
          typeof entry.scope === "string",
      );
    } catch {
      return [];
    }
  }

  async appendExportEvent(event: ExportEvent): Promise<void> {
    if (typeof window === "undefined") return;
    const current = await this.listExportEvents();
    const next = [event, ...current].slice(0, 500);
    window.localStorage.setItem(ANALYTICS_EXPORTS_KEY, JSON.stringify(next));
    await this.clearCache();
  }
}

export const analyticsRepository: AnalyticsRepository =
  new LocalStorageAnalyticsRepository();
