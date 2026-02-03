"use client";

import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { SceneContainer } from "@/components/scene/scene-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GridBackground } from "./grid-background";

function ArrowRight() {
  return (
    <HugeiconsIcon
      icon={ArrowRight02Icon}
      size={14}
      color="currentColor"
      strokeWidth={1.5}
      className="translate-y-px"
    />
  );
}

export function HeroSection() {
  return (
    <section className="relative mb-12 flex min-h-[850px] w-full flex-col items-center pt-32 h-dvh">
      <div className="pointer-events-none absolute top-0 left-1/2 z-0 flex h-full w-full max-w-[1200px] -translate-x-1/2 justify-center">
        <div className="size-full">
          <GridBackground />
        </div>
      </div>

      <div className="relative z-20 mb-6 animate-fade-in-up">
        <Badge
          variant="outline"
          className="flex items-center gap-2 rounded-full border-white/60 bg-white/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-pulse-black/70 backdrop-blur-sm"
        >
          Powered by
          <span className="flex items-center gap-1.5 font-bold text-black opacity-90">
            <Image
              src="/yellow.png"
              alt="Yellow Network"
              width={14}
              height={14}
              className="size-3.5"
            />
            YELLOW NETWORK
          </span>
        </Badge>
      </div>

      <div className="relative w-full max-w-[1200px] flex-1 cursor-move active:cursor-grabbing">
        <div className="absolute inset-0 z-10 -mt-10">
          <SceneContainer type="hero" />
        </div>

        <div className="h-12 pointer-events-none absolute bottom-28 left-1/2 z-30 -translate-x-1/2">
          <Button className="h-12 pointer-events-auto flex items-center gap-2.5 rounded-xl bg-pulse-black px-9 py-4 text-xs font-semibold text-white shadow-[0_20px_40px_-10px_rgba(76,29,149,0.3)] transition-all hover:bg-black/90">
            Start Trading <ArrowRight />
          </Button>
        </div>

        <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-12 opacity-20">
          <div className="size-1 rounded-full bg-black" />
          <div className="size-1 rounded-full bg-black" />
          <div className="size-1 rounded-full bg-black" />
          <div className="size-1 rounded-full bg-black" />
        </div>
      </div>

      <div className="pointer-events-none relative z-20 mt-auto grid w-full max-w-[1300px] grid-cols-1 items-end gap-12 px-4 pb-8 md:grid-cols-2 md:px-16">
        <div className="pointer-events-auto text-center md:text-left">
          <h1 className="mb-5 text-3xl font-medium leading-[1.05] tracking-tight text-pulse-black md:text-5xl lg:text-[3.5rem]">
            The Attention
            <br /> Prediction Market
          </h1>
          <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed tracking-wide text-pulse-gray md:mx-0">
            Trade sentiment, hottest narratives, and viral potential — before
            anyone else. Instant gasless micro-bets with AI agent settlement.
          </p>
        </div>

        <div className="pointer-events-auto pb-2 text-center md:pl-24 md:text-left">
          <h2 className="mb-3 text-2xl font-medium tracking-tight text-pulse-black">
            AI Settlement
          </h2>
          <p className="mx-auto mb-5 max-w-xs text-sm font-medium leading-relaxed text-pulse-gray md:mx-0">
            Autonomous agents analyze real-time attention data to resolve
            markets with transparent reasoning.
          </p>
          <a
            href="#how-it-works"
            className="flex items-center justify-center gap-2 text-sm font-bold text-pulse-black transition-all hover:gap-3 md:justify-start"
          >
            Learn more <ArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}
