# Cleanup Tasks

## PROMPT 1 — PRD Cleanup (CRITICAL)

### Goal

Review the PRD and implementation code files and remove any references to:

- app-as-house
- server paying winners
- order-based or CLOB-style matching

### Rewrite Requirements

Rewrite the market model section to state:

- Economically pool-based binary markets
- Pooled binary market logic with instant off-chain execution via Yellow
- Implemented using individual Yellow channel balances
- Payouts computed proportionally per outcome
- Users' funds remain in their own channel accounts, but gains and losses are computed collectively per outcome

**NB:** Ensure terminology is consistent across the entire document.

## PROMPT 2 — Architecture Wording Fix (No Code Changes)

Update architecture documentation and code references including envs to replace "house wallet" language and wording.

### Clarifications Needed

- The server runs an operator-managed Yellow client
- It coordinates sessions and allocation updates
- It is not a counterparty or liquidity provider
- Final settlement is enforced by Yellow adjudicator contracts
- An operator-managed Yellow client coordinates market sessions and allocation updates. User balances remain logically segregated and are settled by Yellow's adjudicator contracts
- session coordinator
- Funds are still:
    - attributed to users
    - locked by Yellow contracts
    - settled trustlessly

## PROMPT 3 — Comparison Section Fix

No code changes required.

### Update Requirements

Update the comparison section to correctly distinguish:

- Polymarket as orderbook-based
- Trendle as LP-backed synthetic markets
- PulseMarkets as pooled binary markets with instant off-chain execution

Avoid claiming identical mechanics to Polymarket.

## PROMPT 4 — Code Comments / README / DOCS Alignment

Audit README, docs, and code comments for misleading terms such as:

- house wallet
- app pays winners
- order matching engine

Replace with neutral language:

- operator
- market coordinator
- pooled payout logic
