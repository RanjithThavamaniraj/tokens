import { BaseProvider, type ProviderId } from "@/lib/providers/Provider";

export class GeminiProvider extends BaseProvider {
  readonly id: ProviderId = "gemini";
  readonly name = "Google Gemini";
}
