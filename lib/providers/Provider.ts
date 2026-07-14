// Shared types and base abstraction for all AI provider integrations.
//
// This file intentionally contains BOTH the shared types/interface AND the
// abstract base class. Keeping them together avoids an extra file and
// centralizes the placeholder logic so that adding a real integration for a
// given provider later only requires editing that provider's own file
// (e.g. OpenAIProvider.ts), never this one, never the UI.

export type ProviderId =
  | "openai"
  | "claude"
  | "gemini"
  | "openrouter"
  | "cursor"
  | "github-copilot";

export type ProviderStatus =
  | "connected"
  | "disconnected"
  | "available"
  | "coming-soon";

// ---------------------------------------------------------------------------
// Placeholder result types
//
// None of these are populated with real data yet. Every provider method that
// returns one of these returns an empty/placeholder value until a real
// integration (auth, API calls, DB, etc.) is implemented for that provider.
// ---------------------------------------------------------------------------

export interface ProviderModel {
  id: string;
  name: string;
}

export interface ProviderUsage {
  period: string;
  totalTokens: number;
}

export interface ProviderBilling {
  plan: string;
  amountDue: string;
}

export interface ProviderConversation {
  id: string;
  title: string;
}

export interface ProviderOverview {
  organization: string;
  projects: string;
  apiKeyStatus: string;
  lastSynced: string;
}

// ---------------------------------------------------------------------------
// Declarative provider metadata
//
// Static, synchronous facts about a provider — no API calls involved. These
// drive UI decisions (e.g. which tabs to render) without the UI needing to
// hardcode per-provider knowledge.
// ---------------------------------------------------------------------------

export type ProviderAuthMethod = "API_KEY" | "OAUTH" | "ENTERPRISE";

export interface ProviderCapabilities {
  models: boolean;
  usage: boolean;
  billing: boolean;
  projects: boolean;
  organizations: boolean;
  rateLimits: boolean;
  embeddings: boolean;
  images: boolean;
  responses: boolean;
  files: boolean;
  fineTuning: boolean;
  assistants: boolean;
  conversations: boolean;
}

/** Human-readable labels for each capability, used for tab text. */
export const CAPABILITY_LABELS: Record<keyof ProviderCapabilities, string> = {
  models: "Models",
  usage: "Usage",
  billing: "Billing",
  projects: "Projects",
  organizations: "Organizations",
  rateLimits: "Rate Limits",
  embeddings: "Embeddings",
  images: "Images",
  responses: "Responses",
  files: "Files",
  fineTuning: "Fine-tuning",
  assistants: "Assistants",
  conversations: "Conversations",
};

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface Provider {
  readonly id: ProviderId;
  readonly name: string;
  readonly status: ProviderStatus;

  readonly authMethod: ProviderAuthMethod;
  readonly displayName: string;
  readonly description: string;
  readonly documentationUrl: string;
  readonly logo: string;
  readonly capabilities: ProviderCapabilities;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  getModels(): Promise<ProviderModel[]>;
  getUsage(): Promise<ProviderUsage | null>;
  getBilling(): Promise<ProviderBilling | null>;
  getConversations(): Promise<ProviderConversation[]>;

  lastSynced(): Date | null;

  /** Synchronous placeholder summary for the Overview tab. */
  getOverview(): ProviderOverview;

  /** Human-readable label for the current status (used by the UI). */
  statusLabel(): string;
}

const STATUS_LABELS: Record<ProviderStatus, string> = {
  connected: "Connected",
  disconnected: "Not Connected",
  available: "Available",
  "coming-soon": "Coming Soon",
};

// ---------------------------------------------------------------------------
// BaseProvider
//
// Abstract base that implements every method with a harmless, empty
// placeholder. Concrete subclasses only need to set `id` and `name` (and
// optionally override `status`). GOAL: when real auth/API logic is added for
// a provider, only that provider's subclass file changes.
// ---------------------------------------------------------------------------

export abstract class BaseProvider implements Provider {
  abstract readonly id: ProviderId;
  abstract readonly name: string;
  readonly status: ProviderStatus = "disconnected";

  // No shared default makes sense for these — every concrete provider must
  // declare its own metadata.
  abstract readonly authMethod: ProviderAuthMethod;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly documentationUrl: string;
  abstract readonly logo: string;
  abstract readonly capabilities: ProviderCapabilities;

  async connect(): Promise<void> {
    // No-op placeholder. Real auth/OAuth flow will live here per-provider.
  }

  async disconnect(): Promise<void> {
    // No-op placeholder.
  }

  async getModels(): Promise<ProviderModel[]> {
    return [];
  }

  async getUsage(): Promise<ProviderUsage | null> {
    return null;
  }

  async getBilling(): Promise<ProviderBilling | null> {
    return null;
  }

  async getConversations(): Promise<ProviderConversation[]> {
    return [];
  }

  lastSynced(): Date | null {
    return null;
  }

  getOverview(): ProviderOverview {
    const synced = this.lastSynced();
    return {
      organization: "Unavailable",
      projects: "Unavailable",
      apiKeyStatus: "Not Connected",
      lastSynced: synced ? synced.toLocaleString() : "Never",
    };
  }

  statusLabel(): string {
    return STATUS_LABELS[this.status];
  }
}
