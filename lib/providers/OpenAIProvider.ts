import { BaseProvider, type ProviderId } from "@/lib/providers/Provider";

export class OpenAIProvider extends BaseProvider {
  readonly id: ProviderId = "openai";
  readonly name = "OpenAI";
}
