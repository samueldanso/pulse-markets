# Yellow Network Integration

This document describes how Pulse Markets uses the Yellow Network (ERC-7824 Nitrolite) for instant, gasless prediction market betting. It is intended for developers and judges who want to understand the codebase and where Yellow is used.

---

## Overview

Yellow Network provides state channels (ClearNode + Nitrolite SDK) so that users can deposit USDC once and place unlimited off-chain bets. Pulse Markets uses:

- **One Yellow app session per market** — All participants in a given market share a single app session. Users are added when they place their first bet.
- **Pool-based model** — Users bet UP or DOWN; stakes accumulate in two pools. On settlement, winners share the pot proportionally.
- **Server-side Yellow client** — The backend holds the operator wallet and maintains a single `YellowClient` connection to ClearNode. All session creation, bet placement, and settlement go through the server.

**TL;DR:** Deposit on-chain → balance tracked off-chain → bet via API (no wallet popup) → timer expires → AI settles → winners credited → withdraw on-chain.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                                      │
│  • DepositModal / WithdrawModal → call /api/yellow/deposit, withdraw     │
│  • BetInterface → POST /api/markets/:id/bet                              │
│  • useYellowBalance → GET /api/yellow/balance?address=                   │
│  • Market page → POST /api/settle/:marketId when timer expires           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Server (Hono API)                                                      │
│  • yellow-service.ts — singleton: YellowClient + sessions Map            │
│  • routes/yellow.ts — deposit, withdraw, balance, custody-balance, config│
│  • routes/markets.ts — GET pools, POST bet → yellowService.placeBet      │
│  • routes/settle.ts — AI settlement → yellowService.settleMarket        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  lib/yellow (Nitrolite + yellow-ts)                                     │
│  • client.ts — WebSocket to ClearNode, auth, sendMessage                 │
│  • sessions.ts — createMarketSession, addBetToMarket, settleMarketSession│
│  • channels.ts — getOrCreateChannel, allocateToChannel, etc.            │
│  • deposit.ts — depositToCustody (on-chain), getCustodyBalance           │
│  • constants.ts — CLEARNODE_URL, YELLOW_ASSET, CUSTODY, ADJUDICATOR      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ClearNode (wss://clearnet.yellow.com/ws
                     or wss://clearnet-sandbox.yellow.com/ws)
                                    │
                                    ▼
                    Base (or Sepolia sandbox): Custody, Adjudicator, USDC
```

---

## File Tree: `lib/yellow/`

| File                           | Purpose                                                                                                                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **auth.ts**                    | `generateSessionKey()` — creates ECDSA key pair for ClearNode auth; `getSessionExpiry()` — session expiry timestamp. Used by `client.ts` for authentication.                                                                                 |
| **channels.ts**                | `createChannel()`, `getOrCreateChannel()`, `getChannels()`, `allocateToChannel()`, `deallocateFromChannel()`. Channel lifecycle and fund allocation; used by yellow-service for user balance and deposits.                                   |
| **client.ts**                  | `YellowClient` class: WebSocket connection to ClearNode, EIP-712 auth flow, `sendMessage()`, `fetchLedgerBalances()`. Single client instance per server, connected with operator wallet.                                                     |
| **constants.ts**               | `CLEARNODE_URL` (sandbox vs mainnet from `YELLOW_NETWORK`), `YELLOW_ASSET` (usdc / ytest.usd), `CUSTODY_ADDRESS`, `ADJUDICATOR_ADDRESS`, `USDC_ADDRESS`, `SESSION_DURATION`, `CHALLENGE_PERIOD`, `APP_NAME`, `AUTH_SCOPE`, protocol version. |
| **deposit.ts**                 | `depositToCustody()` — on-chain USDC deposit to Yellow custody via NitroliteClient; `getCustodyBalance()`, `getWalletUSDCBalance()`. Used by frontend deposit flow.                                                                          |
| **sessions.ts**                | Pool-based app sessions: `createMarketSession()`, `addBetToMarket()`, `calculateProportionalDistribution()`, `settleMarketSession()`. Core market logic; called by yellow-service.                                                           |
| **types.ts**                   | `SessionKey`, `YellowClientConfig`, `ChannelInfo`, `MarketPool`, `MarketSession`, `PoolBetParams`, `ProportionalDistribution`, `SettlementOutcome`, `UnifiedBalance`, etc.                                                                   |
| **index.ts**                   | Re-exports all public API from the above modules.                                                                                                                                                                                            |
| ****tests**/sessions.test.ts** | Unit tests for proportional distribution and session logic.                                                                                                                                                                                  |

---

## Integration Points

### 1. Server: YellowService (`server/services/yellow-service.ts`)

- **Initialization:** On first use, creates a `YellowClient` with `PRIVATE_KEY` (operator wallet), connects to ClearNode, optionally requests faucet (sandbox).
- **User state:** Persists `userStates` (balance, channelId) in `.yellow-state.json` so balances survive restarts.
- **placeBet(marketId, userAddress, side, amount):** Gets or creates market session via `createMarketSession` / `addBetToMarket`; updates in-memory market state and user balance; allocates to channel.
- **settleMarket(marketId, winner, reasoning, attentionData):** Computes `calculateProportionalDistribution`, calls `settleMarketSession`, credits winners via `creditUserBalance`, marks market closed.
- **depositForUser / withdrawForUser:** Updates user balance and channel; used by `/api/yellow/deposit` and `/api/yellow/withdraw`.

### 2. API Routes

| Route                                      | Yellow usage                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `POST /api/yellow/deposit`                 | `yellowService.depositForUser(userAddress, amount, txHash)`        |
| `POST /api/yellow/withdraw`                | `yellowService.withdrawForUser(userAddress, amount)`               |
| `GET /api/yellow/balance?address=`         | `yellowService.syncCustodyBalance` + `getUserBalance`              |
| `GET /api/yellow/custody-balance?address=` | Reads custody contract on Base (viem)                              |
| `GET /api/yellow/config`                   | `yellowService.getNetworkConfig()`                                 |
| `GET /api/markets/:id/pools`               | `yellowService.getMarketPools(id)`                                 |
| `POST /api/markets/:id/bet`                | `yellowService.placeBet({ marketId, userAddress, side, amount })`  |
| `POST /api/settle/:marketId`               | Attention data + AI settlement → `yellowService.settleMarket(...)` |

### 3. Frontend

- **DepositModal / WithdrawModal:** Call `/api/yellow/deposit` and `/api/yellow/withdraw` with user address and amount.
- **BetInterface:** On UP/DOWN submit, calls `POST /api/markets/:id/bet`; then refreshes pools and user balance.
- **useYellowBalance:** Polls `GET /api/yellow/balance?address=` and updates Zustand user store.
- **Market detail page:** When timer expires and market not closed, calls `POST /api/settle/:marketId` (manual or auto).

---

## Key Functions

### `lib/yellow/sessions.ts`

- **createMarketSession(client, marketId, operatorAddress, userAddress)**
  Creates one Nitrolite app session per market. Starts with two participants (operator + first user), weights 50/50, quorum 50. Sends `createAppSessionMessage` via client; returns `MarketSession` with `sessionId`, empty UP/DOWN pools.

- **addBetToMarket(client, session, { userAddress, side, amount })**
  If user not in session, adds participant and allocation. Updates `session.upPool` or `session.downPool` (participants, amounts, totalAmount). Sends `createSubmitAppStateMessage` with new allocations. One bet per user per market.

- **calculateProportionalDistribution(upPool, downPool, winner, protocolFeePercent)**
  Pure function. Winning side’s participants receive share of `(totalPot - fee)` proportional to their stake. Returns `ProportionalDistribution[]` (participant, side, stakeAmount, payoutAmount, profitPercent).

- **settleMarketSession(client, session, outcome)**
  Builds final allocations from `outcome.distributions`, sends `createCloseAppSessionMessage`. Closes app session on Yellow; funds move according to adjudicator.

### `lib/yellow/client.ts`

- **YellowClient.connect(walletClient)**
  Opens WebSocket to `config.clearNodeUrl`, generates session key, runs EIP-712 auth (auth request → challenge → verify). Required before any RPC.

- **YellowClient.sendMessage(message)**
  Sends JSON-RPC message, waits for response. Used by sessions and channels for all Nitrolite RPCs.

- **YellowClient.fetchLedgerBalances()**
  Returns unified ledger balances (used for display/sync).

### `lib/yellow/channels.ts`

- **getOrCreateChannel(client, asset, chainId)**
  Fetches channels; if none, creates one. Used so user balance has a channel to allocate to.

- **allocateToChannel(client, channelId, participant, asset, amount)**
  Increases allocation to a participant in a channel (off-chain).

- **deallocateFromChannel(client, channelId, participant, asset, amount)**
  Decreases allocation (e.g. on withdraw).

### `lib/yellow/deposit.ts`

- **depositToCustody(walletClient, publicClient, amount)**
  On-chain: user approves USDC and deposits to Yellow custody contract. Returns tx hash. Frontend calls this before or in parallel with `POST /api/yellow/deposit` so the server can credit the same amount off-chain.

---

## How It Works (End-to-End)

1. **Operator / server**
   Server starts; when first Yellow operation is needed, `YellowService.initialize()` runs: creates `YellowClient`, connects with `PRIVATE_KEY` wallet to ClearNode, authenticates. One client for the app.

2. **User deposit**
   User signs on-chain deposit to custody (via DepositModal using `depositToCustody`). Then frontend calls `POST /api/yellow/deposit` with `userAddress` and `amount`. Server credits that amount in `userStates` and ensures user has a channel (getOrCreateChannel + allocate).

3. **User places bet**
   Frontend calls `POST /api/markets/:id/bet` with `userAddress`, `side` (UP/DOWN), `amount`. Server: gets or creates market session (createMarketSession or addBetToMarket), updates session’s UP/DOWN pool, submits new app state to Yellow, debits user balance and allocates to market session. Response returns updated pools.

4. **Market expires**
   Market page shows countdown. When timer hits zero, page can auto-call or user clicks Settle → `POST /api/settle/:marketId`.

5. **Settlement**
   Server: fetches attention data (LunarCrush or mock), runs deterministic rules (threshold vs current value) → winner UP or DOWN. Generates AI reasoning (OpenAI). Computes `calculateProportionalDistribution(upPool, downPool, winner, fee)`. Calls `settleMarketSession(client, session, outcome)`, then credits each winner via `creditUserBalance`. Market marked closed.

6. **Withdraw**
   User clicks Withdraw, enters amount. Frontend calls `POST /api/yellow/withdraw`. Server debits balance; user can then pull funds on-chain (custody → wallet) in a separate flow.

---

## Data Flow Summary

| Step                    | Where    | Yellow / Nitrolite                                                        |
| ----------------------- | -------- | ------------------------------------------------------------------------- |
| Connect                 | server   | YellowClient.connect(operatorWallet)                                      |
| User deposit (on-chain) | frontend | depositToCustody() → custody contract                                     |
| Credit user             | server   | userStates + getOrCreateChannel + allocateToChannel                       |
| Place bet               | server   | createMarketSession / addBetToMarket → SubmitAppState                     |
| Get pools               | server   | In-memory session.upPool / downPool                                       |
| Settle                  | server   | calculateProportionalDistribution → settleMarketSession → CloseAppSession |
| Credit winners          | server   | creditUserBalance (in-memory; withdraw is separate)                       |
| Withdraw (debit)        | server   | withdrawForUser (balance decrease; on-chain withdraw is user-driven)      |

---

## Configuration and Constants

- **Network:** `YELLOW_NETWORK=sandbox` (default) or `mainnet` in env. Sets `CLEARNODE_URL`, `YELLOW_ASSET`, custody/adjudicator addresses in `lib/yellow/constants.ts`.
- **Amounts:** All amounts in Nitrolite are strings in smallest unit (e.g. USDC 6 decimals). No floating point in session math; use BigInt in distribution.
- **Asset id:** Use `YELLOW_ASSET` (`"usdc"` or `"ytest.usd"`) in app session allocations, not the contract address.

---

## References

- [ERC-7824 / Nitrolite](https://erc7824.org/)
- [Quick Start](https://erc7824.org/quick_start/)
- [Nitrolite Example](https://github.com/erc7824/nitrolite-example)
- [Yellow Prediction Market Example](https://docs.yellow.org/docs/protocol/off-chain/app-sessions/#example-4-prediction-market)
