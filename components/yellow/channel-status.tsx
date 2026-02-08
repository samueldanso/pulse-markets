"use client";

import { useUserStore } from "@/stores/user-store";

export function ChannelStatus() {
  const { channelId, balance } = useUserStore();

  if (!channelId && balance <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-pulse-black/10 px-3 py-1.5">
        <div className="size-2 rounded-full bg-pulse-black/20" />
        <span className="text-xs text-pulse-gray">No channel</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-pulse-lime-200 bg-pulse-lime-50 px-3 py-1.5 dark:border-pulse-lime-400/40 dark:bg-pulse-lime-400/20">
      <div className="size-2 animate-pulse rounded-full bg-pulse-lime-400" />
      <span className="text-xs font-medium text-pulse-black dark:text-pulse-lime-100">
        ${balance.toFixed(2)}
      </span>
    </div>
  );
}
