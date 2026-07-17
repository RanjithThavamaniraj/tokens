"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onboardingService } from "@/lib/onboarding/OnboardingService";

/**
 * Redirects first-time visitors from the homepage into onboarding.
 * Existing users (completed flag set) are never interrupted.
 */
export default function FirstRunGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") return;
    let cancelled = false;
    void onboardingService.isCompleted().then((completed) => {
      if (cancelled || completed) return;
      router.replace("/onboarding");
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
