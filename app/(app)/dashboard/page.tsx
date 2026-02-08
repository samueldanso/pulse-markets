"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  yellowScanAddressUrl,
  yellowScanChannelUrl,
} from "@/lib/explorer-links";
import { useUserStore } from "@/stores/user-store";

export default function DashboardPage() {
  const { authenticated, login } = usePrivy();
  const { address, balance, channelId, positions } = useUserStore();

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-pulse-black">Dashboard</h1>
        <p className="mb-6 text-pulse-gray">
          Connect your wallet to view your positions and balance.
        </p>
        <Button
          onClick={() => login()}
          className="bg-pulse-black text-white hover:bg-pulse-black/90"
        >
          Connect Wallet
        </Button>
      </main>
    );
  }

  const totalStaked = positions.reduce((sum, p) => sum + p.amount, 0);
  const openPositions = positions.filter((p) => !p.settled);
  const settledPositions = positions.filter((p) => p.settled);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold text-pulse-black">Dashboard</h1>

      {/* Stats overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-pulse-black/5">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-pulse-gray">
              Channel Balance
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-pulse-black">
              ${balance.toFixed(2)}
            </p>
            {channelId && (
              <p className="mt-1 text-[10px] text-pulse-gray">
                Channel: {channelId.slice(0, 16)}...
              </p>
            )}
            {(address || channelId) && (
              <p className="mt-2">
                <a
                  href={address ? yellowScanAddressUrl(address) : channelId ? yellowScanChannelUrl(channelId) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-pulse-lime-600 hover:underline dark:text-pulse-lime-400"
                >
                  View on Yellow Scan →
                </a>
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-pulse-black/5">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-pulse-gray">Total Staked</p>
            <p className="mt-1 font-mono text-2xl font-bold text-pulse-black">
              ${totalStaked.toFixed(2)}
            </p>
            <p className="mt-1 text-[10px] text-pulse-gray">
              Across {positions.length} bets
            </p>
          </CardContent>
        </Card>
        <Card className="border-pulse-black/5">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-pulse-gray">
              Open Positions
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-pulse-black">
              {openPositions.length}
            </p>
            <p className="mt-1 text-[10px] text-pulse-gray">
              {settledPositions.length} settled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Positions list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-pulse-black">
          Your Positions
        </h2>

        {positions.length === 0 ? (
          <Card className="border-pulse-black/5">
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-sm text-pulse-gray">
                No positions yet. Place your first bet!
              </p>
              <Button
                asChild
                className="bg-pulse-lime-400 text-pulse-black hover:bg-pulse-lime-500"
              >
                <Link href="/markets">Browse Markets</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {positions.map((position) => (
              <Card key={position.id} className="border-pulse-black/5">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        position.side === "UP"
                          ? "bg-pulse-lime-400 text-pulse-black"
                          : "bg-pulse-black/20 text-white"
                      }
                    >
                      {position.side}
                    </Badge>
                    <div>
                      <Link
                        href={`/market/${position.marketId}`}
                        className="text-sm font-medium text-pulse-black hover:underline"
                      >
                        {position.marketId}
                      </Link>
                      <p className="text-xs text-pulse-gray">
                        {new Date(position.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-pulse-black">
                      ${position.amount.toFixed(2)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${position.settled ? "border-pulse-lime-300 text-pulse-lime-700" : "border-pulse-black/10 text-pulse-gray"}`}
                    >
                      {position.settled ? "Settled" : "Open"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
