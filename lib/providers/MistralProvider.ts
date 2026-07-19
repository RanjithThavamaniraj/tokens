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
import { generateCompletion, listModels } from "@/lib/mistral/client";
import { MistralClientError } from "@/lib/mistral/errors";

export class MistralProvider extends BaseProvider {
  readonly id: ProviderId = "mistral";
  readonly name = "Mistral AI";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "Mistral AI";
  readonly description =
    "Connect your Mistral AI account to use Mistral models and generation capabilities.";
  readonly documentationUrl = "https://docs.mistral.ai/";
  readonly logo = "/coins/mistral.png";
  readonly defaultModelId = "mistral-large-latest";
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
      "Paste a Mistral AI API key to start using Mistral models and generation capabilities.",
    requiresAdmin: false,
    instructions: "Create an API key at console.mistral.ai.",
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "ms...",
        description: "Your Mistral AI API key from the Mistral Console.",
        required: true,
        type: "password",
      },
    ],
  };

  async connect(credentials?: Record<string, string>): Promise<void> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      throw new MistralClientError("No API key has been configured for Mistral AI.", "invalid_api_key");
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
      throw new MistralClientError("No API key has been configured for Mistral AI.", "invalid_api_key");
    }
    return generateCompletion(apiKey, request.messages, {
      modelId: request.modelId,
      signal: request.signal,
      onChunk: request.onChunk,
    });
  }
}
