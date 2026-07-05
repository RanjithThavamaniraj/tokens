import HeroSection from "@/components/hero/HeroSection";
import OneWorkspace from "@/components/sections/OneWorkspace";

export default function Home() {
  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        background: "var(--color-bg)",
      }}
    >
      <HeroSection backgroundImage="/hero-bg.png" />

      <OneWorkspace />
    </main>
  );
}
