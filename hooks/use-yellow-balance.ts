"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/user-store";

const POLL_INTERVAL = 10_000;
const USDC_DECIMALS = 6;

export function useYellowBalance(address: string | undefined) {
  const { setBalance, setChannelId } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchBalance() {
      try {
        const res = await fetch(
          `/api/yellow/balance?address=${encodeURIComponent(address!)}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        const balanceUsdc = Number(data.balance) / 10 ** USDC_DECIMALS;
        setBalance(balanceUsdc);

        if (data.channelId) {
          setChannelId(data.channelId);
        } else if (balanceUsdc > 0) {
          setChannelId("custody");
        } else {
          setChannelId(null);
        }
      } catch {
        // silent — polling will retry
      }
    }

    fetchBalance();
    intervalRef.current = setInterval(fetchBalance, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [address, setBalance, setChannelId]);
}
