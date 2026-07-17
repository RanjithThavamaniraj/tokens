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
import { generateCompletion, listModels } from "@/lib/openai/client";
import { OpenAIClientError } from "@/lib/openai/errors";

export class OpenAIProvider extends BaseProvider {
  readonly id: ProviderId = "openai";
  readonly name = "OpenAI";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "OpenAI";
  readonly description =
    "Connect your OpenAI account to track models, usage, and billing.";
  readonly documentationUrl = "https://platform.openai.com/docs";
  readonly logo = "/coins/openai.png";
  readonly defaultModelId = "gpt-4o-mini";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: true,
    projects: true,
    organizations: false,
    rateLimits: true,
    embeddings: true,
    images: true,
    responses: true,
    files: true,
    fineTuning: true,
    assistants: true,
    conversations: true,
  };
  readonly integration: ProviderIntegration = {
    title: "Connect with API Key",
    description:
      "Paste an OpenAI API key to start syncing models, usage, and billing.",
    requiresAdmin: false,
    instructions:
      "Create a secret key at platform.openai.com/api-keys, or an admin key at platform.openai.com/settings/organization/admin-keys for usage and billing access.",
    fields: [
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "sk-...",
        description:
          "Your OpenAI secret key. Use an admin key to unlock usage and billing data.",
        required: true,
        type: "password",
        validation: 'Starts with "sk-"',
      },
    ],
  };

  // Fully stateless: the API key is never stored on this instance. Every
  // call receives it as a parameter and forwards it straight through to the
  // client layer, request-scoped.

  async connect(credentials?: Record<string, string>): Promise<void> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      throw new OpenAIClientError("An API key is required.", "invalid_api_key");
    }
    await listModels(apiKey); // validates the key; result intentionally discarded, not stored
  }

  async getModels(credentials?: Record<string, string>): Promise<ProviderModel[]> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      return [];
    }
    const models = await listModels(apiKey);
    return models.map((model) => ({ id: model.id, name: model.id }));
  }

  async executePrompt(request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    const apiKey = request.credentials?.apiKey;
    if (!apiKey) {
      throw new OpenAIClientError("An API key is required.", "invalid_api_key");
    }
    return generateCompletion(apiKey, request.messages, {
      modelId: request.modelId,
      signal: request.signal,
      onChunk: request.onChunk,
    });
  }
}
