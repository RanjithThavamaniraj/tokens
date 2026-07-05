import ProviderPage from "@/components/providers/ProviderPage";

export const metadata = {
  title: "OpenAI — Tokens",
};

export default function OpenAIProviderPage() {
  return (
    <ProviderPage
      name="OpenAI"
      slug="openai"
      status="Connected"
      coinSrc="/coins/openai.png"
    />
  );
}
