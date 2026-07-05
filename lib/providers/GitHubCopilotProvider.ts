import { BaseProvider, type ProviderId } from "@/lib/providers/Provider";

export class GitHubCopilotProvider extends BaseProvider {
  readonly id: ProviderId = "github-copilot";
  readonly name = "GitHub Copilot";
}
