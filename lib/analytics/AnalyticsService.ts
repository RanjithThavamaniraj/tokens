import { projectRepository } from "@/lib/projects/ProjectRepository";
import type { ProjectWorkspaceState } from "@/lib/projects/ProjectRepository";
import {
  aggregateUsageDashboard,
  buildFingerprint,
} from "./aggregators";
import {
  analyticsRepository,
  type AnalyticsRepository,
} from "./AnalyticsRepository";
import type { ExportEvent, UsageDashboardData } from "./types";

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  /**
   * Returns cached analytics when the project fingerprint is unchanged;
   * otherwise recomputes from live project data and refreshes the cache.
   */
  async getDashboard(): Promise<UsageDashboardData> {
    const projects = await projectRepository.list();
    const exportEvents = await this.repository.listExportEvents();
    const fingerprint = buildFingerprint(projects, exportEvents);

    const cached = await this.repository.loadCache();
    if (cached && cached.fingerprint === fingerprint) {
      return cached;
    }

    const workspaces = new Map<string, ProjectWorkspaceState>();
    await Promise.all(
      projects.map(async (project) => {
        const workspace = await projectRepository.get(project.id);
        if (workspace) workspaces.set(project.id, workspace);
      }),
    );

    const data = aggregateUsageDashboard(
      projects,
      workspaces,
      exportEvents,
      fingerprint,
    );
    await this.repository.saveCache(data);
    return data;
  }

  async recordExport(format: string, scope: string): Promise<void> {
    const event: ExportEvent = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `export-${Date.now()}`,
      exportedAt: new Date().toISOString(),
      format,
      scope,
    };
    await this.repository.appendExportEvent(event);
  }
}

export const analyticsService = new AnalyticsService(analyticsRepository);
