"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { base, baseSepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";

import { WalletSyncProvider } from "@/components/providers/wallet-sync-provider";
import { env } from "@/env";
import { wagmiConfig } from "@/lib/wagmi-config";

const PRIVY_APP_ID = env.NEXT_PUBLIC_PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const inner = (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  );

  if (!PRIVY_APP_ID) {
    return inner;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#E2F41E",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: base,
        supportedChains: [baseSepolia, base],
      }}
    >
      <WalletSyncProvider>{inner}</WalletSyncProvider>
    </PrivyProvider>
  );
}
