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
import { generateCompletion, listModels } from "@/lib/anthropic/client";
import { AnthropicClientError } from "@/lib/anthropic/errors";

export class ClaudeProvider extends BaseProvider {
  readonly id: ProviderId = "claude";
  readonly name = "Anthropic Claude";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "Anthropic Claude";
  readonly description =
    "Connect your Anthropic account to track models, usage, and billing.";
  readonly documentationUrl = "https://platform.claude.com/docs";
  readonly logo = "/coins/claude.png";
  readonly defaultModelId = "claude-haiku-4-5";
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

  // Fully stateless: the API key is never stored on this instance. Every
  // call receives it as a parameter and forwards it straight through to the
  // client layer, request-scoped.

  async connect(credentials?: Record<string, string>): Promise<void> {
    const apiKey = credentials?.apiKey;
    if (!apiKey) {
      throw new AnthropicClientError("An API key is required.", "invalid_api_key");
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
      throw new AnthropicClientError("An API key is required.", "invalid_api_key");
    }
    return generateCompletion(apiKey, request.messages, {
      modelId: request.modelId,
      signal: request.signal,
      onChunk: request.onChunk,
    });
  }
}
