"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { useYellowBalance } from "./use-yellow-balance";

export function useWalletSync() {
  const { user, authenticated } = usePrivy();
  const { setAddress, reset } = useUserStore();

  const walletAddress =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;

  useEffect(() => {
    if (authenticated && walletAddress) {
      setAddress(walletAddress);
    } else {
      reset();
    }
  }, [authenticated, walletAddress, setAddress, reset]);

  useYellowBalance(authenticated ? walletAddress : undefined);
}
