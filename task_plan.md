# Task Plan: Terminology & Documentation Cleanup

## Goal
Replace "house wallet", "app-as-house", and other misleading terms with neutral operator/coordinator language across all docs, code, and env vars.

## Features / Steps
- [x] Step 1: PRD.md — Rewrite market model section, remove app-as-house/order-based refs
- [x] Step 2: Architecture wording — Replace "house wallet" in code + env vars
- [x] Step 3: Comparison section — Fix PRD comparison table (Polymarket/Trendle/Pulse)
- [x] Step 4: Docs/README/comments alignment — Audit and replace misleading terms

## Current
**Working on**: Complete
**Status**: all steps done

## Decisions
- `HOUSE_WALLET_*` env vars → `PRIVATE_KEY` / `WALLET_ADDRESS` (matches Yellow getting-started pattern)
- `houseAddress` → `operatorAddress` in code (types.ts, sessions.ts, yellow-service.ts, scripts)
- `houseFeePercent` → `protocolFeePercent` (clearer semantics)
- `houseWeight` → `operatorWeight`
- "App-as-House" section → "Pooled Binary Markets" section in PRD
- Added platform comparison table (Polymarket vs Trendle vs Pulse)
- Funds are user-attributed, locked by Yellow contracts, settled trustlessly

## Files Changed
- `PRD.md` — Market model rewrite, comparison table, YES/NO→UP/DOWN, env vars
- `CLAUDE.md` — env var refs, removed app-as-house language
- `docs/yellow-integration.md` — all house→operator, houseFee→protocolFee
- `docs/testing.md` — env var ref
- `todo.md` — removed app-as-house language
- `.env`, `.env.example` — PRIVATE_KEY / WALLET_ADDRESS
- `env.ts` — schema + runtimeEnv updated
- `lib/yellow/types.ts` — operatorAddress, operatorPrivateKey
- `lib/yellow/sessions.ts` — operatorAddress, protocolFeePercent, operatorWeight
- `lib/yellow/__tests__/sessions.test.ts` — protocol fee in test names
- `server/services/yellow-service.ts` — process.env.PRIVATE_KEY, operatorAddress
- `scripts/test-*.ts` — process.env.PRIVATE_KEY, operator wallet logs

## Errors
(none)
