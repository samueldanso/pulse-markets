"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { useUserStore } from "@/stores/user-store";

const PRIVY_CONFIGURED = !!env.NEXT_PUBLIC_PRIVY_APP_ID;

function PrivyConnectButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const setAddress = useUserStore((state) => state.setAddress);
  const reset = useUserStore((state) => state.reset);
  const [isConnecting, setIsConnecting] = useState(false);

  const wallet = wallets[0];
  const address = wallet?.address;

  useEffect(() => {
    if (address) {
      setAddress(address);
      setIsConnecting(false);
    }
  }, [address, setAddress]);

  function handleConnect() {
    setIsConnecting(true);
    try {
      login();
    } catch {
      setIsConnecting(false);
    }
  }

  if (!ready) {
    return (
      <Button
        disabled
        className="gap-2 rounded-lg bg-pulse-black/50 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/5"
      >
        <svg
          className="size-3 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading...
      </Button>
    );
  }

  if (authenticated && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-pulse-lime-300/20 px-3 py-1 text-xs font-medium text-pulse-black">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button
          onClick={() => {
            logout();
            reset();
          }}
          className="rounded-lg border border-pulse-black/20 bg-white/50 px-4 py-2 text-xs font-medium text-pulse-black shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="gap-2 rounded-lg bg-pulse-black px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/5 transition-opacity hover:bg-black/80 disabled:opacity-70"
    >
      {isConnecting ? (
        <>
          <svg
            className="size-3 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          Connect Wallet
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 1V3.5M6 1C4.5 1 1 1.5 1 6C1 10.5 4.5 11 6 11M6 1C7.5 1 11 1.5 11 6C11 10.5 7.5 11 6 11M6 11V8.5"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </>
      )}
    </Button>
  );
}

export function ConnectButton() {
  if (!PRIVY_CONFIGURED) {
    return (
      <Button
        disabled
        className="gap-2 rounded-lg bg-pulse-black/30 px-5 py-2.5 text-xs font-semibold text-white/50 shadow-lg shadow-black/5"
      >
        Wallet Not Configured
      </Button>
    );
  }

  return <PrivyConnectButton />;
}
