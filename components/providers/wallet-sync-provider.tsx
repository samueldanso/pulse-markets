"use client";

import { useWalletSync } from "@/hooks/use-wallet-sync";

export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  useWalletSync();
  return <>{children}</>;
}
