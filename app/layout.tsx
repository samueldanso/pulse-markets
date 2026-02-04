import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/providers/privy-provider";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/env";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "PulseMarkets — Trade Attention in Real Time",
    template: "%s | PulseMarkets — Trade Attention in Real Time",
  },
  description:
    "PulseMarkets lets users trade attention as an asset in real time, with instant execution and autonomous agent settlement on Yellow.",
  keywords: [
    "PulseMarkets",
    "Prediction Market",
    "Attention",
    "Asset",
    "Viral",
  ],
  metadataBase: new URL("https://pulse-markets.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: env.NEXT_PUBLIC_APP_URL,
    title: "PulseMarkets — Trade Attention in Real Time",
    description:
      "PulseMarkets lets users trade attention as an asset in real time, with instant execution and autonomous agent settlement on Yellow.",
    siteName: "PulseMarkets — Trade Attention in Real Time",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
