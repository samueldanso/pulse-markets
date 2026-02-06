# Task Plan: ERC-8004 Agent Identity Integration

## Goal
Settlement oracle is a registered ERC-8004 agent on Base with on-chain identity, A2A discovery endpoint, and reputation posting capability.

## Features / Steps
- [x] 1. Foundation: `lib/erc-8004/abis.ts` + `constants.ts`
- [x] 2. Service: `server/services/agent-identity.ts`
- [x] 3. Route: `server/routes/agent.ts` (A2A discovery + JSON-RPC)
- [x] 4. Wire up: Mount route + init service in `server/index.ts`
- [x] 5. Settlement proof: Add agent identity to settle response
- [x] 6. Env: Add `PINATA_JWT`, `AGENT_ID` to `env.ts`
- [x] 7. Registration script: `scripts/register-agent.ts` + add `agent0-sdk` dep
- [x] 8. Feedback demo: `scripts/post-feedback.ts`
- [x] 9. Docs: `docs/8004-agent.md`

## Current
**Working on**: Complete
**Status**: all steps done

## Decisions
- A2A mounted under existing Hono catch-all (not separate Express server)
- Reputation: settlement response includes proof payload; separate script for on-chain posting
- agent0-sdk for registration helper
- `registerIPFS()` returns `TransactionHandle<RegistrationFile>` — need `waitMined()` then read `agent.agentId` getter
- Used `BigInt(0)` instead of `0n` to stay compatible with tsconfig target

## Files Created
- `lib/erc-8004/abis.ts` — Minimal ABIs for IdentityRegistry + ReputationRegistry
- `lib/erc-8004/constants.ts` — Contract addresses, chain config, registry ID
- `server/services/agent-identity.ts` — AgentIdentityService singleton
- `server/routes/agent.ts` — A2A discovery + JSON-RPC endpoint
- `scripts/register-agent.ts` — One-time on-chain registration
- `scripts/post-feedback.ts` — Reputation demo script
- `docs/8004-agent.md` — Integration guide

## Files Modified
- `server/index.ts` — Mount agent route, init identity service
- `server/routes/settle.ts` — Add agent proof to settlement response
- `env.ts` — Add PINATA_JWT, AGENT_ID vars
- `package.json` — Add agent0-sdk dep, register-agent + post-feedback scripts

## Errors
- Pre-existing: `bun:test` module not found in tsconfig (unrelated)
- Pre-existing: lint errors in lib/yellow/, components/ (unrelated)
