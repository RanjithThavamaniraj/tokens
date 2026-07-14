import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
} from "@/lib/providers/Provider";

export class GitHubCopilotProvider extends BaseProvider {
  readonly id: ProviderId = "github-copilot";
  readonly name = "GitHub Copilot";

  readonly authMethod: ProviderAuthMethod = "OAUTH";
  readonly displayName = "GitHub Copilot";
  readonly description =
    "Connect your GitHub organization to track Copilot usage and seat billing.";
  readonly documentationUrl = "https://docs.github.com/en/copilot";
  readonly logo = "/coins/github-copilot.png";
  readonly capabilities: ProviderCapabilities = {
    models: false,
    usage: true,
    billing: true,
    projects: false,
    organizations: true,
    rateLimits: true,
    embeddings: false,
    images: false,
    responses: false,
    files: false,
    fineTuning: false,
    assistants: false,
    conversations: false,
  };
}
