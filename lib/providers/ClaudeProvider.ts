import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
  type ProviderIntegration,
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
  readonly integration: ProviderIntegration = {
    title: "Connect with API Key",
    description:
      "Paste an Anthropic API key to start syncing models, usage, and billing.",
    requiresAdmin: false,
    instructions:
      "Create a key at console.anthropic.com/settings/keys, or an admin key under console.anthropic.com/settings/admin-keys for usage and billing access.",
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "sk-ant-...",
        description:
          "Your Anthropic API key. Use an admin key to unlock usage and billing data.",
        required: true,
        type: "password",
        validation: 'Starts with "sk-ant-"',
      },
    ],
  };
}
