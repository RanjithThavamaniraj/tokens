import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
  type ProviderIntegration,
} from "@/lib/providers/Provider";

export class OpenRouterProvider extends BaseProvider {
  readonly id: ProviderId = "openrouter";
  readonly name = "OpenRouter";

  readonly authMethod: ProviderAuthMethod = "OAUTH";
  readonly displayName = "OpenRouter";
  readonly description =
    "Connect your OpenRouter account to track models, usage, and billing across providers.";
  readonly documentationUrl = "https://openrouter.ai/docs";
  readonly logo = "/coins/openrouter.png";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: true,
    projects: true,
    organizations: true,
    rateLimits: false,
    embeddings: true,
    images: true,
    responses: true,
    files: true,
    fineTuning: false,
    assistants: false,
    conversations: false,
  };
  readonly integration: ProviderIntegration = {
    title: "Connect with OpenRouter",
    description: "Authorize Tokens to access your OpenRouter account.",
    requiresAdmin: false,
    instructions:
      "You'll be redirected to OpenRouter to approve access, then returned here automatically.",
    fields: [
      {
        id: "oauth",
        label: "Connect OpenRouter",
        description: "Uses OpenRouter's OAuth flow — no key to copy or paste.",
        required: true,
        type: "oauth",
      },
    ],
  };
}
