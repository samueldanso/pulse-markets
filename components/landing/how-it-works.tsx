"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { SceneContainer } from "@/components/scene/scene-container";
import { Button } from "@/components/ui/button";

function ArrowRight() {
  return (
    <HugeiconsIcon
      icon={ArrowRight01Icon}
      size={14}
      color="currentColor"
      strokeWidth={1.5}
      className="translate-y-px"
    />
  );
}

export function HowitWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative mx-auto mb-32 max-w-[1100px] px-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-sm md:p-16">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div>
            <h2 className="mb-5 text-3xl font-medium text-pulse-black md:text-4xl">
              UP or DOWN. You Choose.
            </h2>
            <p className="mb-10 max-w-sm text-base font-medium leading-relaxed text-pulse-gray">
              Pick a market (e.g. Elon Musk Twitter Attention Index). Bet UP if attention
              will grow, DOWN if it will fade. Winners split the pot
              proportionally. Markets auto-settle when the timer hits zero.
            </p>
            <Button asChild className="h-12 flex items-center gap-2.5 rounded-xl bg-pulse-black px-7 py-3.5 text-xs font-semibold text-white transition-opacity hover:bg-black/80">
              <Link href="/markets">
                Explore Markets <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="relative flex h-[350px] items-center justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 border-b border-gray-200 pb-2 font-mono text-[10px] uppercase tracking-widest text-pulse-gray">
              Settlement Agent 001
            </div>
            <div className="pointer-events-none size-full">
              <SceneContainer type="agent" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-16 right-0 left-0 hidden border-t border-dashed border-gray-200 md:block" />
    </section>
  );
}
