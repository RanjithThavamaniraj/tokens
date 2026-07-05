import { BaseProvider, type ProviderId } from "@/lib/providers/Provider";

export class ClaudeProvider extends BaseProvider {
  readonly id: ProviderId = "claude";
  readonly name = "Anthropic Claude";
}
