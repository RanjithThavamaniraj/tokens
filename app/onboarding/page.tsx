"use client";

import Navbar from "@/components/layout/Navbar";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        background: "var(--color-bg)",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <div
        className="mx-auto w-full max-w-[880px] px-5 sm:px-8"
        style={{ paddingTop: "clamp(32px, 6vw, 64px)", paddingBottom: 96 }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "var(--color-muted)",
            marginBottom: 16,
          }}
        >
          First-run setup · Local only
        </p>
        <OnboardingWizard />
      </div>
    </main>
  );
}
