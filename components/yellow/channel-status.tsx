"use client";

import { useUserStore } from "@/stores/user-store";

export function ChannelStatus() {
  const { channelId, balance } = useUserStore();

  if (!channelId) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-pulse-black/10 px-3 py-1.5">
        <div className="size-2 rounded-full bg-pulse-black/20" />
        <span className="text-xs text-pulse-gray">No channel</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-pulse-lime-200 bg-pulse-lime-50 px-3 py-1.5">
      <div className="size-2 animate-pulse rounded-full bg-pulse-lime-400" />
      <span className="text-xs font-medium text-pulse-black">
        ${balance.toFixed(2)}
      </span>
    </div>
  );
}
