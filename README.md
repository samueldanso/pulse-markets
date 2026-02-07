# PulseMarkets — Instant Attention Trading

> Real-time prediction market for social attention with gasless trades and AI agent settlement - built on Yellow Network.

[![HackMoney](https://img.shields.io/badge/HackMoney-2026-brightgreen)](https://ethglobal.com/events/hackmoney2026)
[![Yellow](https://img.shields.io/badge/Built%20on-Yellow%20Network-yellow)](https://yellow.org)
[![ERC-8004](https://img.shields.io/badge/Settlement-ERC--8004%20AI%20Agents-blue)](https://eips.ethereum.org/EIPS/eip-8004)

[🎥 **Video Demo**]() | [📊 **Pitch Deck**]() | [🌐 **Live Demo**](https://pulsemarkets-fi.vercel.app)

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

### Architecture Components

| Component      | Description                                   |
| -------------- | --------------------------------------------- |
| **Asset**      | Attention / narrative momentum                |
| **Execution**  | Instant & gasless (Yellow State channels SDK) |
| **Settlement** | AI agent with ERC-8004 on-chain identity      |

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
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities                  # Documentation
```

---

## API Endpoints

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/health`           | Health check          |
| GET    | `/api/markets`          | Get all markets       |
| GET    | `/api/markets/:id`      | Get single market     |
| POST   | `/api/settle/:marketId` | Trigger AI settlement |

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

Create `.env` in the project root or copy from `.env.example` .

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

---

## 🚀 Getting Started (Demo)

**Visit the live demo at [pulsemarkets-fi.vercel.app](https://pulsemarkets-fi.vercel.app)**

1. **Connect Wallet** → Connect your wallet using Privy
2. **Deposit USDC** → Deposit to opens Yellow state channel
3. **Browse Markets** → View attention markets
4. **Place Bets** → Click UP/DOWN, enter amount, instant bet confirmation
5. **Repeat** → Place multiple micro-bets across different markets
6. **Market Closes** → Timer expires, "Settle" button appears
7. **AI Settlement** → Agent fetches data, computes result, logs on-chain, displays reasoning
8. **Withdraw** → ithdraw winnings to your wallet, closes channel, receives USDC on-chain

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

```

```
