import ProviderPage from "@/components/providers/ProviderPage";
import { createProvider } from "@/lib/providers/ProviderFactory";

export const metadata = {
  title: "Google Gemini — Tokens",
};

export default function GeminiProviderPage() {
  const provider = createProvider("gemini")!;

  return (
    <ProviderPage
      providerId={provider.id}
      name={provider.name}
      statusLabel={provider.statusLabel()}
      status={provider.status}
      overview={provider.getOverview()}
      coinSrc="/coins/gemini.png"
      capabilities={provider.capabilities}
      integration={provider.integration}
    />
  );
}
