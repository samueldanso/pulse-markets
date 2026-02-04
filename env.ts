import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string(),
    NEXT_PUBLIC_YELLOW_WS_URL: z.string().optional(),
    NEXT_PUBLIC_YELLOW_SANDBOX_WS_URL: z.string().optional(),
    NEXT_PUBLIC_YELLOW_CHAIN_ID: z.string().optional(),
    NEXT_PUBLIC_USDC_ADDRESS: z.string().optional(),
  },
  server: {
    HOUSE_WALLET_PRIVATE_KEY: z.string().optional(),
    HOUSE_WALLET_ADDRESS: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    LUNARCRUSH_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_YELLOW_WS_URL: process.env.NEXT_PUBLIC_YELLOW_WS_URL,
    NEXT_PUBLIC_YELLOW_SANDBOX_WS_URL:
      process.env.NEXT_PUBLIC_YELLOW_SANDBOX_WS_URL,
    NEXT_PUBLIC_YELLOW_CHAIN_ID: process.env.NEXT_PUBLIC_YELLOW_CHAIN_ID,
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    HOUSE_WALLET_PRIVATE_KEY: process.env.HOUSE_WALLET_PRIVATE_KEY,
    HOUSE_WALLET_ADDRESS: process.env.HOUSE_WALLET_ADDRESS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LUNARCRUSH_API_KEY: process.env.LUNARCRUSH_API_KEY,
  },
});
