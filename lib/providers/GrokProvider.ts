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
import { generateCompletion, listModels } from "@/lib/xai/client";
import { XAIClientError } from "@/lib/xai/errors";

export class GrokProvider extends BaseProvider {
  readonly id: ProviderId = "grok";
  readonly name = "Grok";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "Grok";
  readonly description =
    "Connect your xAI account to use Grok models and generation capabilities.";
  readonly documentationUrl = "https://docs.x.ai";
  readonly logo = "/coins/grok.png";
  readonly defaultModelId = "grok-4.5";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: false,
    projects: false,
    organizations: false,
    rateLimits: true,
    embeddings: true,
    images: true,
    responses: true,
    files: false,
    fineTuning: false,
    assistants: false,
    conversations: true,
  };
  readonly integration: ProviderIntegration = {
    title: "Connect with API Key",
    description:
      "Paste an xAI API key to start using Grok models and generation capabilities.",
    requiresAdmin: false,
    instructions: "Create an API key at console.x.ai.",
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "xai-...",
        description: "Your xAI API key from the xAI Console.",
        required: true,
        type: "password",
      },
    ],
  };

  async connect(credentials?: Record<string, string>): Promise<void> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      throw new XAIClientError("An API key is required.", "invalid_api_key");
    }
    await listModels(apiKey);
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
      throw new XAIClientError("An API key is required.", "invalid_api_key");
    }
    return generateCompletion(apiKey, request.messages, {
      modelId: request.modelId,
      signal: request.signal,
      onChunk: request.onChunk,
    });
  }
}
