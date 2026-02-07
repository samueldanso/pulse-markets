# Task Plan: Fix Yellow State Channels Integration

## Goal
Make Yellow betting work end-to-end — session creation, bet placement, settlement via real state channels.

## Features / Steps
- [x] Fix 1: Yellow session response parsing — array vs object
- [x] Fix 2: Yellow channel response parsing — array handling
- [x] Fix 3: ERC-8004 registration script — registryOverrides for Base 8453
- [x] Fix 4: Agent identity — parse chainId:tokenId format, fix URLs
- [x] Fix 5: Session creation requires 2 participants — add userAddress as 2nd participant
- [x] Fix 6: Remove Yellow bypass fallback — Yellow must work, no mock path
- [x] Fix 7: Client error handling — catch ClearNode `{"method":"error"}` format
- [x] Fix 8: End-to-end test — verify betting flow works

## Current
**Working on**: Complete
**Status**: all fixes done, E2E verified

## Decisions
- Session per market: operator + first bettor as 2 participants
- weights: [50, 50], quorum: 50 — operator can sign unilaterally
- Removed fallback bypass (user requirement: judges won't accept it)
- ClearNode error format `{"method":"error","params":{...}}` now caught by client

## Errors
- "invalid number of participants" → fixed by adding 2nd participant
