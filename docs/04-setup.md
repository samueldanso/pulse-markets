# PulseMarkets — Setup Guide

Prerequisites, installation, environment variables, and first run. For Yellow and ERC-8004 agent setup, see [02-yellow-integration.md](02-yellow-integration.md) and [03-8004-agent.md](03-8004-agent.md).

## Prerequisites

- **Bun** — runtime and package manager ([install](https://bun.sh))
- **Node.js 18+** — for tooling compatibility if needed
- **Git**

## Installation

```bash
# Clone the repository
git clone https://github.com/samueldanso/pulse-markets.git
cd pulse-markets

# Install dependencies
bun install
```

## Environment Variables

Create `.env.local` in the project root (or copy from `.env.example` if present).

### Required for full functionality

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID for wallet auth | From [Privy Dashboard](https://dashboard.privy.io) |
| `OPENAI_API_KEY` | OpenAI API key for settlement reasoning | `sk-...` |
| `NEXT_PUBLIC_YELLOW_WS_URL` | Yellow mainnet WebSocket | `wss://clearnet.yellow.com/ws` |
| `NEXT_PUBLIC_YELLOW_SANDBOX_WS_URL` | Yellow sandbox WebSocket | `wss://clearnet-sandbox.yellow.com/ws` |
| `NEXT_PUBLIC_YELLOW_CHAIN_ID` | Chain ID (Base) | `8453` |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC on Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

### Optional / operator

| Variable | Description | When needed |
|----------|-------------|-------------|
| `PRIVATE_KEY` | Operator wallet private key (hex) | Yellow custody, ERC-8004 agent registration |
| `WALLET_ADDRESS` | Same as wallet for `PRIVATE_KEY` | Agent registration, display |
| `LUNARCRUSH_API_KEY` | LunarCrush API key | Real attention data (otherwise mock fallback) |
| `PINATA_JWT` | Pinata JWT | ERC-8004 agent metadata on IPFS (see [03-8004-agent.md](03-8004-agent.md)) |

### Example `.env.local`

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Yellow Network
NEXT_PUBLIC_YELLOW_WS_URL=wss://clearnet.yellow.com/ws
NEXT_PUBLIC_YELLOW_SANDBOX_WS_URL=wss://clearnet-sandbox.yellow.com/ws
NEXT_PUBLIC_YELLOW_CHAIN_ID=8453

# Operator (for custody / agent) — keep secret
PRIVATE_KEY=0x...
WALLET_ADDRESS=0x...

# AI settlement
OPENAI_API_KEY=sk-...

# Data (optional; mock used if missing)
LUNARCRUSH_API_KEY=your_key

# Chain
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## First Run

```bash
# Development server (Next.js + Hono API)
bun dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the markets list. API health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Verify Setup

1. **Frontend** — Homepage loads; market cards and timers visible.
2. **API** — `GET /api/health` returns `{ "status": "ok", "timestamp": ... }`.
3. **Markets** — `GET /api/markets` returns the list of markets.
4. **Wallet** — Connect with Privy (requires valid `NEXT_PUBLIC_PRIVY_APP_ID`).
5. **Settlement** — After a market’s timer expires, `POST /api/settle/:marketId` runs AI settlement (requires `OPENAI_API_KEY`).

## Next Steps

- **Yellow (deposits, channels, betting):** [02-yellow-integration.md](02-yellow-integration.md)
- **ERC-8004 agent (register, reputation, IPFS):** [03-8004-agent.md](03-8004-agent.md)
- **Architecture and data flow:** [01-architecture.md](01-architecture.md)

## Deployment (Vercel)

- Use **Bun** as runtime (e.g. in project settings or `vercel.json`).
- Add the same env vars in the Vercel dashboard (or link env from a `.env` file); never commit `.env.local`.
- Build command: `bun run build` (or default Next.js build).

For a quick demo without Yellow/agent setup, the app can run with Privy + OpenAI only; betting may use simulated state and settlement will still return reasoning.
