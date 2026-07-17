import ProviderPage from "@/components/providers/ProviderPage";
import { createProvider } from "@/lib/providers/ProviderFactory";

export const metadata = {
  title: "Grok — Tokens",
};

export default function GrokProviderPage() {
  const provider = createProvider("grok")!;

  return (
    <ProviderPage
      providerId={provider.id}
      name={provider.name}
      statusLabel={provider.statusLabel()}
      status={provider.status}
      overview={provider.getOverview()}
      coinSrc="/coins/grok.png"
      capabilities={provider.capabilities}
      integration={provider.integration}
    />
  );
}
