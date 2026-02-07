"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ConnectButton } from "@/components/wallet/connect-button";
import { ChannelStatus } from "@/components/yellow/channel-status";
import { DepositModal } from "@/components/yellow/deposit-modal";
import { WithdrawModal } from "@/components/yellow/withdraw-modal";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 8C2 8 4 4 6 4C8 4 8 8 10 8C12 8 12 2 14 2C16 2 16 10 18 10C20 10 22 6 22 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12C2 12 4 8 6 8C8 8 8 12 10 12C12 12 12 6 14 6C16 6 16 14 18 14C20 14 22 10 22 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 16C2 16 4 12 6 12C8 12 8 16 10 16C12 16 12 10 14 10C16 10 16 18 18 18C20 18 22 14 22 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-pulse-black">
            Pulse
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-pulse-black/5 text-pulse-black"
                  : "text-pulse-gray hover:text-pulse-black",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ChannelStatus />
        <DepositModal />
        <WithdrawModal />
        <ThemeToggle />
        <ConnectButton />
      </div>
    </nav>
  );
}
