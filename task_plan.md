# Task Plan: Yellow SDK Server Integration + Core Trading UI

## Goal
Wire existing Yellow SDK code into working server + UI: ClearNode connection → market sessions → bet placement → AI settlement → frontend

## Features / Steps
- [ ] Step 0: Validate ClearNode connection (test script)
- [ ] Step 1: House wallet deposit script
- [ ] Step 2: Yellow Service singleton (server/services/yellow-service.ts)
- [ ] Step 3: Attention data service (server/services/attention.ts)
- [ ] Step 4: AI settlement service (server/services/settlement.ts)
- [ ] Step 5: Wire API routes (markets + settle)
- [ ] Step 6: Markets list page + market card component
- [ ] Step 7: Market detail + betting page
- [ ] Step 8: App navigation

## Current
**Working on**: Step 0
**Status**: in_progress

## Decisions
- Server-managed Yellow: house wallet connects to ClearNode, manages all sessions
- Users interact via REST API (no browser WebSocket needed)
- Deposit is on-chain (separate from betting flow)

## Errors
(none yet)
