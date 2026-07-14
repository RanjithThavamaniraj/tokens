import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
  type ProviderIntegration,
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
  readonly integration: ProviderIntegration = {
    title: "Connect with GitHub",
    description:
      "Authorize Tokens to access your GitHub organization's Copilot data.",
    requiresAdmin: false,
    instructions:
      "You'll be redirected to GitHub to approve access, then returned here automatically.",
    fields: [
      {
        id: "oauth",
        label: "Connect GitHub",
        description: "Uses GitHub's OAuth flow — no key to copy or paste.",
        required: true,
        type: "oauth",
      },
    ],
  };
}
