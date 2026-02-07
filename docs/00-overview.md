# PulseMarkets — Introduction

> Real-time prediction market for social attention with gasless trades and AI agent settlement, built on Yellow Network.

## What Is PulseMarkets?

PulseMarkets is a real-time **attention prediction market** where users trade on **attention dynamics** — sentiment shifts, narrative momentum, and viral potential — instead of traditional outcomes like prices or events. Bets execute instantly and gaslessly via Yellow Network state channels (ERC-7824). Markets are resolved by an autonomous settlement agent that analyzes social data and outputs transparent reasoning with an on-chain identity and reputation (ERC-8004).

**Core idea:** Attention is the new alpha. Pulse lets you trade it — instantly, settled by AI, powered by Yellow.

**Built for:** ETHGlobal HackMoney 2026 (Jan 30 – Feb 8), Yellow Network track.

---

## Problem

Crypto traders already speculate on narratives informally (“buy the rumor”), but no native market exists for trading attention as an asset. Traditional prediction markets suffer from:

- **High execution friction** — Gas fees make micro-bets impractical
- **Slow settlement** — Manual or centralized oracles delay outcomes
- **Limited expressiveness** — Binary outcomes fail to capture hype, sentiment, and mindshare dynamics

---

## Solution

PulseMarkets introduces **attention prediction markets** with three innovations:

1. **New asset class** — Trade sentiment shifts, narrative momentum, hype cycles, and viral potential instead of static binary events
2. **Instant execution** — Yellow Network state channels (ERC-7824) enable gasless, sub-second trading with no wallet popups
3. **Autonomous agent settlement** — An ERC-8004 settlement agent fetches real-time attention data, applies deterministic rules, resolves markets with transparent reasoning, and builds verifiable on-chain reputation

---

## Key Features

| Feature                            | Description                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Attention markets**              | Binary UP/DOWN markets on social attention metrics (sentiment, narratives, virality) with clear resolution criteria and timed expiry |
| **Instant, gasless betting**       | Deposit once; place unlimited micro-bets via Yellow state channels with sub-second execution and no wallet popups                    |
| **AI settlement agent (ERC-8004)** | Autonomous agent resolves markets using real attention data, deterministic rules, transparent reasoning, and on-chain reputation     |
| **Transparent resolution**         | Every market settles with verifiable data sources, explainable AI output, and publicly auditable agent reputation                    |

---

## Example Markets

- “Will Bitcoin attention index spike >30% in the next 6 hours?”
- “Will Bitcoin Twitter attention increase by 20% in the next hour?”
- “Will this meme hit trending before midnight?”
- “Will AI Agents narrative sentiment flip positive by EOD?”

MVP ships with **3 curated markets** (sentiment, narrative, viral) and **15-minute demo timers** so judges can see settlement during the demo.

---

## How Pulse Differs

| Platform         | Market model                                | Execution                               | Settlement                               |
| ---------------- | ------------------------------------------- | --------------------------------------- | ---------------------------------------- |
| **Polymarket**   | Orderbook (CLOB), variable prices           | On-chain (Polygon)                      | UMA Optimistic Oracle                    |
| **Trendle**      | LP-backed perp-style positions on attention | On-chain (Azuro)                        | Deterministic price feed                 |
| **PulseMarkets** | Pooled binary UP/DOWN, proportional payouts | Off-chain via Yellow (gasless, instant) | AI agent with ERC-8004 on-chain identity |

Pulse is **pool-based**, not an orderbook: N users bet UP or DOWN, winners split the pot proportionally. Execution is off-chain via Yellow — a combination unique to state-channel infrastructure.

---

## User Flow (High Level)

1. **Connect wallet** → Privy (embedded or external)
2. **Deposit USDC** → Opens Yellow state channel; funds available for betting
3. **Browse markets** → View attention markets with timers, pool sizes, odds
4. **Place bets** → Click UP/DOWN, enter amount, instant confirmation (no wallet popup)
5. **Market closes** → Timer expires; “Settle” button appears
6. **AI settlement** → Agent fetches data, computes result, logs on-chain, displays reasoning
7. **Withdraw** → Close channel; receive USDC on-chain

---

## Documentation Map

| Doc                                                      | Description                                           |
| -------------------------------------------------------- | ----------------------------------------------------- |
| [**00-overview.md**](00-overview.md)                     | This file — overview, problem, solution, features     |
| [**01-architecture.md**](01-architecture.md)             | System design, layers, data flow, folder structure    |
| [**02-yellow-integration.md**](02-yellow-integration.md) | Yellow SDK, state channels, pool-based sessions       |
| [**03-8004-agent.md**](03-8004-agent.md)                 | AI settlement agent, ERC-8004 identity and reputation |
| [**04-setup.md**](04-setup.md)                           | Setup guide, environment variables, first run         |

For full product spec and architecture decisions, see the project root: and **README.md**.
