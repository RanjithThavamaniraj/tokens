import ProviderPage from "@/components/providers/ProviderPage";
import { createProvider } from "@/lib/providers/ProviderFactory";

export const metadata = {
  title: "OpenAI — Tokens",
};

export default function OpenAIProviderPage() {
  const provider = createProvider("openai")!;

  return (
    <ProviderPage
      providerId={provider.id}
      name={provider.name}
      statusLabel={provider.statusLabel()}
      status={provider.status}
      overview={provider.getOverview()}
      coinSrc="/coins/openai.png"
      capabilities={provider.capabilities}
      integration={provider.integration}
    />
  );
}
