"use client";

import { SceneContainer } from "@/components/scene/scene-container";

function DotPattern({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="2" cy="2" r="1" fill="#D4D4D8" />
      <circle cx="2" cy="12" r="1" fill="#D4D4D8" />
      <circle cx="12" cy="2" r="1" fill="#D4D4D8" />
    </svg>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative mx-auto mb-40 max-w-[1100px] px-6"
    >
      <div className="mb-20 text-center">
        <h2 className="mb-3 text-4xl font-medium tracking-tight md:text-5xl">
          The Gateway to
        </h2>
        <h2 className="text-4xl font-medium tracking-tight md:text-5xl">
          Attention Trading
        </h2>
      </div>

      <div className="grid h-auto grid-cols-1 gap-6 md:h-[640px] md:grid-cols-2">
        <div className="group relative flex h-[500px] flex-col overflow-hidden rounded-3xl border border-gray-900 bg-black p-10 text-white shadow-2xl shadow-lime-800/10 md:row-span-2 md:h-auto">
          <div className="relative z-10 mb-8">
            <h3 className="mb-3 text-xl font-bold tracking-tight">
              Gasless Micro-Bets
            </h3>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-gray-400">
              Place instant bets without gas fees via Yellow Network state
              channels on Base. Sub-second execution.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 top-20 flex items-center justify-center">
            <SceneContainer type="channel" />
          </div>
        </div>

        <div className="group relative flex h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50 transition-all duration-500 hover:border-lime-500/20 hover:shadow-2xl hover:shadow-lime-500/10 md:h-full">
          <div className="absolute top-6 right-6 opacity-40">
            <DotPattern className="size-4" />
          </div>
          <div className="pointer-events-none absolute top-[-15%] right-[-25%] h-[140%] w-[90%]">
            <SceneContainer type="settlement" />
          </div>
          <div className="relative z-10 mt-auto w-3/4">
            <h3 className="mb-2 text-lg font-bold tracking-tight">
              AI Settlement
            </h3>
            <p className="text-xs font-medium leading-relaxed text-pulse-gray">
              ERC-8004 agents resolve markets with transparent reasoning.
            </p>
          </div>
        </div>

        <div className="group relative flex h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50 transition-all duration-500 hover:border-lime-500/20 hover:shadow-2xl hover:shadow-lime-500/10 md:h-full">
          <div className="absolute top-6 left-6 opacity-40">
            <DotPattern className="size-4" />
          </div>
          <div className="pointer-events-none absolute top-[-45%] right-[-25%] h-[140%] w-[90%]">
            <SceneContainer type="data" />
          </div>
          <div className="relative z-10 mt-auto w-3/4">
            <h3 className="mb-2 text-lg font-bold tracking-tight">
              Attention Data
            </h3>
            <p className="text-xs font-medium leading-relaxed text-pulse-gray">
              Real-time metrics from social sentiment, search trends, and
              narratives.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-0 bottom-0 -left-16 hidden border-l border-dashed border-gray-200 xl:block" />
      <div className="absolute top-0 bottom-0 -right-16 hidden border-l border-dashed border-gray-200 xl:block" />
    </section>
  );
}
