import type {
  Message,
  ProviderId,
  ProviderTokenUsage,
} from "@/lib/providers/Provider";
import type { RecommendationState } from "@/lib/workspace/recommendation";
import type { ReviewFocus } from "@/lib/workspace/review";

const PROJECT_INDEX_KEY = "tokens:workspace-projects:index:v1";
const ACTIVE_PROJECT_KEY = "tokens:workspace-projects:active:v1";
const PROJECT_KEY_PREFIX = "tokens:workspace-project:";
const STORAGE_VERSION = 1;

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  conversationIds: string[];
  recommendationIds: string[];
  metadata: Record<string, unknown>;
}

export interface ProjectReviewEntry {
  reviewerId: ProviderId;
  focus: ReviewFocus;
  status: "done" | "error";
  text?: string;
  error?: string;
}

export interface ProjectDebateState {
  status: "complete";
  round1: {
    key: string;
    reviewerId: ProviderId;
    revieweeId: ProviderId;
    reviewerDisplayName: string;
    revieweeDisplayName: string;
    status: "done" | "error";
    text?: string;
    error?: string;
  }[];
  round2: {
    key: string;
    providerId: ProviderId;
    providerDisplayName: string;
    status: "done" | "error";
    text?: string;
    error?: string;
  }[];
}

export interface ProjectWorkspaceState {
  selectedProviderIds: ProviderId[];
  selectedModelIds: Partial<Record<ProviderId, string>>;
  responseUsage: Partial<Record<ProviderId, ProviderTokenUsage>>;
  stoppedProviderIds: ProviderId[];
  systemPrompt: string;
  userPrompt: string;
  conversations: Partial<Record<ProviderId, Message[]>>;
  reviews: Partial<Record<ProviderId, ProjectReviewEntry[]>>;
  debate: ProjectDebateState | null;
  recommendationProviderId: ProviderId;
  recommendation: RecommendationState | null;
}

interface StoredProject {
  version: number;
  project: Project;
  workspace: ProjectWorkspaceState;
}

export interface ProjectSession {
  projects: Project[];
  activeProjectId: string;
  workspace: ProjectWorkspaceState;
}

export interface ProjectRepository {
  initialize(): Promise<ProjectSession>;
  /** Read-only listing with no side effects (unlike initialize). */
  list(): Promise<Project[]>;
  get(projectId: string): Promise<ProjectWorkspaceState | null>;
  create(name: string): Promise<StoredProject>;
  save(
    projectId: string,
    workspace: ProjectWorkspaceState,
  ): Promise<Project | null>;
  rename(projectId: string, name: string): Promise<Project | null>;
  delete(projectId: string): Promise<void>;
  setActive(projectId: string): Promise<void>;
}

export function emptyProjectWorkspace(): ProjectWorkspaceState {
  return {
    selectedProviderIds: [
      "openai",
      "claude",
      "gemini",
      "grok",
      "perplexity",
      "mistral",
    ],
    selectedModelIds: {
      openai: "gpt-4o-mini",
      claude: "claude-haiku-4-5",
      gemini: "gemini-2.0-flash",
      grok: "grok-4.5",
      perplexity: "perplexity/sonar",
      mistral: "mistral-large-latest",
    },
    responseUsage: {},
    stoppedProviderIds: [],
    systemPrompt: "",
    userPrompt: "",
    conversations: {},
    reviews: {},
    debate: null,
    recommendationProviderId: "openai",
    recommendation: null,
  };
}

function projectKey(projectId: string): string {
  return `${PROJECT_KEY_PREFIX}${projectId}:v1`;
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const project = value as Partial<Project>;
  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string" &&
    Array.isArray(project.conversationIds) &&
    Array.isArray(project.recommendationIds) &&
    typeof project.metadata === "object" &&
    project.metadata !== null &&
    !Array.isArray(project.metadata)
  );
}

function isProviderId(value: unknown): value is ProviderId {
  return (
    value === "openai" ||
    value === "claude" ||
    value === "gemini" ||
    value === "grok" ||
    value === "perplexity"
  );
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const message = value as Partial<Message>;
  return (
    (message.role === "system" ||
      message.role === "user" ||
      message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function isProjectWorkspace(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const workspace = value as Partial<ProjectWorkspaceState>;
  const conversationsValid =
    workspace.conversations !== null &&
    typeof workspace.conversations === "object" &&
    !Array.isArray(workspace.conversations) &&
    Object.values(workspace.conversations).every(
      (messages) => Array.isArray(messages) && messages.every(isMessage),
    );
  const reviewsValid =
    workspace.reviews !== null &&
    typeof workspace.reviews === "object" &&
    !Array.isArray(workspace.reviews) &&
    Object.values(workspace.reviews).every(Array.isArray);
  const debateValid =
    workspace.debate === null ||
    (typeof workspace.debate === "object" &&
      workspace.debate.status === "complete" &&
      Array.isArray(workspace.debate.round1) &&
      Array.isArray(workspace.debate.round2));
  const recommendationValid =
    workspace.recommendation === null ||
    (typeof workspace.recommendation === "object" &&
      workspace.recommendation.status === "done" &&
      typeof workspace.recommendation.providerId === "string" &&
      typeof workspace.recommendation.text === "string");
  const selectedModelsValid =
    workspace.selectedModelIds === undefined ||
    (workspace.selectedModelIds !== null &&
      typeof workspace.selectedModelIds === "object" &&
      !Array.isArray(workspace.selectedModelIds) &&
      Object.entries(workspace.selectedModelIds).every(
        ([providerId, modelId]) =>
          isProviderId(providerId) && typeof modelId === "string",
      ));
  const responseUsageValid =
    workspace.responseUsage === undefined ||
    (workspace.responseUsage !== null &&
      typeof workspace.responseUsage === "object" &&
      !Array.isArray(workspace.responseUsage));
  const stoppedProvidersValid =
    workspace.stoppedProviderIds === undefined ||
    (Array.isArray(workspace.stoppedProviderIds) &&
      workspace.stoppedProviderIds.every(isProviderId));

  return (
    Array.isArray(workspace.selectedProviderIds) &&
    workspace.selectedProviderIds.every(isProviderId) &&
    typeof workspace.systemPrompt === "string" &&
    typeof workspace.userPrompt === "string" &&
    conversationsValid &&
    reviewsValid &&
    debateValid &&
    selectedModelsValid &&
    responseUsageValid &&
    stoppedProvidersValid &&
    isProviderId(workspace.recommendationProviderId) &&
    recommendationValid
  );
}

function readProject(projectId: string): StoredProject | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(projectKey(projectId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const stored = parsed as Partial<StoredProject>;
    if (
      stored.version !== STORAGE_VERSION ||
      !isProject(stored.project) ||
      !isProjectWorkspace(stored.workspace)
    ) {
      return null;
    }
    const workspace = stored.workspace as ProjectWorkspaceState;
    return {
      version: STORAGE_VERSION,
      project: stored.project,
      workspace: {
        ...workspace,
        selectedModelIds: workspace.selectedModelIds ?? {},
        responseUsage: workspace.responseUsage ?? {},
        stoppedProviderIds: workspace.stoppedProviderIds ?? [],
      },
    };
  } catch {
    return null;
  }
}

function readIndex(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROJECT_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isProject);
  } catch {
    return [];
  }
}

function writeIndex(projects: Project[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(projects));
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildProject(
  id: string,
  name: string,
  workspace: ProjectWorkspaceState,
  createdAt: string,
  metadata: Record<string, unknown> = {},
): Project {
  const conversationIds = Object.entries(workspace.conversations)
    .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
    .map(([providerId]) => providerId);
  const hasRecommendation =
    workspace.recommendation?.status === "done" &&
    Boolean(workspace.recommendation.text);

  return {
    id,
    name,
    createdAt,
    updatedAt: new Date().toISOString(),
    conversationIds,
    recommendationIds: hasRecommendation ? [`${id}:recommendation`] : [],
    metadata,
  };
}

class LocalStorageProjectRepository implements ProjectRepository {
  async initialize(): Promise<ProjectSession> {
    let projects = readIndex().filter((project) => readProject(project.id));

    if (projects.length === 0) {
      const stored = await this.create("My Project");
      projects = [stored.project];
    }

    const savedActive =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    const activeProject =
      projects.find((project) => project.id === savedActive) ?? projects[0];
    const workspace =
      (await this.get(activeProject.id)) ?? emptyProjectWorkspace();
    await this.setActive(activeProject.id);

    return {
      projects,
      activeProjectId: activeProject.id,
      workspace,
    };
  }

  async list(): Promise<Project[]> {
    return readIndex();
  }

  async get(projectId: string): Promise<ProjectWorkspaceState | null> {
    return readProject(projectId)?.workspace ?? null;
  }

  async create(name: string): Promise<StoredProject> {
    const workspace = emptyProjectWorkspace();
    const now = new Date().toISOString();
    const project = buildProject(
      createId(),
      name.trim() || "Untitled Project",
      workspace,
      now,
    );
    const stored: StoredProject = {
      version: STORAGE_VERSION,
      project,
      workspace,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(projectKey(project.id), JSON.stringify(stored));
      writeIndex([...readIndex(), project]);
    }
    return stored;
  }

  async save(
    projectId: string,
    workspace: ProjectWorkspaceState,
  ): Promise<Project | null> {
    const current = readProject(projectId);
    if (!current || typeof window === "undefined") return null;
    const project = buildProject(
      projectId,
      current.project.name,
      workspace,
      current.project.createdAt,
      current.project.metadata,
    );
    const stored: StoredProject = {
      version: STORAGE_VERSION,
      project,
      workspace,
    };
    window.localStorage.setItem(projectKey(projectId), JSON.stringify(stored));
    writeIndex(
      readIndex().map((entry) => (entry.id === projectId ? project : entry)),
    );
    return project;
  }

  async rename(projectId: string, name: string): Promise<Project | null> {
    const current = readProject(projectId);
    if (!current || typeof window === "undefined" || !name.trim()) return null;
    const project = {
      ...current.project,
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      projectKey(projectId),
      JSON.stringify({ ...current, project }),
    );
    writeIndex(
      readIndex().map((entry) => (entry.id === projectId ? project : entry)),
    );
    return project;
  }

  async delete(projectId: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(projectKey(projectId));
    writeIndex(readIndex().filter((project) => project.id !== projectId));
  }

  async setActive(projectId: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  }
}

export const projectRepository: ProjectRepository =
  new LocalStorageProjectRepository();
