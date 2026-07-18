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
import {
  generateCompletion,
  listModels,
  validateApiKey,
} from "@/lib/perplexity/client";
import { PerplexityClientError } from "@/lib/perplexity/errors";

export class PerplexityProvider extends BaseProvider {
  readonly id: ProviderId = "perplexity";
  readonly name = "Perplexity";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "Perplexity";
  readonly description =
    "Connect your Perplexity account to use Agent API models and web-grounded generation.";
  readonly documentationUrl = "https://docs.perplexity.ai";
  readonly logo = "/coins/perplexity.png";
  readonly defaultModelId = "perplexity/sonar";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: false,
    projects: false,
    organizations: false,
    rateLimits: true,
    embeddings: true,
    images: false,
    responses: true,
    files: false,
    fineTuning: false,
    assistants: false,
    conversations: true,
  };
  readonly integration: ProviderIntegration = {
    title: "Connect with API Key",
    description:
      "Paste a Perplexity API key to use Agent API models and generation capabilities.",
    requiresAdmin: false,
    instructions: "Create an API key at console.perplexity.ai.",
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "pplx-...",
        description: "Your API key from the Perplexity API Portal.",
        required: true,
        type: "password",
        validation: 'Starts with "pplx-"',
      },
    ],
  };

  async connect(credentials?: Record<string, string>): Promise<void> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      throw new PerplexityClientError(
        "No API key has been configured for Perplexity.",
        "invalid_api_key",
      );
    }
    await validateApiKey(apiKey);
  }

  async getModels(credentials?: Record<string, string>): Promise<ProviderModel[]> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) return [];
    const models = await listModels(apiKey);
    return models.map((model) => ({ id: model.id, name: model.id }));
  }

  async executePrompt(
    request: ProviderExecutionRequest,
  ): Promise<ProviderExecutionResult> {
    const apiKey = request.credentials?.apiKey;
    if (!apiKey) {
      throw new PerplexityClientError(
        "No API key has been configured for Perplexity.",
        "invalid_api_key",
      );
    }
    return generateCompletion(apiKey, request.messages, {
      modelId: request.modelId,
      signal: request.signal,
      onChunk: request.onChunk,
    });
  }
}
