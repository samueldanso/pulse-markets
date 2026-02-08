"use client";

import { useUserStore } from "@/stores/user-store";
import { yellowScanAddressUrl, yellowScanChannelUrl } from "@/lib/explorer-links";

export function ChannelStatus() {
  const { address, channelId, balance } = useUserStore();

  if (!channelId && balance <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-pulse-black/10 px-3 py-1.5">
        <div className="size-2 rounded-full bg-pulse-black/20" />
        <span className="text-xs text-pulse-gray">No channel</span>
      </div>
    );
  }

  const scanUrl = address
    ? yellowScanAddressUrl(address)
    : channelId
      ? yellowScanChannelUrl(channelId)
      : null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-pulse-lime-200 bg-pulse-lime-50 px-3 py-1.5 dark:border-pulse-lime-400/40 dark:bg-pulse-lime-400/20">
      <div className="size-2 animate-pulse rounded-full bg-pulse-lime-400" />
      <span className="text-xs font-medium text-pulse-black dark:text-pulse-lime-100">
        ${balance.toFixed(2)}
      </span>
      {scanUrl && (
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-pulse-lime-600 hover:underline dark:text-pulse-lime-400"
        >
          Scan
        </a>
      )}
    </div>
  );
}
