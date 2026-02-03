import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Markets", href: "/markets" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Docs", href: "#docs" },
  { label: "FAQ", href: "#FAQ" },
  { label: "X (Twitter)", href: "https://x.com/samueldans0" },
];

export function Navbar() {
  return (
    <nav className="absolute top-0 right-0 left-0 z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6">
      <div className="flex items-center gap-2">
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
      </div>

      <div className="hidden items-center gap-1 rounded-lg border border-white/40 bg-white/50 px-2 py-1.5 shadow-sm backdrop-blur-sm md:flex">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="px-4 py-1.5 text-xs font-medium text-pulse-gray transition-colors hover:text-pulse-black"
          >
            {item.label}
          </a>
        ))}
      </div>

      <Button className="gap-2 rounded-lg bg-pulse-black px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/5 transition-opacity hover:bg-black/80">
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
      </Button>
    </nav>
  );
}
