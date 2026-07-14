import ProviderPage from "@/components/providers/ProviderPage";
import { createProvider } from "@/lib/providers/ProviderFactory";

export const metadata = {
  title: "Anthropic Claude — Tokens",
};

export default function ClaudeProviderPage() {
  const provider = createProvider("claude")!;

  return (
    <ProviderPage
      providerId={provider.id}
      name={provider.name}
      statusLabel={provider.statusLabel()}
      status={provider.status}
      overview={provider.getOverview()}
      coinSrc="/coins/claude.png"
      capabilities={provider.capabilities}
      integration={provider.integration}
    />
  );
}
