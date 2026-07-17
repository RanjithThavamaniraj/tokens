import type { Provider, ProviderId } from "@/lib/providers/Provider";
import { OpenAIProvider } from "@/lib/providers/OpenAIProvider";
import { ClaudeProvider } from "@/lib/providers/ClaudeProvider";
import { GeminiProvider } from "@/lib/providers/GeminiProvider";
import { GrokProvider } from "@/lib/providers/GrokProvider";
import { PerplexityProvider } from "@/lib/providers/PerplexityProvider";
import { OpenRouterProvider } from "@/lib/providers/OpenRouterProvider";
import { CursorProvider } from "@/lib/providers/CursorProvider";
import { GitHubCopilotProvider } from "@/lib/providers/GitHubCopilotProvider";

// Registry of provider constructors, keyed by ProviderId. The UI must never
// `new` a provider class directly — it should always go through
// `createProvider` so that swapping/adding implementations never requires
// touching call sites.
const REGISTRY: Record<ProviderId, new () => Provider> = {
  openai: OpenAIProvider,
  claude: ClaudeProvider,
  gemini: GeminiProvider,
  grok: GrokProvider,
  perplexity: PerplexityProvider,
  openrouter: OpenRouterProvider,
  cursor: CursorProvider,
  "github-copilot": GitHubCopilotProvider,
};

function isProviderId(id: string): id is ProviderId {
  return Object.prototype.hasOwnProperty.call(REGISTRY, id);
}

export function createProvider(id: string): Provider | null {
  if (!isProviderId(id)) {
    return null;
  }
  const ProviderClass = REGISTRY[id];
  return new ProviderClass();
}
