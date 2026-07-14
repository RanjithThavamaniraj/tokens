import {
  BaseProvider,
  type ProviderAuthMethod,
  type ProviderCapabilities,
  type ProviderId,
  type ProviderIntegration,
} from "@/lib/providers/Provider";

export class CursorProvider extends BaseProvider {
  readonly id: ProviderId = "cursor";
  readonly name = "Cursor";

  readonly authMethod: ProviderAuthMethod = "ENTERPRISE";
  readonly displayName = "Cursor";
  readonly description =
    "Connect your Cursor Enterprise account to track team usage and billing.";
  readonly documentationUrl = "https://cursor.com/docs";
  readonly logo = "/coins/cursor.png";
  readonly capabilities: ProviderCapabilities = {
    models: true,
    usage: true,
    billing: true,
    projects: false,
    organizations: false,
    rateLimits: false,
    embeddings: false,
    images: false,
    responses: false,
    files: false,
    fineTuning: false,
    assistants: false,
    conversations: true,
  };
  readonly integration: ProviderIntegration = {
    title: "Connect with Admin Key",
    description:
      "Paste an Enterprise-issued admin key to start syncing team usage and billing.",
    requiresAdmin: true,
    instructions:
      "Ask your Cursor Enterprise admin to issue an Admin API key from the team dashboard. Self-serve plans do not have access to this API.",
    fields: [
      {
        id: "adminApiKey",
        label: "Admin API Key",
        placeholder: "Enter your admin-issued key",
        description: "Issued by your Cursor Enterprise team admin.",
        required: true,
        type: "password",
      },
    ],
  };
}
