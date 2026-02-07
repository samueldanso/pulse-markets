"use client";

import { usePrivy } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/landing/navbar";
import { PartnersSection } from "@/components/landing/partners-section";

const HeroSection = dynamic(
  () =>
    import("@/components/landing/hero-section").then((mod) => mod.HeroSection),
  { ssr: false },
);

const FeaturesSection = dynamic(
  () =>
    import("@/components/landing/features-section").then(
      (mod) => mod.FeaturesSection,
    ),
  { ssr: false },
);

const HowitWorksSection = dynamic(
  () =>
    import("@/components/landing/how-it-works").then(
      (mod) => mod.HowitWorksSection,
    ),
  { ssr: false },
);

export default function Page() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/markets");
    }
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen bg-pulse-bg font-sans text-pulse-black selection:bg-pulse-lime-300/20">
      <Navbar />
      <main className="relative overflow-hidden">
        <HeroSection />
        <FeaturesSection />
        <HowitWorksSection />
        <PartnersSection />
      </main>
    </div>
  );
}
