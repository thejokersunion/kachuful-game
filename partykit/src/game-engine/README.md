# Kachuful Game Engine

This module contains the deterministic core logic for Card Masters (Kachuful/Judgement). It now ships alongside the PartyKit server so gameplay always runs server-side, but the code stays UI-agnostic for tooling/tests that need to exercise the ruleset locally.

## Design Goals

- **Server authoritative** – all validation happens in the engine.
- **Deterministic** – injectable RNG for reproducible replays/tests.
- **Pure state transitions** – every action returns a new immutable snapshot.
- **Configurable** – table rules (hand sequence, scoring model, trump rotation, etc.) are provided via `GameConfig`.
- **Easy to integrate** – the engine exposes a single class, `KachufulEngine`, plus serializable snapshots for transport to clients.

## Modules

| File | Responsibility |
| --- | --- |
| `types.ts` | Suits, ranks, card helpers, config types, snapshot contracts. |
| `deck.ts` | 52-card deck factory, shuffling, dealing helpers. |
| `rng.ts` | Deterministic PRNG (`Mulberry32`) and RNG interface. |
| `scoring.ts` | Scoring model implementations. |
| `engine.ts` | State machine that orchestrates dealing, bidding, trick play, and scoring. |
| `index.ts` | Barrel exports for consumers. |

## Life Cycle

1. **Construction** – provide `GameConfig` (players, hand sequence, scoring, trump rules, etc.).
2. **`start()`** – shuffles, deals, sets trump, and enters `bidding` phase.
3. **`submitBid(playerId, amount)`** – validates order, restriction rules, and advances to `playing` when all bids exist.
4. **`playCard(playerId, cardId)`** – enforces follow-suit/trump logic, resolves trick when all cards played, updates leader.
5. **`scoreRound()`** – called automatically after final trick, writes scores, prepares next round or `completed`.
6. **`startNextRound()`** – rotates dealer/hand size, optionally called after clients acknowledge scores.

Each state transition emits a serializable `EngineSnapshot` describing:

- Player hands (owner only) and `handCounts` for observers.
- Bids, tricks won, scores, current trick, leader, trump suit.
- Phase metadata (`phase`, `round`, `handSize`, `dealerId`, `leadPlayerId`, `pendingActions`).

## Integration Surface

```ts
const engine = new KachufulEngine(config)
engine.start()
engine.submitBid(playerId, bid)
engine.playCard(playerId, cardId)
const snapshot = engine.getState()
```

Snapshots are immutable, so the PartyKit server can broadcast them directly, while the UI can optimistically render them.

## Testing Strategy

- **Unit tests** (Vitest in `app/__tests__/engine`) cover:
  - Deck generation & shuffling determinism
  - Bidding restrictions
  - Follow-suit enforcement & trick resolution
  - Scoring models & round transitions
- **Integration tests** (Vitest in `partykit/src/__tests__`) spin up the engine through server handlers to verify lobby → bidding → play → scoring flows.

The combination ensures core rules stay correct while the multiplayer layer continues to evolve.
