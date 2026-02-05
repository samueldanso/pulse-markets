/**
 * Tests for Yellow Network pool-based market sessions
 * Verifies proportional distribution math
 */

import { describe, expect, test } from "bun:test";
import type { Hex } from "viem";
import { calculateProportionalDistribution } from "../sessions";
import type { MarketPool } from "../types";

describe("calculateProportionalDistribution", () => {
  test("splits pot proportionally among winners (UP wins)", () => {
    // Setup: UP pool has 60 USDC, DOWN pool has 40 USDC
    const upPool: MarketPool = {
      side: "UP",
      participants: [
        "0x1111111111111111111111111111111111111111" as Hex,
        "0x2222222222222222222222222222222222222222" as Hex,
        "0x3333333333333333333333333333333333333333" as Hex,
      ],
      amounts: [
        BigInt(10_000000), // 10 USDC (6 decimals)
        BigInt(20_000000), // 20 USDC
        BigInt(30_000000), // 30 USDC
      ],
      totalAmount: BigInt(60_000000),
    };

    const downPool: MarketPool = {
      side: "DOWN",
      participants: [
        "0x4444444444444444444444444444444444444444" as Hex,
        "0x5555555555555555555555555555555555555555" as Hex,
      ],
      amounts: [
        BigInt(15_000000), // 15 USDC
        BigInt(25_000000), // 25 USDC
      ],
      totalAmount: BigInt(40_000000),
    };

    // Calculate with 2.5% protocol fee
    const { allocations, distributions } = calculateProportionalDistribution(
      upPool,
      downPool,
      "UP",
      2.5,
    );

    // Total pot = 100 USDC
    // Fee = 2.5 USDC (2.5%)
    // Payout pot = 97.5 USDC

    // User1 (10 USDC stake): 97.5 × (10/60) = 16.25 USDC
    // User2 (20 USDC stake): 97.5 × (20/60) = 32.50 USDC
    // User3 (30 USDC stake): 97.5 × (30/60) = 48.75 USDC

    // Check distributions
    expect(distributions).toHaveLength(5); // 3 winners + 2 losers

    // Winner 1
    expect(distributions[0].participant).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(distributions[0].side).toBe("UP");
    expect(distributions[0].stakeAmount).toBe(BigInt(10_000000));
    expect(distributions[0].payoutAmount).toBe(BigInt(16_250000)); // 16.25 USDC
    expect(distributions[0].profitPercent).toBeCloseTo(62.5, 1);

    // Winner 2
    expect(distributions[1].participant).toBe(
      "0x2222222222222222222222222222222222222222",
    );
    expect(distributions[1].payoutAmount).toBe(BigInt(32_500000)); // 32.50 USDC
    expect(distributions[1].profitPercent).toBeCloseTo(62.5, 1);

    // Winner 3
    expect(distributions[2].participant).toBe(
      "0x3333333333333333333333333333333333333333",
    );
    expect(distributions[2].payoutAmount).toBe(BigInt(48_750000)); // 48.75 USDC
    expect(distributions[2].profitPercent).toBeCloseTo(62.5, 1);

    // Loser 1 (DOWN side)
    expect(distributions[3].participant).toBe(
      "0x4444444444444444444444444444444444444444",
    );
    expect(distributions[3].side).toBe("DOWN");
    expect(distributions[3].payoutAmount).toBe(BigInt(0));
    expect(distributions[3].profitPercent).toBe(-100);

    // Loser 2
    expect(distributions[4].participant).toBe(
      "0x5555555555555555555555555555555555555555",
    );
    expect(distributions[4].payoutAmount).toBe(BigInt(0));
    expect(distributions[4].profitPercent).toBe(-100);

    // Check allocations (for Yellow session closure)
    expect(allocations).toHaveLength(5); // 3 winners + 2 losers
    expect(allocations[0].amount).toBe("16250000");
    expect(allocations[1].amount).toBe("32500000");
    expect(allocations[2].amount).toBe("48750000");
    expect(allocations[3].amount).toBe("0");
    expect(allocations[4].amount).toBe("0");
  });

  test("splits pot proportionally among winners (DOWN wins)", () => {
    const upPool: MarketPool = {
      side: "UP",
      participants: ["0x1111111111111111111111111111111111111111" as Hex],
      amounts: [BigInt(30_000000)],
      totalAmount: BigInt(30_000000),
    };

    const downPool: MarketPool = {
      side: "DOWN",
      participants: [
        "0x2222222222222222222222222222222222222222" as Hex,
        "0x3333333333333333333333333333333333333333" as Hex,
      ],
      amounts: [BigInt(40_000000), BigInt(30_000000)],
      totalAmount: BigInt(70_000000),
    };

    const { distributions } = calculateProportionalDistribution(
      upPool,
      downPool,
      "DOWN",
      2.5,
    );

    // Total pot = 100 USDC, fee = 2.5 USDC, payout = 97.5 USDC
    // DOWN wins: User2 gets 97.5 × (40/70) = 55.71 USDC
    //            User3 gets 97.5 × (30/70) = 41.79 USDC

    expect(distributions).toHaveLength(3);

    // Winner 1 (DOWN)
    expect(distributions[0].side).toBe("DOWN");
    expect(distributions[0].payoutAmount).toBe(BigInt(55_714285)); // ~55.71 USDC
    expect(distributions[0].profitPercent).toBeCloseTo(39.3, 1);

    // Winner 2 (DOWN)
    expect(distributions[1].payoutAmount).toBe(BigInt(41_785714)); // ~41.79 USDC
    expect(distributions[1].profitPercent).toBeCloseTo(39.3, 1);

    // Loser (UP)
    expect(distributions[2].side).toBe("UP");
    expect(distributions[2].payoutAmount).toBe(BigInt(0));
    expect(distributions[2].profitPercent).toBe(-100);
  });

  test("handles zero protocol fee", () => {
    const upPool: MarketPool = {
      side: "UP",
      participants: ["0x1111111111111111111111111111111111111111" as Hex],
      amounts: [BigInt(50_000000)],
      totalAmount: BigInt(50_000000),
    };

    const downPool: MarketPool = {
      side: "DOWN",
      participants: ["0x2222222222222222222222222222222222222222" as Hex],
      amounts: [BigInt(50_000000)],
      totalAmount: BigInt(50_000000),
    };

    const { distributions } = calculateProportionalDistribution(
      upPool,
      downPool,
      "UP",
      0, // No fee
    );

    // Total pot = 100 USDC, no fee, winner gets 100 USDC
    expect(distributions[0].payoutAmount).toBe(BigInt(100_000000));
    expect(distributions[0].profitPercent).toBe(100); // 100% profit
  });

  test("throws error if winning pool is empty", () => {
    const upPool: MarketPool = {
      side: "UP",
      participants: [],
      amounts: [],
      totalAmount: BigInt(0),
    };

    const downPool: MarketPool = {
      side: "DOWN",
      participants: ["0x1111111111111111111111111111111111111111" as Hex],
      amounts: [BigInt(50_000000)],
      totalAmount: BigInt(50_000000),
    };

    expect(() =>
      calculateProportionalDistribution(upPool, downPool, "UP", 2.5),
    ).toThrow("Winning pool has no participants");
  });
});
