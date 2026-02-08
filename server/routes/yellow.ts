import { Hono } from "hono";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

import { yellowService } from "@/server/services/yellow-service";
import { CUSTODY_ADDRESS, USDC_ADDRESS } from "@/lib/yellow/constants";

const CUSTODY_BALANCE_ABI = [
  {
    type: "function",
    name: "getAccountsBalances",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "tokens", type: "address[]" },
    ],
    outputs: [{ name: "", type: "uint256[][]" }],
    stateMutability: "view",
  },
] as const;

export const yellowRoutes = new Hono();

yellowRoutes.post("/deposit", async (c) => {
  const body = await c.req.json<{
    userAddress: string;
    amount: string;
    txHash?: string;
  }>();

  if (!body.userAddress || !body.amount) {
    return c.json({ error: "Missing userAddress or amount" }, 400);
  }

  const amountNum = Number(body.amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return c.json({ error: "amount must be a positive number" }, 400);
  }

  try {
    const result = await yellowService.depositForUser(
      body.userAddress,
      body.amount,
      body.txHash,
    );

    return c.json({
      success: true,
      balance: result.balance,
      channelId: result.channelId,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Deposit failed";
    return c.json({ error: msg }, 500);
  }
});

yellowRoutes.post("/withdraw", async (c) => {
  const body = await c.req.json<{
    userAddress: string;
    amount: string;
  }>();

  if (!body.userAddress || !body.amount) {
    return c.json({ error: "Missing userAddress or amount" }, 400);
  }

  const amountNum = Number(body.amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return c.json({ error: "amount must be a positive number" }, 400);
  }

  try {
    const result = await yellowService.withdrawForUser(
      body.userAddress,
      body.amount,
    );

    return c.json({
      success: true,
      balance: result.balance,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Withdrawal failed";
    return c.json({ error: msg }, 400);
  }
});

yellowRoutes.get("/balance", async (c) => {
  const address = c.req.query("address");

  if (!address) {
    return c.json({ error: "Missing address query parameter" }, 400);
  }

  await yellowService.syncCustodyBalance(address);
  const result = yellowService.getUserBalance(address);
  const status = yellowService.getStatus();

  return c.json({
    balance: result.balance,
    channelId: result.channelId,
    connected: status.connected,
    authenticated: status.authenticated,
  });
});

yellowRoutes.get("/custody-balance", async (c) => {
  const address = c.req.query("address");
  if (!address) {
    return c.json({ error: "Missing address query parameter" }, 400);
  }

  try {
    const publicClient = createPublicClient({ chain: base, transport: http() });

    const result = await publicClient.readContract({
      address: CUSTODY_ADDRESS,
      abi: CUSTODY_BALANCE_ABI,
      functionName: "getAccountsBalances",
      args: [[address as `0x${string}`], [USDC_ADDRESS]],
    });

    const balance = result[0]?.[0] ?? BigInt(0);

    return c.json({ balance: balance.toString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to read custody balance";
    return c.json({ error: msg }, 500);
  }
});

yellowRoutes.get("/config", (c) => {
  const config = yellowService.getNetworkConfig();
  return c.json(config);
});
