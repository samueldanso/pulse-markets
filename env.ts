import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string(),
    NEXT_PUBLIC_CLEARNODE_WS_URL: z.string().optional(),
    NEXT_PUBLIC_CLEARNODE_SANDBOX_WS_URL: z.string().optional(),
    NEXT_PUBLIC_USDC_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_YELLOW_CHAIN_ID: z.string().optional(),
  },
  server: {
    PRIVATE_KEY: z.string().optional(),
    WALLET_ADDRESS: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    LUNARCRUSH_API_KEY: z.string().optional(),
    PINATA_JWT: z.string().optional(),
    AGENT_ID: z.string().optional(),
    YELLOW_NETWORK: z.enum(["sandbox", "mainnet"]).default("sandbox"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_CLEARNODE_WS_URL: process.env.NEXT_PUBLIC_CLEARNODE_WS_URL,
    NEXT_PUBLIC_CLEARNODE_SANDBOX_WS_URL:
      process.env.NEXT_PUBLIC_CLEARNODE_SANDBOX_WS_URL,
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    NEXT_PUBLIC_YELLOW_CHAIN_ID: process.env.NEXT_PUBLIC_YELLOW_CHAIN_ID,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LUNARCRUSH_API_KEY: process.env.LUNARCRUSH_API_KEY,
    PINATA_JWT: process.env.PINATA_JWT,
    AGENT_ID: process.env.AGENT_ID,
    YELLOW_NETWORK: process.env.YELLOW_NETWORK,
  },
});
