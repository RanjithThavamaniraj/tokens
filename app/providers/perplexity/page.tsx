import ProviderPage from "@/components/providers/ProviderPage";
import { createProvider } from "@/lib/providers/ProviderFactory";

export const metadata = {
  title: "Perplexity — Tokens",
};

export default function PerplexityProviderPage() {
  const provider = createProvider("perplexity")!;

  return (
    <ProviderPage
      providerId={provider.id}
      name={provider.name}
      statusLabel={provider.statusLabel()}
      status={provider.status}
      overview={provider.getOverview()}
      coinSrc="/coins/perplexity.png"
      capabilities={provider.capabilities}
      integration={provider.integration}
    />
  );
}
