# PulseMarkets — Instant Attention Trading

> Real-time prediction market for social attention with gasless trades and AI agent settlement - built on Yellow Network.

[![HackMoney](https://img.shields.io/badge/HackMoney-2026-brightgreen)](https://ethglobal.com/events/hackmoney2026)
[![Yellow](https://img.shields.io/badge/Built%20on-Yellow%20Network-yellow)](https://yellow.org)
[![ERC-8004](https://img.shields.io/badge/Settlement-ERC--8004%20AI%20Agents-blue)](https://eips.ethereum.org/EIPS/eip-8004)

[🎥 **Video Demo**]() | [📊 **Pitch Deck**]() | [🌐 **Live Demo**](https://pulsemarkets-fi.vercel.app)

---

## 🔍 Testing Examples

You can verify Yellow and ERC-8004 integration without running the app:

| What                                          | Link                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Yellow Scan** (state channels, sessions)    | [yellowscan.io](https://yellowscan.io) — search by **address**, **channel ID**, or **session ID** to see activity.         |
| **Sample session** (app session from testing) | [Session on Yellow Scan](https://yellowscan.io/session/0x940b92cfe440f51f3bd9e7d01ba8fb1ae681e20ba785c89c79ac3fc15b421048) |
| **Sample wallet** (wallet from testing)       | [Wallet on Yellow Scan](https://yellowscan.io/https://yellowscan.io/address/0xA44Fa8Ad3e905C8AB525cd0cb14319017F1e04e5)    |
| **ERC-8004 Agent** (settlement agent on Base) | [Agent on 8004scan](https://www.8004scan.io/agents/base/2373) — on-chain identity and reputation.                          |

In the app, the **Dashboard** shows a **View on Yellow Scan** link (by your wallet address) so you can see your sessions and channels. Settlement responses include an `agent` object with `registryUrl` pointing to 8004scan.

---

## 🔮 Overview

PulseMarkets is a real-time prediction market where users trade social attention and narratives instead of traditional outcomes. Built on Yellow Network's state channels (ERC-7824) with autonomous AI agent settlement (ERC-8004), PulseMarkets enables instant, gasless micro-bets on sentiment shifts, narrative momentum, and viral potential.

**Core Idea:** Attention is the new alpha. Pulse lets you trade it — instantly, settled by AI, powered by Yellow.

---

## ⚠️ Problem

Crypto traders already speculate on narratives informally (“buy the rumor”), but no native market exists for trading attention as an asset. Traditional prediction markets suffer from three key limitations:

- **High execution friction** — Gas fees make micro-bets impractical
- **Slow settlement** — Manual or centralized oracles delay outcomes
- **Limited expressiveness** — Binary outcomes fail to capture hype, sentiment, and mindshare dynamics

---

## 💡 Solution

PulseMarkets introduces a new market primitive: **attention prediction markets**, built around three core innovations:

1. **New Asset Class** — Trade sentiment shifts, narrative momentum, hype cycles, and viral potential instead of static binary events
2. **Instant Execution** — Yellow Network state channels (ERC-7824) enable gasless, sub-second trading with no wallet popups
3. **Autonomous Agent Settlement** — An ERC-8004 settlement agent fetches real-time attention data, applies deterministic rules, resolves markets with transparent reasoning, and builds verifiable on-chain reputation

## ⚡ Key Features

- **Attention Markets** - Binary UP/DOWN markets on social attention metrics (sentiment, narratives, virality) with clear resolution criteria and timed expiry.
- **Instant, Gasless Betting** – Deposit once and place unlimited micro-bets via Yellow Network state channels (ERC-7824) with sub-second execution and no wallet popups.
- **AI Settlement Agent (ERC-8004)** – Autonomous agent resolves markets using real attention data, applies deterministic rules, publishes transparent reasoning, and tracks on-chain reputation.
- **Transparent Resolution** – Every market settles with verifiable data sources, explainable AI output, and publicly auditable agent reputation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Markets │  │   Bet    │  │ Positions│  │ Deposit  │  │ Withdraw │  │
│  │  List    │  │ Interface│  │Dashboard │  │  Flow    │  │  Flow    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────────┼─────────────┼────────┘
        │             │             │             │             │
        └─────────────┴──────┬──────┴─────────────┴─────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      YELLOW STATE CHANNEL LAYER                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Off-chain State (managed via Nitrolite SDK)                     │   │
│  │  • User balance (USDC)                                           │   │
│  │  • Active positions: { marketId, side, amount }[]                │   │
│  │  • Bet history                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SDK: @erc7824/nitrolite                                               │
│  Connection: WebSocket ←→ wss://clearnet.yellow.com/ws                 │
│  Standard: ERC-7824 State Channels                                     │
└─────────────────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                      │
          ▼                                      ▼
┌─────────────────────────────┐      ┌─────────────────────────┐
│   AI SETTLEMENT AGENT       │      │    ON-CHAIN LAYER       │
│   (Hono API + ERC-8004)     │      │                         │
│                             │      │  Chain: Base             │
│  ┌─────────┐                │      │  Token: USDC            │
│  │  Data   │ LunarCrush    │      │  Yellow Custody +       │
│  │  Fetch  │ Public APIs   │      │  Adjudicator            │
│  └────┬────┘                │      │                         │
│       │                     │      │  ERC-8004 Registry:     │
│  ┌────▼────┐                │      │  • Agent identity       │
│  │  Rule   │ Threshold     │      │  • Settlement logs      │
│  │  Engine │ Comparison    │      │  • Reputation score     │
│  └────┬────┘                │      │                         │
│       │                     │      └─────────────────────────┘
│  ┌────▼────┐                │
│  │ Output  │ UP/DOWN +     │
│  │         │ Reasoning     │
│  └────┬────┘                │
│       │                     │
│  ┌────▼────┐                │
│  │ERC-8004 │ Log On-Chain  │
│  │ Registry│ + Update Rep  │
│  └─────────┘                │
└─────────────────────────────┘
```

---

## User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CONNECT   │────►│   DEPOSIT   │────►│    BET      │────►│   SETTLE    │
│   WALLET    │     │   (Yellow)  │     │  (Instant)  │     │  & WITHDRAW │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
   Privy auth      Opens state         Off-chain,           AI resolves,
   (embedded       channel with        gasless,             on-chain
   or external)    USDC deposit        instant              payout
```

---

## 🛠️ Tech Stack

| Layer          | Technology                       | Purpose                              |
| -------------- | -------------------------------- | ------------------------------------ |
| **Runtime**    | Bun                              | Package manager + runtime            |
| **Frontend**   | Next.js 16, React 19, TypeScript | App framework                        |
| **API**        | Hono (inside Next.js)            | API routes with clean DX             |
| **Styling**    | Tailwind CSS v4, shadcn/ui       | UI components                        |
| **Wallet**     | Privy, wagmi, viem               | Auth + wallet connection             |
| **State**      | Zustand                          | Client state management              |
| **WebSocket**  | yellow-ts                        | Yellow ClearNode WebSocket transport |
| **Yellow SDK** | @erc7824/nitrolite               | State channel management (ERC-7824)  |
| **AI**         | AI SDK + OpenAI (gpt-4o-mini)    | Settlement reasoning                 |
| **Data**       | LunarCrush API (free tier)       | Real-time attention metrics          |
| **Chain**      | Base                             | Settlement chain                     |
| **Token**      | USDC                             | Betting currency                     |
| **Linter**     | Biome                            | Linting + formatting                 |
| **Deployment** | Vercel (Bun runtime)             | Hosting                              |

---

## Project Structure

```
pulse-markets/
├── app/
│   ├── (app)/                    # Authenticated app shell (AppNavbar)
│   │   ├── dashboard/page.tsx    # User balance, positions, channel status
│   │   ├── leaderboard/page.tsx   # Leaderboard (coming soon)
│   │   ├── market/[id]/page.tsx   # Market detail, bet UI, settlement display
│   │   ├── markets/page.tsx      # Market list with cards
│   │   └── layout.tsx
│   ├── api/[[...route]]/route.ts  # Hono catch-all → server
│   ├── page.tsx                  # Landing (hero, features, how it works)
│   ├── layout.tsx, globals.css, error.tsx, not-found.tsx
│   ├── manifest.ts, robots.ts, sitemap.ts
│   └── favicon.ico
├── components/
│   ├── landing/                  # Hero, features, how-it-works, navbar, partners
│   ├── markets/                  # MarketCard, BetInterface, SparklineChart
│   ├── yellow/                   # ChannelStatus, DepositModal, WithdrawModal
│   ├── wallet/                   # ConnectButton (Privy)
│   ├── providers/                # PrivyProvider, WalletSyncProvider
│   ├── scene/                    # 3D scene (materials, models, scene-container)
│   ├── theme/                    # ThemeToggle
│   └── ui/                       # shadcn (button, card, badge, dialog, etc.)
├── server/
│   ├── index.ts                  # Hono app, route mounting, /api/health
│   ├── routes/
│   │   ├── agent.ts              # ERC-8004 agent card + A2A JSON-RPC
│   │   ├── markets.ts            # GET/POST markets, pools, bet
│   │   ├── settle.ts             # POST settle/:marketId (AI + Yellow)
│   │   └── yellow.ts             # deposit, withdraw, balance, custody-balance, config
│   └── services/
│       ├── agent-identity.ts     # ERC-8004 registry, getAgentProof, getAgentCard
│       ├── attention.ts          # getAttentionValue (LunarCrush + mock)
│       ├── settlement.ts         # settleMarket (rules + OpenAI reasoning)
│       └── yellow-service.ts     # Yellow singleton: placeBet, settleMarket, deposit/withdraw
├── lib/
│   ├── yellow/                   # Yellow Network / Nitrolite integration (see docs/02-yellow-integration.md)
│   │   ├── auth.ts               # generateSessionKey, getSessionExpiry (ECDSA session keys)
│   │   ├── channels.ts           # createChannel, getOrCreateChannel, allocate/deallocate
│   │   ├── client.ts             # YellowClient: WebSocket, auth, sendMessage, fetchLedgerBalances
│   │   ├── constants.ts          # CLEARNODE_URL, YELLOW_ASSET, CUSTODY/ADJUDICATOR, USDC, SESSION_DURATION
│   │   ├── deposit.ts            # depositToCustody, getCustodyBalance, getWalletUSDCBalance
│   │   ├── sessions.ts           # createMarketSession, addBetToMarket, calculateProportionalDistribution, settleMarketSession
│   │   ├── types.ts              # MarketSession, MarketPool, PoolBetParams, SettlementOutcome, etc.
│   │   ├── index.ts              # Re-exports
│   │   └── __tests__/sessions.test.ts
│   ├── erc-8004/                 # ABIs and constants for Identity/Reputation registries
│   ├── sparkline.ts              # Sparkline data generation for market charts
│   ├── utils.ts                  # cn() and other helpers
│   └── wagmi-config.ts           # Wagmi chain config
├── data/
│   └── markets.ts                # createMarkets(), DEMO_DURATION_MS, getMarketById
├── stores/
│   ├── user-store.ts             # address, balance, channelId, positions (Zustand)
│   └── market-store.ts
├── types/
│   └── index.ts                  # Market, Position, BetSide, etc.
├── hooks/
│   ├── use-wallet-sync.ts        # Sync Privy address to user store
│   └── use-yellow-balance.ts     # Poll /api/yellow/balance
├── scripts/
│   ├── register-agent.ts         # ERC-8004 agent registration (Base)
│   ├── post-feedback.ts          # Reputation feedback (different wallet)
│   ├── test-yellow-connection.ts
│   ├── test-yellow-client.ts
│   └── test-full-flow.ts
├── docs/                         # 00-overview, 01-architecture, 02-yellow-integration, 03-8004-agent, 04-setup
├── resources/
│   └── demo-script.md            # Hackathon demo flow
├── env.ts                        # T3 env validation (client + server vars)
├── next.config.ts, tsconfig.json, biome.json, package.json
└── README.md
```

---

## API Endpoints

All routes are under `/api`. Base path is set in `server/index.ts`.

| Method                      | Endpoint                                 | Description                                                                                                                                                                    |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Health**                  |                                          |                                                                                                                                                                                |
| GET                         | `/api/health`                            | Health check; returns `status`, `timestamp`, `yellow` (connected, authenticated), `agent` (registered, agentId)                                                                |
| **Markets**                 |                                          |                                                                                                                                                                                |
| GET                         | `/api/markets`                           | List all markets (id, question, pools, status, result, etc.)                                                                                                                   |
| GET                         | `/api/markets/:id`                       | Single market with full detail (upBets, downBets, etc.)                                                                                                                        |
| GET                         | `/api/markets/:id/pools`                 | Pool stats: upPool, downPool, totalPot, upPercentage, downPercentage, upParticipants, downParticipants                                                                         |
| POST                        | `/api/markets/:id/bet`                   | Place bet. Body: `{ userAddress, side: "UP" \| "DOWN", amount }`. Returns `success`, `bet`, `pools`                                                                            |
| **Settlement**              |                                          |                                                                                                                                                                                |
| POST                        | `/api/settle/:marketId`                  | Trigger AI settlement. Fetches attention data, runs rules, generates reasoning, settles Yellow session, credits winners. Returns winner, reasoning, distributions, agent proof |
| **Yellow (state channels)** |                                          |                                                                                                                                                                                |
| POST                        | `/api/yellow/deposit`                    | Credit user after on-chain deposit. Body: `{ userAddress, amount, txHash? }`. Returns balance, channelId                                                                       |
| POST                        | `/api/yellow/withdraw`                   | Debit user (withdraw from channel). Body: `{ userAddress, amount }`. Returns balance                                                                                           |
| GET                         | `/api/yellow/balance?address=`           | Get user's channel balance and status (syncs from custody). Returns balance, channelId, connected, authenticated                                                               |
| GET                         | `/api/yellow/custody-balance?address=`   | On-chain custody contract balance for address (USDC)                                                                                                                           |
| GET                         | `/api/yellow/config`                     | Yellow network config (chain, custody, etc.)                                                                                                                                   |
| **Agent (ERC-8004)**        |                                          |                                                                                                                                                                                |
| GET                         | `/api/agent/.well-known/agent-card.json` | Agent card for A2A discovery                                                                                                                                                   |
| POST                        | `/api/agent/a2a`                         | JSON-RPC 2.0 (e.g. message/send, tasks/get) for agent-to-agent messaging                                                                                                       |

---

## 🚀 Setup

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

Validated via `env.ts` (T3 env). Create `.env` in the project root.

| Variable                               | Required | Description                                                                                    |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Yes      | App URL (e.g. `https://pulsemarkets-fi.vercel.app` or `http://localhost:3000`)                 |
| `NEXT_PUBLIC_PRIVY_APP_ID`             | Yes      | Privy app ID ([dashboard](https://dashboard.privy.io))                                         |
| `NEXT_PUBLIC_CLEARNODE_WS_URL`         | No       | Yellow mainnet WebSocket (default from `lib/yellow/constants`: `wss://clearnet.yellow.com/ws`) |
| `NEXT_PUBLIC_CLEARNODE_SANDBOX_WS_URL` | No       | Yellow sandbox WebSocket (`wss://clearnet-sandbox.yellow.com/ws`)                              |
| `NEXT_PUBLIC_USDC_ADDRESS`             | No       | USDC on Base (default in constants)                                                            |
| `NEXT_PUBLIC_YELLOW_CHAIN_ID`          | No       | Chain ID for Yellow (Base = 8453)                                                              |
| `PRIVATE_KEY`                          | No\*     | Operator wallet private key (hex). \*Required for Yellow deposits/betting and ERC-8004 agent   |
| `WALLET_ADDRESS`                       | No\*     | Same as wallet for `PRIVATE_KEY`. \*Required for agent registration                            |
| `OPENAI_API_KEY`                       | No\*     | OpenAI API key. \*Required for AI settlement reasoning                                         |
| `LUNARCRUSH_API_KEY`                   | No       | LunarCrush API key (mock used if missing)                                                      |
| `PINATA_JWT`                           | No       | For ERC-8004 agent metadata on IPFS                                                            |
| `AGENT_ID`                             | No       | ERC-8004 agent ID after registration                                                           |
| `YELLOW_NETWORK`                       | No       | `sandbox` or `mainnet` (default: `sandbox`)                                                    |

**Example `.env`:**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Yellow (optional; lib/yellow/constants has defaults)
NEXT_PUBLIC_CLEARNODE_WS_URL=wss://clearnet.yellow.com/ws
NEXT_PUBLIC_CLEARNODE_SANDBOX_WS_URL=wss://clearnet-sandbox.yellow.com/ws
NEXT_PUBLIC_YELLOW_CHAIN_ID=8453
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Operator — keep secret
PRIVATE_KEY=0x...
WALLET_ADDRESS=0x...

# AI settlement
OPENAI_API_KEY=sk-...

# Optional
LUNARCRUSH_API_KEY=your_key
YELLOW_NETWORK=sandbox
```

## First Run

```bash
# Development server (Next.js + Hono API)
bun dev
```

---

## 🚀 Getting Started (Demo)

**Visit the live demo at [pulsemarkets-fi.vercel.app](https://pulsemarkets-fi.vercel.app)**

1. **Connect Wallet** → Connect your wallet using Privy
2. **Deposit USDC** → Deposit opens Yellow state channel
3. **Browse Markets** → View attention markets
4. **Place Bets** → Click UP/DOWN, enter amount, instant bet confirmation
5. **Repeat** → Place multiple micro-bets across different markets
6. **Market Closes** → Timer expires, "Settle" button appears
7. **AI Settlement** → Agent fetches data, computes result, logs on-chain, displays reasoning (auto-triggers when timer expires)
8. **Withdraw** → Withdraw winnings to your wallet, closes channel, receives USDC on-chain

---

## 🚀 Roadmap

### Phase 1: MVP Hackathon (Current)

- ✅ Yellow Network state channel integration (ERC-7824)
- ✅ ERC-8004 AI settlement agent with on-chain identity
- ✅ Binary UP/DOWN attention markets
- ✅ Real-time LunarCrush data integration
- ✅ Privy wallet authentication
- ✅ Instant gasless betting UX

### Phase 2: Beta (Post-Hackathon)

- [ ] Multi-market portfolio dashboard and leaderboard
- [ ] Multi-agent sytem for social sentiment analysis
- [ ] Agent to agent payments via x402
- [ ] Cross-chain support

---

## 📚 Additional Documentation

All detailed docs are in the `/docs` directory:

| Resource                                                 | Description                                   |
| :------------------------------------------------------- | :-------------------------------------------- |
| [**Introduction**](/docs/00-overview.md)                 | Overview, features, problem & solution        |
| [**Getting Started**](/docs/04-setup.md)                 | Setup guide, env configuration, and first run |
| [**Architecture**](/docs/01-architecture.md)             | System design, layers, and data flow diagrams |
| [**Yellow Integration**](/docs/02-yellow-integration.md) | Yellow SDK State Channels implementation      |
| [**ERC-8004 Agents**](/docs/03-8004-agent.md)            | AI agent settlement system                    |
| [**Testing**](/docs/05-testing.md)                       | Testing guide                                 |

---

## 🤝 Contributing

This is a hackathon project. For questions or suggestions, please open an issue.

---

## 📄 License

MIT

---

## 🏆 Built for HackMoney 2026

**Sponsor Track:**

- Yellow Network SDK

**Team:**

- **Samuel Danso - Full Stack Product Engineer** – `me.samueldanso@gmail.com`

**Value Proposition:**

> PulseMarkets turns attention into a tradable asset with instant, gasless micro-bets powered by Yellow Network state channels and autonomous AI settlement via ERC-8004 agents. We're financializing the metrics that actually drive crypto markets — sentiment, hype, and viral momentum.

**Key Innovation:**

- **Attention as a Market Primitive** — First platform to enable real-time trading on social attention metrics instead of traditional binary outcomes
- **Zero-Friction Execution** — Yellow Network state channels eliminate gas fees and enable high-frequency micro-betting with instant confirmation
- **Transparent AI Settlement** — ERC-8004 autonomous agents provide verifiable, on-chain settlement with transparent reasoning and reputation scoring
