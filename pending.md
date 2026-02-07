# Pending Features & Implementation — Pre-Demo Checklist

> Scanned: codebase, README, PRD, task_plan, docs. Target: demo-ready for judges (Yellow SDK, main app UI, ERC-8004 agent).

**Hackathon:** ETHGlobal HackMoney 2026 (Feb 8 deadline) · **Track:** Yellow Network

**Live demo:** [pulsemarkets-fi.vercel.app](https://pulsemarkets-fi.vercel.app)

**Judge success = they can do this flow:**

1. **Connect Wallet** → Privy (in app)
2. **Deposit USDC** → Deposit opens Yellow state channel
3. **Browse Markets** → View attention markets
4. **Place Bets** → UP/DOWN, amount, instant confirmation
5. **Repeat** → Multiple micro-bets across markets
6. **Market Closes** → Timer expires, "Settle" appears
7. **AI Settlement** → Agent fetches data, resolves, logs on-chain, shows reasoning
8. **Withdraw** → Withdraw winnings to wallet, close channel, receive USDC on-chain

**NB:** If a judge can’t simply do this, the project is a fail.

---

## 1. Yellow SDK Implementation

### Done

- **Phase 1 (lib/yellow):** Pool-based types, multi-party app sessions, proportional distribution, `YellowClient` (WebSocket + EIP-712 auth), deposit/channels/auth helpers. Tests passing.
- **Phase 2 (server):** `YellowService` singleton; `POST /api/markets/:id/bet`, `GET /api/markets/:id/pools`, `POST /api/settle/:marketId`; `placeBet` → create/join session, update in-memory market pools; `settleMarket` → proportional distribution, `settleMarketSession` on Yellow.
- Yellow client uses **real** Nitrolite SDK and **sandbox** ClearNode (`CLEARNODE_SANDBOX_URL`). Lazy init on first `placeBet()`.

### Pending / Gaps

- **Operator funding:** Server expects `PRIVATE_KEY` and connects as operator. Operator wallet must be funded on Yellow (deposit/custody) for session creation and allocations. No automated “fund operator” flow in repo. (if user is using the app they connect via privy in that uses the user owm key) - we put our private key in code env for development only
- **Mainnet vs sandbox:** For final demo, docs say “switch to Base mainnet” and use `NEXT_PUBLIC_CLEARNODE_WS_URL` (mainnet). Confirm `YellowService` can use mainnet URL (e.g. via env) and operator has mainnet USDC/ETH if required. (after the testnet works)
- **README API section** does not list `POST /api/markets/:id/bet` or `GET /api/markets/:id/pools`; add them for accuracy.

### Your notes — Yellow flow & channels

- **Reference:** Sandbox facet tokens were requested via curl. Full flow examples exist in:
  - `resources/yellow-sdk-tutorial-example.md` (scripts for create channel, close, etc.)
  - `resources/yellow-sdk-tutorials/scripts` and `resources/yellow-sdk-demo` (including custody contract for deposit).
- **Goal:** Implement that flow in our codebase and add custom prediction logic + UI on top.

**Yellow SDK flow (all must work, testnet + mainnet):**

| Step | Importance | Status |
|------|------------|--------|
| Initialization | — | In place |
| Authentication | — | In place |
| **Creating a Channel** | Very important | Verify / complete |
| **Funding (Resizing)** | Most important | Implement in app |
| **Closing & Withdrawing** | Very important | Implement in app |

- **Sandbox vs mainnet:** Sandbox = no deposit/channel required, transact immediately. For a **user-facing app** (user connects wallet and deposits), we must implement the full flow; judges expect it. Use **mainnet Yellow** + **Base Sepolia or Base mainnet** for the app.
- **Expand `lib/yellow/channels`** into:
  - `channels/create.ts` — Channel creation
  - `channels/transfer.ts` — Transfer operations
  - `channels/close.ts` — Channel closure
- **Integration check:** Audit full flow (init → auth → channels → deposit → session), fill gaps, and test end-to-end.

---

## 2. Main App UI — Missing or Incomplete

**Priority:** High. If judges can’t see it, it’s assumed it didn’t work. UI needs serious work before we can demo.

### Done

- **Landing:** Hero, features, how-it-works, partners, navbar with “Markets” → `/markets`.
- **Markets list:** `/markets` — fetches `/api/markets`, grid of `MarketCard`, loading skeletons.
- **Market detail:** `/market/[id]` — pool stats (UP/DOWN bar, totals, participants), countdown, `BetInterface` (UP/DOWN, amount), “Settle Market” when expired, AI reasoning block when closed.
- **Bet flow:** `BetInterface` calls `POST /api/markets/:id/bet` with `userAddress`, `side`, `amount`; toasts and refetch.

### Pending / Missing

| Feature                          | PRD/README/Architecture                                   | Status                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard / Positions**        | “Positions”, “Dashboard” in architecture & README         | **Missing.** No `app/dashboard/` page. No “My positions” or P&L view.                                                                             |
| **Deposit flow**                 | “Deposit USDC → Opens Yellow state channel” in user flow  | **Missing.** No `components/yellow/deposit-modal.tsx` or deposit page. Users cannot “deposit once” from the app.                                  |
| **Withdraw flow**                | “Withdraw → close channel, receive USDC on-chain”         | **Missing.** No `components/yellow/withdraw-modal.tsx` or withdraw UI.                                                                            |
| **Channel status**               | Architecture shows “Deposit / Withdraw” and channel state | **Missing.** No `components/yellow/channel-status.tsx` (balance, channel id, open/closed).                                                        |
| **User balance in UI**           | “Balance updates instantly” in demo checklist             | **Missing.** No display of user’s Yellow balance or “balance after bet” on market or dashboard.                                                   |
| **ERC-8004 agent profile in UI** | “ERC-8004 agent profile visible” in PRD demo checklist    | **Missing.** Settle API returns `agent` (agentId, registryUrl, etc.); market detail page does not show it. Only shows `result` and `aiReasoning`. |
| **Landing CTA**                  | Demo flow starts with Connect → Deposit → Bet             | No prominent “Trade now” / “Go to Markets” primary CTA on hero (navbar “Markets” exists).                                                         |

### Your notes — (app) pages, flows & theme

- [ ] **Create all pages/components for `(app)`:** Anything missing: dashboard, history, app-navbar, settings. Some can be “Coming soon.”
- [ ] **Deposit & withdraw:** Buttons, components, and full flow — very important.
- **Dark theme for (app) only:** You have `next-themes` but don’t want the landing dark. Apply dark theme only inside the `(app)` layout (e.g. `app/(app)/layout.tsx` with dark styles) so landing stays light.

**Suggested minimum for demo:**

1. **Agent profile block** on market detail after settlement: show agent ID, registry link (e.g. 8004scan), “Settled by ERC-8004 agent”.
2. **Deposit modal (or simple page):** Explain “Fund your Yellow channel” and either (a) link to Yellow/explainer or (b) trigger operator-funded “demo balance” so judges can place bets without real custody.
3. **Dashboard (optional but in spec):** Simple `/dashboard` with “Your positions” (market, side, amount) and optional balance placeholder.

---

## 3. ERC-8004 AI Agent

### Done

- **Backend:** `server/services/agent-identity.ts` (singleton), `server/routes/agent.ts` (A2A discovery + JSON-RPC), `lib/erc-8004/abis.ts` and `constants.ts`, registration script `scripts/register-agent.ts`, `scripts/post-feedback.ts`.
- **Settlement:** `POST /api/settle/:marketId` calls `agentIdentityService.getAgentProof()` and returns `agent` in JSON (agentId, agentRegistry, operatorAddress, registryUrl, reputation).
- **Env:** `AGENT_ID`, `PINATA_JWT` in `env.ts`; `WALLET_ADDRESS` used to init agent identity. Docs: `docs/03-8004-agent.md` (task_plan referred to `docs/8004-agent.md` — only `03-8004-agent.md` exists).

### Pending / Gaps

- **UI does not show agent:** Settlement response includes `agent`; the market detail page does not render it. Judges cannot see “ERC-8004 agent profile” in the app without looking at API response.
- **Registration before demo:** For agent proof to be non-null, run `bun run register-agent`, set `AGENT_ID` in env, and have `PINATA_JWT` and operator wallet with Base ETH.
- **Reputation (optional):** `post-feedback` requires a different wallet (`FEEDBACK_PRIVATE_KEY`); not required for “agent profile visible” but nice for “reputation” story.
- **Docs:** Add `AGENT_ID` to setup docs (04-setup.md) if not already explicit.

---

## 4. Docs & Scripts

- **README:** Update API table with `POST /api/markets/:id/bet`, `GET /api/markets/:id/pools`; ensure “Getting Started (Demo)” matches actual UI (e.g. “Deposit” step if you add it, or “Go to Markets” if deposit is skipped for demo).

---

## 5. PRD Demo Checklist — Status

| Item                                          | Status                               |
| --------------------------------------------- | ------------------------------------ |
| Wallet connects smoothly                      | ✅ Privy connect                     |
| Deposit creates Yellow channel  | ❌ No deposit UI                     |
| Can place 10+ bets without wallet popups      | ✅ Bet API is server-side, no popups |
| Balance updates instantly                     | ⚠️ No user balance shown in UI       |
| Market timer works and counts down            | ✅                                   |
| “Settle” button appears when timer expires    | ✅                                   |
| AI settlement shows reasoning                 | ✅                                   |
| ERC-8004 agent profile visible                | ❌ Not shown in UI                   |
| Withdrawal works                              | ❌ No withdraw UI                    |
| No console errors                             | To verify                            |
| Mobile view works                             | To verify                            |

---

## 6. Suggested Priority Before Demo

1. **High:** Show **ERC-8004 agent** in UI after settlement (market detail: agent ID, registry link, “Settled by ERC-8004 agent”).
2. **High:** Either add a **minimal deposit flow** (or “demo balance”/explainer) so judges can place bets, or document that operator runs with funded wallet and judges use “connect + bet” only.
3. **Medium:** Add **Dashboard** (or at least “Your positions” somewhere) so the “positions” part of the story is visible.
4. **Medium:** **Withdraw** flow or a single “Withdraw” button that links to Yellow/explainer so demo script’s “withdraw winnings” has a UI hook.
5. **Low:** README API table, demo script file, mainnet/sandbox env note.

---

## 7. File-Level Summary

| Area           | Missing / To Add                                                                                                                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App routes** | `app/dashboard/page.tsx` (positions, optional balance)                                                                                                                                                                        |
| **Components** | `components/yellow/deposit-modal.tsx`, `components/yellow/withdraw-modal.tsx`, `components/yellow/channel-status.tsx`; settlement section: `components/settlement/agent-profile.tsx` (or inline agent block in market detail) |
| **Docs**       | README API endpoints; optional `resources/pulse-demo-script.md`; 04-setup.md AGENT_ID note                                                                                                                                    |
| **Config**     | Ensure production/mainnet Yellow URL and operator funding are documented                                                                                                                                                      |

---
