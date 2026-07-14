import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
} from "@/lib/providers/Provider";

export class OpenAIProvider extends BaseProvider {
  readonly id: ProviderId = "openai";
  readonly name = "OpenAI";

  readonly authMethod: ProviderAuthMethod = "API_KEY";
  readonly displayName = "OpenAI";
  readonly description =
    "Connect your OpenAI account to track models, usage, and billing.";
  readonly documentationUrl = "https://platform.openai.com/docs";
  readonly logo = "/coins/openai.png";
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
}
