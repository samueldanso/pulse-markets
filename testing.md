# Testing & Demo Guide

## Quick Start

```bash
bun run dev
```

Visit http://localhost:3000

---

## Demo Flow (Judge Walkthrough)

This is the exact flow a judge should follow to evaluate the project:

### 1. Landing Page → Markets

1. Visit `/` — see the Pulse Markets landing page
2. Click **"Start Trading"** hero button → navigates to `/markets`

### 2. Connect Wallet

1. Click **"Connect"** in the top-right navbar
2. Sign in via Privy (email, Google, or wallet)
3. Wallet address appears in the navbar

### 3. Deposit USDC (Open State Channel)

1. Click **"Deposit"** button in the navbar
2. Select amount ($10, $50, $100, or custom)
3. Click **"Deposit $X USDC"** → opens a Yellow state channel
4. Channel status shows green dot + balance in the navbar

### 4. Browse & Place Bets

1. On `/markets` — see 3 attention market cards with live countdowns
2. Click a market card → opens `/market/:id` detail page
3. See pool stats: UP/DOWN distribution bar, pool amounts, participant counts
4. Select bet amount ($1, $5, $10, $25, or custom)
5. Click **UP** or **DOWN** → bet placed instantly (no wallet popup!)
6. Pool stats update in real-time
7. Repeat across multiple markets

### 5. View Dashboard

1. Click **"Dashboard"** in the navbar
2. See: channel balance, total staked, open positions count
3. Each bet listed with market, side, amount, and timestamp
4. Click a market name → goes back to market detail

### 6. Market Settlement

1. Wait for a market timer to expire (15 minutes) OR test with curl (see below)
2. On expired market detail page → orange **"Settle Market"** card appears
3. Click **"Settle Market"** → AI agent fetches attention data and resolves
4. See results:
   - **AI Settlement** card: winner (UP/DOWN), reasoning, confidence, data source
   - **ERC-8004 Agent** card: agent ID, operator address, registry link, reputation
5. Click **"View on 8004scan"** → opens agent registry page

### 7. Withdraw

1. Click **"Withdraw"** button in the navbar
2. Enter amount or click **"Max"**
3. Click **"Withdraw $X USDC"** → closes state channel, USDC returned to wallet

---

## API Testing (curl)

### Health Check

```bash
curl http://localhost:3000/api/health
```

### List Markets

```bash
curl http://localhost:3000/api/markets
```

### Get Pool Stats

```bash
curl http://localhost:3000/api/markets/btc-sentiment/pools
```

### Place a Bet

```bash
curl -X POST http://localhost:3000/api/markets/btc-sentiment/bet \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x1234567890abcdef1234567890abcdef12345678","side":"UP","amount":"5000000"}'
```

### Settle a Market

```bash
curl -X POST http://localhost:3000/api/settle/btc-sentiment
```

Settlement response includes:
- `winner`: "UP" or "DOWN"
- `reasoning`: AI-generated explanation
- `confidence`: 0-1 score
- `dataSource`: "lunarcrush" or "mock"
- `distributions`: per-participant payouts
- `agent`: ERC-8004 identity proof (agentId, registryUrl, reputation)

### Agent Discovery (A2A)

```bash
curl http://localhost:3000/api/agent/.well-known/agent-card.json
```

---

## Test Yellow Connection (Standalone)

```bash
bun run scripts/test-full-flow.ts
```

Tests: ClearNode connection, auth, balance, market session, bet placement, distribution math.

**Requirement:** `PRIVATE_KEY` in `.env`

---

## Environment Setup

### Required `.env` Variables

```
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRIVATE_KEY=...               # Operator wallet (funded on Yellow)
WALLET_ADDRESS=...            # Operator address
OPENAI_API_KEY=...            # For AI settlement reasoning
LUNARCRUSH_API_KEY=...        # Optional — falls back to mock data
AGENT_ID=...                  # From register-agent script
PINATA_JWT=...                # For IPFS agent registration
```

### Pre-Demo Setup

1. **Register agent** (if not done): `bun run register-agent`
2. **Set AGENT_ID** in `.env` from registration output
3. **Operator funding**: Sandbox uses test tokens (no deposit needed). For mainnet, run `bun run scripts/deposit-to-custody.ts`

---

## Sandbox vs Mainnet

| Setting | Sandbox | Mainnet |
|---------|---------|---------|
| WebSocket | `wss://clearnet-sandbox.yellow.com/ws` | `wss://clearnet.yellow.com/ws` |
| Chain | Base Sepolia (84532) | Base (8453) |
| Tokens | `ytest.usd` (faucet) | Real USDC |
| Config | `lib/yellow/constants.ts` | Same file, swap values |

---

## What Works Right Now

- ClearNode connection + authentication
- Balance fetching from Yellow
- All API routes (markets, bets, settlement, agent)
- All frontend pages (landing, markets, market detail, dashboard)
- Deposit/withdraw modals (demo simulation)
- ERC-8004 agent identity display after settlement
- Local distribution math (proportional payouts)
- AI reasoning via GPT-4o-mini with mock fallback

## What's Simulated for Demo

- Deposit/withdraw: UI simulates channel open/close (operator pre-funded on backend)
- Positions: stored in client Zustand store (resets on page refresh)
- If Yellow sessions fail, bets still work via in-memory state

## Markets (Demo)

1. **btc-sentiment** — Bitcoin Attention Index (baseline: 65, 5% threshold)
2. **ai-agents-narrative** — AI Agents Narrative Trend (baseline: 12500, 25% threshold)
3. **viral-tweet** — @VitalikButerin Tweet Engagement (baseline: 2500, 10000 absolute)

All markets run on 15-minute timers from server start.
