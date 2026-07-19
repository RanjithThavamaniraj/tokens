import ProviderPage from "@/components/providers/ProviderPage";
import { createProvider } from "@/lib/providers/ProviderFactory";

export const metadata = {
  title: "Mistral AI — Tokens",
};

export default function MistralProviderPage() {
  const provider = createProvider("mistral")!;

  return (
    <ProviderPage
      providerId={provider.id}
      name={provider.name}
      statusLabel={provider.statusLabel()}
      status={provider.status}
      overview={provider.getOverview()}
      coinSrc="/coins/mistral.png"
      capabilities={provider.capabilities}
      integration={provider.integration}
    />
  );
}
