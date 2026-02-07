# Yellow Network Integration Guide for PulseMarkets

> **UPDATED**: Pool-based prediction market implementation with multi-party app sessions.

## Integration Overview

Yellow Network enables PulseMarkets to offer instant, gasless trading via state channels (ERC-7824 Nitrolite). This is a scalability layer that processes transactions off-chain while maintaining on-chain security.

### Architecture: Pool-Based Prediction Markets

**Key Change from Original Plan:**
- ❌ **OLD**: 1v1 betting (user vs counterparty wallet)
- ✅ **NEW**: Pool-based (N-party betting: multiple users bet UP/DOWN, winners split pot proportionally)

This matches industry standards (Polymarket, Azuro, Trendle) and demonstrates Yellow's multi-party app session capabilities.

### How It Works

**One Yellow App Session Per Market** (not per user):
1. Market created → Yellow app session opened with operator as initial participant
2. Users join dynamically → each bet adds participant to same session
3. UP Pool vs DOWN Pool → users pick sides, stake accumulates
4. Market settles → AI agent determines winner (UP or DOWN)
5. Winners split pot proportionally → `userPayout = (userStake / totalWinningPool) × (totalPot - protocolFee)`
6. Session closes → funds distributed on-chain

### Terminology: UP/DOWN (Not YES/NO)

Inspired by Trendle's trading language:
- **Trade UP**: Bet attention will grow
- **Trade DOWN**: Bet attention will fade

Example: "Bitcoin Attention Index" — trade UP if you think Bitcoin buzz will spike, DOWN if you think it'll fade.

---

## Current Implementation Status

### ✅ Phase 1 Complete: Yellow Core Logic

**Files Implemented:**

```
lib/yellow/
├── types.ts (106 lines)         ✅ Pool-based types (MarketSession, MarketPool, UP/DOWN)
├── sessions.ts (357 lines)      ✅ Multi-party app sessions, proportional distribution
├── client.ts (302 lines)        ✅ Yellow WebSocket + auth
├── deposit.ts (152 lines)       ✅ Custody deposits
├── channels.ts (188 lines)      ✅ Channel management
├── auth.ts (61 lines)           ✅ Session key generation
├── constants.ts (45 lines)      ✅ Yellow config
└── index.ts (66 lines)          ✅ Exports

Total: ~1,277 lines of Yellow integration code
Tests: 4/4 passing (proportional distribution math verified)
```

**Key Functions:**

1. **`createMarketSession(client, marketId, operatorAddr)`**
   - Creates one Yellow app session per market
   - Starts with operator as sole participant
   - Participants added dynamically as users bet

2. **`addBetToMarket(client, session, { userAddress, side: "UP" | "DOWN", amount })`**
   - Adds user to existing market session
   - Updates Yellow app session participants + allocations
   - Prevents duplicate bets (one bet per user per market)

3. **`calculateProportionalDistribution(upPool, downPool, winner, protocolFeePercent)`**
   - Splits pot proportionally among winners
   - Formula: `userPayout = (userStake / totalWinningPool) × (totalPot - protocolFee)`
   - Returns allocations for Yellow session closure

4. **`settleMarketSession(client, session, outcome)`**
   - Submits final allocations to Yellow
   - Closes app session
   - Funds distributed on-chain

---

## Pool-Based Market Model

### Market Structure

```typescript
Market {
  id: "btc-sentiment"
  question: "Bitcoin Attention Index"

  // Yellow session tracking
  sessionId: "0x..." // One session per market

  // UP Pool (bet attention will grow)
  upParticipants: [user1, user2, user3]
  upBets: [10 USDC, 20 USDC, 30 USDC]
  upPool: 60 USDC total

  // DOWN Pool (bet attention will fade)
  downParticipants: [user4, user5]
  downBets: [15 USDC, 25 USDC]
  downPool: 40 USDC total

  totalPot: 100 USDC
}
```

### Settlement Example

**If UP wins (attention spiked 5%+):**
```
Total pot: 100 USDC
Protocol fee: 2.5 USDC (2.5%)
Payout pot: 97.5 USDC

Winners (UP side):
  user1 (10 USDC stake): 97.5 × (10/60) = 16.25 USDC (+62.5% profit)
  user2 (20 USDC stake): 97.5 × (20/60) = 32.50 USDC (+62.5% profit)
  user3 (30 USDC stake): 97.5 × (30/60) = 48.75 USDC (+62.5% profit)

Losers (DOWN side):
  user4: 0 USDC (-100%)
  user5: 0 USDC (-100%)

Protocol: 2.5 USDC (fee)
```

---

## Yellow App Session Structure

### One Session Per Market (Multi-Party)

```typescript
const appDefinition: RPCAppDefinition = {
  protocol: "NitroRPC/0.4",
  participants: [operator, user1, user2, user3, user4, user5], // Grows as users bet
  weights: [10, 18, 18, 18, 18, 18], // Operator 10%, users split 90%
  quorum: 60, // Majority consensus
  challenge: 0, // No dispute period for hackathon
  nonce: Date.now(),
  application: `PulseMarkets:${marketId}`,
}

// Initial allocations (everyone deposits)
const allocations: RPCAppSessionAllocation[] = [
  { participant: operator, asset: "usdc", amount: "0" },       // Operator collects protocol fees
  { participant: user1, asset: "usdc", amount: "10000000" },  // UP: 10 USDC
  { participant: user2, asset: "usdc", amount: "20000000" },  // UP: 20 USDC
  { participant: user3, asset: "usdc", amount: "30000000" },  // UP: 30 USDC
  { participant: user4, asset: "usdc", amount: "15000000" },  // DOWN: 15 USDC
  { participant: user5, asset: "usdc", amount: "25000000" },  // DOWN: 25 USDC
]

// After AI settlement (UP wins)
const finalAllocations: RPCAppSessionAllocation[] = [
  { participant: user1, asset: "usdc", amount: "16250000" },  // Winner
  { participant: user2, asset: "usdc", amount: "32500000" },  // Winner
  { participant: user3, asset: "usdc", amount: "48750000" },  // Winner
  { participant: user4, asset: "usdc", amount: "0" },         // Loser
  { participant: user5, asset: "usdc", amount: "0" },         // Loser
  { participant: operator, asset: "usdc", amount: "2500000" }, // 2.5% protocol fee
]
```

---

## Integration Plan

### Phase 1: Yellow Core Logic ✅ COMPLETE

- ✅ Types redesigned for pool-based model
- ✅ Session logic rewritten for multi-party app sessions
- ✅ Proportional distribution math implemented & tested
- ✅ Market data model updated with pool tracking

### Phase 2: Server Integration (NEXT)

Create server-side Yellow service:

```typescript
// server/services/yellow.ts
class YellowService {
  private client: YellowClient
  private marketSessions: Map<string, MarketSession>

  async initialize(): Promise<void>
  async getMarketSession(marketId: string): Promise<MarketSession>
  async placeBet(params: PoolBetParams): Promise<void>
  async settleMarket(marketId: string, outcome: SettlementOutcome): Promise<void>
}

export const yellowService = new YellowService()
```

API endpoints:
- `POST /api/markets/:id/bet` — Place UP/DOWN bet
- `GET /api/markets/:id/pools` — Get pool sizes
- `POST /api/settle/:marketId` — AI settlement

### Phase 3: Frontend (LATER)

- Market browsing UI
- Betting interface (UP/DOWN buttons)
- Pool stats display
- Settlement display (AI reasoning + payouts)

---

## Key Differences: Pool-Based vs 1v1

| Aspect | 1v1 (Old Plan) | Pool-Based (Current) |
|--------|---------------|----------------------|
| **Sessions** | One per user bet | One per market |
| **Participants** | 2 (user + counterparty) | N (multiple users + operator) |
| **Sides** | User vs counterparty | UP pool vs DOWN pool |
| **Settlement** | Winner-take-all | Proportional distribution |
| **Payout** | Fixed 2x if win | Variable based on pool ratio |
| **Yellow Demo** | Basic 2-party | Advanced multi-party |
| **Industry Match** | Casino-style | Prediction market standard |

---

## Proportional Distribution Formula

```typescript
function calculateProportionalDistribution(
  upPool: MarketPool,
  downPool: MarketPool,
  winner: "UP" | "DOWN",
  protocolFeePercent = 2.5,
) {
  const totalPot = upPool.totalAmount + downPool.totalAmount
  const fee = (totalPot * BigInt(Math.floor(protocolFeePercent * 100))) / BigInt(10000)
  const payoutPot = totalPot - fee

  const winningPool = winner === "UP" ? upPool : downPool

  // Proportional payouts
  const distributions = winningPool.participants.map((participant, idx) => {
    const stakeAmount = winningPool.amounts[idx]
    const payoutAmount = (stakeAmount * payoutPot) / winningPool.totalAmount
    const profitPercent = Number(((payoutAmount - stakeAmount) * BigInt(10000)) / stakeAmount) / 100

    return { participant, stakeAmount, payoutAmount, profitPercent }
  })

  return distributions
}
```

**Verified with tests:**
- ✅ UP wins: 60 USDC beats 40 USDC → 62.5% profit per winner
- ✅ DOWN wins: 70 USDC beats 30 USDC → 39.3% profit per winner
- ✅ Zero fee: winner gets 100% of pot
- ✅ Error handling: throws if winning pool empty

---

## Required Packages

```bash
# Core Yellow SDK (off-chain RPC + on-chain client)
bun add @erc7824/nitrolite yellow-ts

# Already in stack
# viem, wagmi, @privy-io/react-auth
```

**ClearNode Endpoints:**
- Production: `wss://clearnet.yellow.com/ws`
- Sandbox: `wss://clearnet-sandbox.yellow.com/ws`

**Contract Addresses (Base):**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Custody: `0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6`
- Adjudicator: `0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C`

---

## Next Steps

### Phase 2: Server Integration

1. **Create YellowService singleton** (`server/services/yellow.ts`)
   - Initialize Yellow client with operator wallet
   - Manage market sessions Map
   - Expose `placeBet()` and `settleMarket()` methods

2. **Implement AI settlement service** (`server/services/settlement.ts`)
   - Fetch attention data (LunarCrush + mock fallback)
   - Determine outcome (UP or DOWN)
   - Generate AI reasoning (OpenAI gpt-4o-mini)

3. **Wire API endpoints** (`server/routes/markets.ts`, `server/routes/settle.ts`)
   - `POST /api/markets/:id/bet` → calls `yellowService.placeBet()`
   - `POST /api/settle/:marketId` → AI settlement + Yellow closure

### Phase 3: Frontend

4. **Build market UI** (components/markets/)
   - Market browsing (3 cards with pool stats)
   - Betting interface (UP/DOWN buttons)
   - Settlement display (AI reasoning + payout breakdown)

---

## Critical Yellow SDK Gotchas

1. **Amount format**: String, not number (`"10000000"` for 10 USDC, not `10000000`)
2. **Asset identifier**: Use `"usdc"` string (not contract address) in app sessions
3. **Multi-party sessions**: Participants array grows dynamically as users join
4. **Session state**: Off-chain (Yellow manages), we track sessionId only
5. **Proportional math**: Must handle BigInt arithmetic correctly (no floating point)

---

## Reference Resources

- **Official Docs**: https://erc7824.org/
- **Quick Start**: https://erc7824.org/quick_start/
- **Example Repo**: https://github.com/erc7824/nitrolite-example
- **Tutorials** (local): `resources/yellow-sdk-tutorials/`
- **Prediction Market Example**: https://docs.yellow.org/docs/protocol/off-chain/app-sessions/#example-4-prediction-market

---

## Summary: Why Pool-Based Model?

1. **Industry Standard**: Matches Polymarket, Azuro, Trendle architecture
2. **Yellow Demo Value**: Shows multi-party app sessions (not just 2-party)
3. **Better UX**: Users see odds, pool sizes, potential payouts
4. **Real Prediction Market**: Not just casino-style 1v1 betting
5. **Judge Appeal**: "They built a real prediction market with Yellow" > "They built a coin flip game"

**Phase 1 Yellow integration is complete.** Ready for Phase 2 (server) when you approve.
