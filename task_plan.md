# Task Plan: Yellow SDK Server Integration + Core Trading UI

## Goal
Wire existing Yellow SDK code into working server + UI: ClearNode connection → market sessions → bet placement → AI settlement → frontend

## Features / Steps
- [x] Step 0: Validate ClearNode connection (test script)
- [x] Step 1: Update YellowClient + sandbox setup
- [x] Step 2: Yellow Service singleton (server/services/yellow-service.ts)
- [x] Step 3: Attention data service (server/services/attention.ts)
- [x] Step 4: AI settlement service (server/services/settlement.ts)
- [x] Step 5: Wire API routes (markets + settle)
- [x] Step 6: Markets list page + market card component
- [x] Step 7: Market detail + betting page
- [x] Step 8: App navigation

## Current
**Working on**: Complete
**Status**: all steps done

## Decisions
- Server-managed Yellow: house wallet connects to ClearNode, manages all sessions
- Users interact via REST API (no browser WebSocket needed)
- Sandbox ClearNode (`wss://clearnet-sandbox.yellow.com/ws`) for dev
- Raw WebSocket instead of yellow-ts Client (fixes auth timing issues)
- `application: APP_NAME` (not wallet address) in auth request
- `scope: "console"` for ClearNode auth
- Faucet tokens (10M ytest.usd) for sandbox testing

## Key Fixes
- Auth "invalid challenge or signature": Fixed by switching to sandbox URL + correct auth params
- yellow-ts Client message consumption: Fixed by using raw WebSocket
- AI SDK v6: Uses `maxOutputTokens` not `maxTokens`

## Errors
(all resolved)
