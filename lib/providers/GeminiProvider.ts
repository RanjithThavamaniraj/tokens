import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
  type ProviderIntegration,
} from "@/lib/providers/Provider";

export class GeminiProvider extends BaseProvider {
  readonly id: ProviderId = "gemini";
  readonly name = "Google Gemini";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "Google Gemini";
  readonly description =
    "Connect your Gemini account to track models and generation capabilities.";
  readonly documentationUrl = "https://ai.google.dev/gemini-api/docs";
  readonly logo = "/coins/gemini.png";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: false,
    billing: false,
    projects: false,
    organizations: false,
    rateLimits: false,
    embeddings: true,
    images: true,
    responses: false,
    files: true,
    fineTuning: false,
    assistants: false,
    conversations: false,
  };
  readonly integration: ProviderIntegration = {
    title: "Connect with API Key",
    description:
      "Paste a Gemini API key to start syncing models and generation capabilities.",
    requiresAdmin: false,
    instructions: "Create a key at aistudio.google.com/apikey.",
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "AIza...",
        description: "Your Gemini API key from Google AI Studio.",
        required: true,
        type: "password",
      },
    ],
  };
}
