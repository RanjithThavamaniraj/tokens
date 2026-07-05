import { BaseProvider, type ProviderId } from "@/lib/providers/Provider";

export class OpenRouterProvider extends BaseProvider {
  readonly id: ProviderId = "openrouter";
  readonly name = "OpenRouter";
}
