import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
} from "@/lib/providers/Provider";

export class ClaudeProvider extends BaseProvider {
  readonly id: ProviderId = "claude";
  readonly name = "Anthropic Claude";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "Anthropic Claude";
  readonly description =
    "Connect your Anthropic account to track models, usage, and billing.";
  readonly documentationUrl = "https://platform.claude.com/docs";
  readonly logo = "/coins/claude.png";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: true,
    projects: true,
    organizations: true,
    rateLimits: true,
    embeddings: false,
    images: false,
    responses: false,
    files: true,
    fineTuning: false,
    assistants: false,
    conversations: false,
  };
}
