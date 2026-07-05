import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/hero/Hero";
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
      <div className="relative flex w-full min-h-screen flex-col overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero-bg.png"
          alt=""
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,7,11,0.78) 0%, rgba(6,7,11,0.42) 48%, rgba(6,7,11,0.15) 100%)",
          }}
        />

        <Navbar />
        <Hero />
      </div>

      <OneWorkspace />
    </main>
  );
}
