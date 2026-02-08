# Testing & Demo Guide

## Quick Start

```bash
bun run dev
```

Visit http://localhost:3000

---

## User Guide (A-Z Walkthrough)

Follow these steps from start to finish to experience the full Pulse Markets flow.

### Step 1: Open the App

Go to http://localhost:3000. You'll see the Pulse Markets landing page with a hero section.

Click **"Start Trading"** to go to the markets page.

### Step 2: Connect Your Wallet

Click **"Connect"** in the top-right corner of the navbar. Sign in using email, Google, or an external wallet via Privy. Once connected, your wallet address appears in the navbar.

### Step 3: Deposit USDC

Click the green **"Deposit"** button in the navbar. Pick a quick amount ($10, $50, $100) or type a custom amount. Click **"Deposit $X USDC"**.

What happens behind the scenes:
- The server requests test funds from Yellow's sandbox faucet
- A real state channel opens on Yellow Network
- Your balance appears as a green dot + dollar amount in the navbar

This takes a few seconds. You'll see progress: "Requesting funds..." then "Opening channel...".

### Step 4: Browse Markets

On `/markets`, you'll see 3 attention market cards:
- **Elon Musk Twitter Attention Index** — Will Elon’s Twitter attention rise?
- **AI Agents Narrative Trend** — Is the AI agents narrative growing?
- **Tweet Engagement** — Will a specific tweet go viral?

Each card shows a live countdown timer (15 minutes from server start), pool sizes, and participant counts.

### Step 5: Place a Bet

Click any market card to open its detail page. Choose your bet amount ($1, $5, $10, $25, or custom). Click **UP** (attention will increase) or **DOWN** (attention will decrease). The bet is placed instantly with no wallet popup — it goes through Yellow state channels.

If your balance is too low, the button says **"Deposit first"** and is disabled.

Pool stats update immediately after your bet.

### Step 6: Check Your Dashboard

Click **"Dashboard"** in the navbar. You'll see:
- Channel balance (updates every 10 seconds from the server)
- Total amount staked across markets
- List of all your open positions with market, side, amount, and timestamp

Click any market name to jump back to that market's detail page.

### Step 7: Wait for Settlement

When a market's 15-minute timer expires, go to its detail page. An orange **"Settle Market"** card appears. Click it to trigger AI settlement.

The AI agent:
1. Fetches real attention data (LunarCrush or mock fallback)
2. Compares current vs. baseline values
3. Determines UP or DOWN winner
4. Calculates proportional payouts for all bettors
5. Generates a reasoning explanation

Results show:
- **AI Settlement card**: winner, reasoning, confidence score, data source
- **ERC-8004 Agent card**: on-chain agent identity, operator address, registry link

Click **"View on 8004scan"** to verify the agent on-chain.

### Step 8: Withdraw

Click the **"Withdraw"** button in the navbar. Enter an amount or click **"Max"** for the full balance. Click **"Withdraw $X USDC"** — the state channel is deallocated and funds return to your wallet.

---

## API Testing (curl)

For developers who want to test the backend directly.

### Health Check

```bash
curl http://localhost:3000/api/health
```

Returns Yellow connection status, agent registration, and operator balance.

### Yellow Network Config

```bash
curl http://localhost:3000/api/yellow/config
```

Returns the active network (sandbox/mainnet), chain ID, custody address, faucet URL.

### Deposit (Open Channel)

```bash
curl -X POST http://localhost:3000/api/yellow/deposit \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x1234567890abcdef1234567890abcdef12345678","amount":"10000000"}'
```

Amount is in raw units (6 decimals). `10000000` = $10 USDC.

Returns: `{ success, balance, channelId }`

### Check Balance

```bash
curl "http://localhost:3000/api/yellow/balance?address=0x1234567890abcdef1234567890abcdef12345678"
```

Returns: `{ balance, channelId, connected, authenticated }`

### List Markets

```bash
curl http://localhost:3000/api/markets
```

### Get Pool Stats

```bash
curl http://localhost:3000/api/markets/elon-twitter-attention/pools
```

### Place a Bet

```bash
curl -X POST http://localhost:3000/api/markets/elon-twitter-attention/bet \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x1234567890abcdef1234567890abcdef12345678","side":"UP","amount":"5000000"}'
```

Requires sufficient deposited balance. Returns error if balance < bet amount.

### Settle a Market

```bash
curl -X POST http://localhost:3000/api/settle/elon-twitter-attention
```

Returns: `{ winner, reasoning, confidence, dataSource, distributions, agent }`

### Withdraw

```bash
curl -X POST http://localhost:3000/api/yellow/withdraw \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x1234567890abcdef1234567890abcdef12345678","amount":"5000000"}'
```

Returns: `{ success, balance }`

### Agent Discovery (A2A)

```bash
curl http://localhost:3000/api/agent/.well-known/agent-card.json
```

### Full Flow Test (curl sequence)

```bash
# 1. Deposit 10 USDC
curl -s -X POST http://localhost:3000/api/yellow/deposit \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0xTEST","amount":"10000000"}'

# 2. Check balance (should be 10000000)
curl -s "http://localhost:3000/api/yellow/balance?address=0xTEST"

# 3. Place UP bet for 5 USDC
curl -s -X POST http://localhost:3000/api/markets/elon-twitter-attention/bet \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0xTEST","side":"UP","amount":"5000000"}'

# 4. Check balance (should be 5000000)
curl -s "http://localhost:3000/api/yellow/balance?address=0xTEST"

# 5. Try to bet more than balance (should fail)
curl -s -X POST http://localhost:3000/api/markets/elon-twitter-attention/bet \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0xTEST","side":"DOWN","amount":"99000000"}'

# 6. Withdraw remaining
curl -s -X POST http://localhost:3000/api/yellow/withdraw \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0xTEST","amount":"5000000"}'

# 7. Settle market
curl -s -X POST http://localhost:3000/api/settle/elon-twitter-attention
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
YELLOW_NETWORK=sandbox        # "sandbox" or "mainnet"
```

### Pre-Demo Setup

1. **Register agent** (if not done): `bun run register-agent`
2. **Set AGENT_ID** in `.env` from registration output
3. **Start server**: `bun run dev`
4. Operator connects to Yellow sandbox automatically on first API call

---

## Sandbox vs Mainnet

| Setting | Sandbox | Mainnet |
|---------|---------|---------|
| Env var | `YELLOW_NETWORK=sandbox` | `YELLOW_NETWORK=mainnet` |
| WebSocket | `wss://clearnet-sandbox.yellow.com/ws` | `wss://clearnet.yellow.com/ws` |
| Chain | Sepolia (11155111) | Base (8453) |
| Tokens | `ytest.usd` (faucet-funded) | Real USDC |
| Deposit | Server calls faucet automatically | User deposits on-chain to custody |
| Config endpoint | `GET /api/yellow/config` returns sandbox values | Returns mainnet values |

Switch by setting `YELLOW_NETWORK` in `.env` and restarting the server.

---

## What Works

- Real Yellow ClearNode connection + EIP-712 authentication
- Real channel creation and fund allocation via state channels
- Per-user balance tracking (deposit, deduct on bet, withdraw)
- Balance polling from server every 10 seconds
- Wallet sync on Privy login (persists across page loads via server state)
- Insufficient balance check blocks bets
- All API routes: markets, bets, settlement, agent, yellow deposit/withdraw/balance/config
- All frontend pages: landing, markets, market detail, dashboard
- ERC-8004 agent identity (on-chain registered, displayed after settlement)
- AI reasoning via GPT-4o-mini with mock fallback
- Proportional payout math

## Known Limitations

- Positions stored in client Zustand store (resets on hard refresh — server has balance, not bet history)
- If Yellow WebSocket disconnects mid-session, auto-reconnect on next API call
- Settlement payouts update server balance but not yet credited back to user balance automatically

## Markets (Demo)

1. **elon-twitter-attention** — Elon Musk Twitter Attention Index (baseline: 43467, 25% threshold)
2. **ai-agents-narrative** — AI Agents Narrative Trend (baseline: 12500, 25% threshold)
3. **viral-tweet** — @VitalikButerin Tweet Engagement (baseline: 2500, 10000 absolute)

All markets run on 15-minute timers from server start.
