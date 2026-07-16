import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderExecutionRequest,
  type ProviderExecutionResult,
  type ProviderId,
  type ProviderIntegration,
  type ProviderModel,
} from "@/lib/providers/Provider";
import { generateCompletion, listModels } from "@/lib/gemini/client";
import { GeminiClientError } from "@/lib/gemini/errors";

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

  // Fully stateless: the API key is never stored on this instance. Every
  // call receives it as a parameter and forwards it straight through to the
  // client layer, request-scoped.

  async connect(credentials?: Record<string, string>): Promise<void> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      throw new GeminiClientError("An API key is required.", "invalid_api_key");
    }
    await listModels(apiKey); // validates the key; result intentionally discarded, not stored
  }

  async getModels(credentials?: Record<string, string>): Promise<ProviderModel[]> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      return [];
    }
    const models = await listModels(apiKey);
    return models.map((model) => ({ id: model.id, name: model.displayName }));
  }

  async executePrompt(request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    const apiKey = request.credentials?.apiKey;
    if (!apiKey) {
      throw new GeminiClientError("An API key is required.", "invalid_api_key");
    }
    const text = await generateCompletion(apiKey, request.messages);
    return { text };
  }
}
