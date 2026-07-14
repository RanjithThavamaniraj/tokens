import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
} from "@/lib/providers/Provider";

export class CursorProvider extends BaseProvider {
  readonly id: ProviderId = "cursor";
  readonly name = "Cursor";

  readonly authMethod: ProviderAuthMethod = "ENTERPRISE";
  readonly displayName = "Cursor";
  readonly description =
    "Connect your Cursor Enterprise account to track team usage and billing.";
  readonly documentationUrl = "https://cursor.com/docs";
  readonly logo = "/coins/cursor.png";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: true,
    projects: false,
    organizations: false,
    rateLimits: false,
    embeddings: false,
    images: false,
    responses: false,
    files: false,
    fineTuning: false,
    assistants: false,
    conversations: true,
  };
}
