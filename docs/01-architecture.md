# PulseMarkets — Architecture

System design, layers, data flow, and project structure.

## High-Level Architecture

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
│                      YELLOW STATE CHANNEL LAYER                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Off-chain State (managed via Nitrolite SDK)                     │   │
│  │  • User balance (USDC)                                           │   │
│  │  • Active positions: { marketId, side, amount }[]                 │   │
│  │  • Bet history                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SDK: @erc7824/nitrolite                                                │
│  Connection: WebSocket ←→ wss://clearnet.yellow.com/ws                  │
│  Standard: ERC-7824 State Channels                                      │
└─────────────────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                      │
          ▼                                      ▼
┌─────────────────────────────┐      ┌─────────────────────────┐
│   AI SETTLEMENT AGENT       │      │    ON-CHAIN LAYER        │
│   (Hono API + ERC-8004)     │      │                         │
│                             │      │  Chain: Base             │
│  ┌─────────┐                │      │  Token: USDC            │
│  │  Data   │ LunarCrush     │      │  Yellow Custody +       │
│  │  Fetch  │ Public APIs    │      │  Adjudicator            │
│  └────┬────┘                │      │                         │
│       │                     │      │  ERC-8004 Registry:     │
│  ┌────▼────┐                │      │  • Agent identity       │
│  │  Rule   │ Threshold      │      │  • Settlement logs      │
│  │  Engine │ Comparison     │      │  • Reputation score     │
│  └────┬────┘                │      │                         │
│       │                     │      └─────────────────────────┘
│  ┌────▼────┐                │
│  │ Output  │ UP/DOWN +      │
│  │         │ Reasoning      │
│  └────┬────┘                │
│       │                     │
│  ┌────▼────┐                │
│  │ERC-8004 │ Log On-Chain   │
│  │ Registry│ + Update Rep   │
│  └─────────┘                │
└─────────────────────────────┘
```

## Component Summary

| Component      | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| **Asset**      | Attention / narrative momentum (not price)                  |
| **Execution**  | Instant & gasless via Yellow state channels (Nitrolite SDK) |
| **Settlement** | AI agent with ERC-8004 on-chain identity and reputation     |

## Data Flow

### Betting Flow

1. User connects wallet (Privy) and deposits USDC into Yellow custody.
2. Yellow opens/joins app session for the market; balance is tracked off-chain.
3. User places bet (UP or DOWN) → allocation updated in session state; no on-chain tx.
4. Balance and positions update instantly in the UI (Zustand + Yellow session state).

### Settlement Flow

1. Market timer expires → “Settle” becomes available (or auto-triggers on the market page).
2. Client calls `POST /api/settle/:marketId`.
3. Server: fetch attention data (LunarCrush / fallback), run threshold rules → UP/DOWN.
4. Server: generate AI reasoning (OpenAI), optionally log to ERC-8004 registry.
5. Payouts computed: `userPayout = (userStake / totalWinningPool) × (totalPot - protocolFee)`.
6. Winners’ balances are credited in the Yellow service state; Yellow session can close and funds move on-chain on withdraw.

## Tech Stack (By Layer)

| Layer          | Technology                           | Purpose                    |
| -------------- | ------------------------------------ | -------------------------- |
| **Runtime**    | Bun                                  | Package manager + runtime  |
| **Frontend**   | Next.js 15, React 19, TypeScript     | App framework              |
| **API**        | Hono (inside Next.js catch-all)      | API routes                 |
| **Styling**    | Tailwind CSS v4, shadcn/ui           | UI                         |
| **Wallet**     | Privy, wagmi, viem                   | Auth + wallet              |
| **State**      | Zustand                              | Client state               |
| **WebSocket**  | yellow-ts                            | Yellow ClearNode transport |
| **Yellow SDK** | @erc7824/nitrolite                   | State channels (ERC-7824)  |
| **AI**         | AI SDK + OpenAI (gpt-4o-mini)        | Settlement reasoning       |
| **Data**       | LunarCrush (free tier) + public APIs | Attention metrics          |
| **Chain**      | Base                                 | Settlement chain           |
| **Token**      | USDC                                 | Betting currency           |
| **Linter**     | Biome                                | Lint + format              |
| **Deployment** | Vercel (Bun runtime)                 | Hosting                    |

## Project Structure

```
pulse-markets/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # Landing / markets list
│   ├── market/[id]/page.tsx      # Market detail & betting
│   ├── dashboard/page.tsx        # User positions
│   └── api/[[...route]]/
│       └── route.ts              # Hono catch-all
│
├── server/                       # API logic (Hono)
│   ├── index.ts                  # Hono app
│   ├── routes/
│   │   ├── settle.ts             # POST /api/settle/:marketId
│   │   └── markets.ts            # GET /api/markets, /api/markets/:id
│   └── services/
│       ├── settlement.ts         # AI settlement
│       └── attention.ts          # LunarCrush / data fetch
│
├── components/
│   ├── ui/                       # shadcn
│   ├── wallet/                   # Privy connect
│   ├── markets/                  # Market cards, bet UI
│   ├── yellow/                   # Deposit, withdraw, channel status
│   └── settlement/               # AI reasoning display
│
├── lib/
│   ├── yellow/                   # Nitrolite wrapper, sessions, channels
│   └── utils.ts
│
├── stores/                       # Zustand (user, markets)
├── types/                        # TypeScript interfaces
├── data/                         # Static market definitions (e.g. markets.ts)
└── docs/                         # Documentation
```

## API Endpoints

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/health`           | Health check          |
| GET    | `/api/markets`          | List all markets      |
| GET    | `/api/markets/:id`      | Single market         |
| POST   | `/api/settle/:marketId` | Trigger AI settlement |

API is mounted under `/api` via the Hono catch-all in `app/api/[[...route]]/route.ts`.

## Market Model (Pool-Based)

- Each market has **UP** and **DOWN** pools; users bet into one side.
- One Yellow app session per market; participants added as they bet.
- Proportional payouts: winners share `(totalPot - protocolFee)` by stake in the winning pool.
- Settlement is deterministic rules (threshold vs current value) plus AI-generated reasoning; agent identity/reputation via ERC-8004.

For Yellow session and channel details, see [02-yellow-integration.md](02-yellow-integration.md). For the settlement agent and ERC-8004, see [03-8004-agent.md](03-8004-agent.md).
