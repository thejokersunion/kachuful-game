# Kachuful Card Game - Implementation Roadmap

## Overview

This document outlines the technical implementation plan for the Kachuful (Judgement) card game, including architecture, data structures, API design, and development phases.

**IMPORTANT**: This project builds on existing infrastructure. The lobby system, WebSocket client, responsive components, and gaming theme are already implemented.

---

## Architecture Overview

### System Components (✅ = Already Implemented)

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React Native)               │
│  ┌──────────────┬──────────────┬─────────────────────┐ │
│  │ UI Layer ✅  │ Game Logic   │ Network Layer ✅    │ │
│  │ (Tamagui)    │ (State Mgmt) │ (PartyKit/useGame   │ │
│  │ Responsive✅ │ NEW: Kachuful│  Client) ✅         │ │
│  └──────────────┴──────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   Server (PartyKit) ✅                  │
│  ┌──────────────┬──────────────┬─────────────────────┐ │
│  │ Room Mgr ✅  │ Game Engine  │ Event Broadcaster✅ │ │
│  │ Lobby Sys ✅ │ NEW: Kachuful│ WebSocket ✅        │ │
│  └──────────────┴──────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Existing Infrastructure (✅ Already Built)

**Client Side**:
- ✅ `app/app/index.tsx` - Lobby system with create/join/leave
- ✅ `utils/gameClient.ts` - GameClient class and useGameClient hook
- ✅ `types/game.ts` - Base types (Player, GameState, LobbyInfo)
- ✅ `components/GameHeader.tsx` - Header component
- ✅ `components/ResponsiveContainer.tsx` - Responsive wrapper
- ✅ `hooks/useResponsive.tsx` - Responsive utilities
- ✅ `tamagui.config.ts` - Gaming theme (purple/green/gold)

**Server Side**:
- ✅ `partykit/` - PartyKit server infrastructure
- ✅ Lobby management (create, join, leave, kick)
- ✅ WebSocket message handling
- ✅ Room-based multiplayer

### What Needs to Be Built

**Kachuful-Specific**:
- ⬜ Kachuful game types (extend existing types)
- ⬜ Card utilities (deck, shuffle, deal)
- ⬜ Game logic (bidding, tricks, scoring)
- ⬜ Kachuful UI screens (10 screens)
- ⬜ Server-side Kachuful game engine
- ⬜ Kachuful-specific messages and handlers

---

## Data Structures

### Extending Existing Types

The Kachuful game will **extend** the existing base types rather than replace them.

### Type Definitions (Extending Existing)

**File**: `types/kachuful.ts` (NEW - extends `types/game.ts` ✅)

```typescript
// Import existing base types
import type { Player, GameState, GameStatus } from './game'

// Card Types (Kachuful-specific)
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  id: string // unique identifier like "A♠"
}

// Extend existing Player type with Kachuful-specific fields
export interface KachufulPlayer extends Player {
  // Player already has: id, name, avatar, isHost, status, score, cards, joinedAt
  
  // Kachuful-specific additions
  hand: Card[] // Typed cards instead of string[]
  bid: number | null
  tricksWon: number
  roundScore: number
  totalScore: number
}

// Kachuful Game Phase (extends existing GameStatus)
export type KachufulPhase = 
  | 'lobby'           // Existing: Waiting for players ✅
  | 'round_start'     // NEW: Announcing round
  | 'dealing'         // NEW: Dealing cards
  | 'trump_reveal'    // NEW: Showing trump
  | 'bidding'         // NEW: Players making bids
  | 'playing'         // Existing: Trick-taking gameplay (extend)
  | 'trick_result'    // NEW: Showing trick winner
  | 'round_scoring'   // NEW: Calculating round scores
  | 'scoreboard'      // NEW: Showing cumulative scores
  | 'game_end'        // NEW: Game finished

// Trick Types
export interface PlayedCard {
  card: Card
  playerId: string
  playerName: string
}

export interface Trick {
  number: number // 1 to cardsPerRound
  leadPlayerId: string
  ledSuit: Suit | null
  cardsPlayed: PlayedCard[]
  winnerId: string | null
}

// Extend existing GameState with Kachuful-specific fields
export interface KachufulGameState extends GameState {
  // GameState already has: lobbyCode, hostId, status, players, currentTurn, 
  // round, maxPlayers, createdAt, startedAt ✅
  
  // Kachuful-specific additions
  phase: KachufulPhase
  players: KachufulPlayer[] // Override with typed players
  
  // Round management
  roundConfig: RoundConfig
  currentRound: number
  totalRounds: number
  dealerId: string
  
  // Trump
  trumpSuit: Suit | null
  trumpCard: Card | null
  isNoTrump: boolean
  
  // Bidding
  biddingOrder: string[]
  currentBidderId: string | null
  allBidsPlaced: boolean
  totalBids: number
  
  // Trick-taking
  currentTrick: Trick
  tricks: Trick[]
  currentPlayerId: string | null
  playOrder: string[]
  
  // Timing
  roundStartedAt: number | null
  
  // Deck
  deck: Card[]
  stockPile: Card[]
  
  // History
  roundHistory: RoundResult[]
}

// Round Configuration
export interface RoundConfig {
  number: number
  cardsPerPlayer: number
  isAscending: boolean
  maxRound: number
}

// Trick Types
export interface PlayedCard {
  card: Card
  playerId: string
  playerName: string
}

export interface Trick {
  number: number
  leadPlayerId: string
  ledSuit: Suit | null
  cardsPlayed: PlayedCard[]
  winnerId: string | null
}

// Round Result for History
export interface RoundResult {
  roundNumber: number
  playerResults: {
    playerId: string
    playerName: string
    bid: number
    tricksWon: number
    pointsEarned: number
    madeBid: boolean
  }[]
}

// Settings
export interface GameSettings {
  maxRounds: number
  roundType: 'ascending' | 'full'
  scoringVariant: 'standard' | 'simple' | 'nilBonus'
  dealerBidRestriction: boolean
  timeLimit: number | null
  autoAdvance: boolean
}
```

---

## API / Message Protocol

### Extending Existing Message Types

**File**: Extend `types/game.ts` with Kachuful messages

```typescript
// Add to existing ClientMessage type
export type KachufulClientMessage = ClientMessage | {
  type: 'place_bid' | 'play_kachuful_card'
  payload: PlaceBidPayload | PlayKachufulCardPayload
}

export interface PlaceBidPayload {
  bid: number
}

export interface PlayKachufulCardPayload {
  cardId: string // Card ID like "A♠"
}

// Add to existing ServerMessage type
export type KachufulServerMessage = ServerMessage | {
  type: 'kachuful_game_state' | 'round_started' | 'trump_revealed' | 
        'bid_placed' | 'card_played' | 'trick_completed' | 
        'round_completed' | 'game_ended'
  payload: KachufulGameState | RoundStartPayload | TrumpRevealPayload | 
           BidPlacedPayload | CardPlayedPayload | TrickCompletedPayload | 
           RoundCompletedPayload | GameEndedPayload
  timestamp: number
}
```

---

## Leveraging Existing Infrastructure

### Use Existing GameClient (✅)

The `useGameClient` hook from `utils/gameClient.ts` provides:
- ✅ WebSocket connection management
- ✅ Event subscription (on/off)
- ✅ Base lobby actions (create, join, leave, kick)
- ✅ Connection state tracking

**Extend for Kachuful**:
```typescript
// Add Kachuful-specific methods to existing GameClient
export function useKachufulClient(host: string, roomId: string) {
  const baseClient = useGameClient(host, roomId)
  
  // Kachuful-specific actions
  const placeBid = useCallback((bid: number) => {
    baseClient.client?.send({
      type: 'place_bid',
      payload: { bid }
    })
  }, [baseClient.client])
  
  const playKachufulCard = useCallback((cardId: string) => {
    baseClient.client?.send({
      type: 'play_kachuful_card',
      payload: { cardId }
    })
  }, [baseClient.client])
  
  return {
    ...baseClient,
    placeBid,
    playKachufulCard
  }
}
```

### Use Existing Lobby Screen (✅)

The existing `app/app/index.tsx` provides:
- ✅ Create lobby UI
- ✅ Join lobby UI
- ✅ Lobby waiting room
- ✅ Player list with kick functionality
- ✅ Deep linking support
- ✅ Code copying and sharing

**Modify for Kachuful**:
- Add game mode selector (choose "Kachuful")
- Add Kachuful settings (rounds, scoring variant)
- Route to Kachuful game screens after "Start Game"

### Use Existing Components (✅)

Reuse these existing components:
- ✅ `GameHeader` - Already styled with gaming theme
- ✅ `ResponsiveContainer` - Auto-adapts to viewport
- ✅ `useResponsive` hook - Device detection
- ✅ Tamagui components (Card, Button, XStack, YStack)
- ✅ Gaming color palette (already configured)

---

## File Structure (Integrated)

### Client Structure (builds on existing)

```
app/
├── app/
│   ├── index.tsx                    ✅ MODIFY: Add Kachuful game selector
│   ├── (tabs)/
│   │   └── kachuful.tsx             ⬜ NEW: Kachuful game tab
│   └── ...existing files...
│
├── components/
│   ├── GameHeader.tsx               ✅ REUSE as-is
│   ├── ResponsiveContainer.tsx      ✅ REUSE as-is
│   ├── Provider.tsx                 ✅ REUSE as-is
│   └── kachuful/                    ⬜ NEW: Kachuful components
│       ├── Card.tsx
│       ├── CardHand.tsx
│       ├── TrickDisplay.tsx
│       ├── PlayerAvatar.tsx
│       ├── BiddingInterface.tsx
│       ├── TrumpIndicator.tsx
│       ├── ScoreTable.tsx
│       └── RoundProgress.tsx
│
├── screens/
│   └── kachuful/                    ⬜ NEW: Game screens
│       ├── RoundStartScreen.tsx
│       ├── TrumpRevealScreen.tsx
│       ├── BiddingScreen.tsx
│       ├── TrickPlayingScreen.tsx
│       ├── TrickResultScreen.tsx
│       ├── RoundScoringScreen.tsx
│       ├── ScoreboardScreen.tsx
│       └── GameEndScreen.tsx
│
├── utils/
│   ├── gameClient.ts                ✅ EXTEND with Kachuful methods
│   ├── responsiveTokens.ts          ✅ REUSE as-is
│   └── kachuful/                    ⬜ NEW: Game logic
│       ├── gameLogic.ts
│       ├── cardUtils.ts
│       ├── scoringUtils.ts
│       ├── validationUtils.ts
│       └── constants.ts
│
├── types/
│   ├── game.ts                      ✅ EXTEND (add Kachuful messages)
│   └── kachuful.ts                  ⬜ NEW: Kachuful types
│
├── hooks/
│   ├── useResponsive.tsx            ✅ REUSE as-is
│   ├── useKachufulGame.ts           ⬜ NEW: Game state hook
│   └── useCardAnimation.ts          ⬜ NEW: Animation hook
│
└── tamagui.config.ts                ✅ REUSE gaming theme
```

### Server Structure (extends existing)

```
partykit/
├── src/
│   ├── index.ts                     ✅ EXTEND: Route Kachuful rooms
│   ├── kachuful/                    ⬜ NEW: Kachuful server
│   │   ├── KachufulRoom.ts
│   │   ├── gameEngine.ts
│   │   ├── cardManager.ts
│   │   ├── roundManager.ts
│   │   ├── trickManager.ts
│   │   ├── scoringManager.ts
│   │   └── validators.ts
│   └── ...existing files...
```
  maxRound: number // highest round number
}

// Game State
export interface KachufulGameState {
  // Game identification
  lobbyCode: string
  gameId: string
  
  // Players
  players: KachufulPlayer[]
  hostId: string
  maxPlayers: number
  
  // Phase management
  phase: GamePhase
  
  // Round management
  roundConfig: RoundConfig
  currentRound: number
  totalRounds: number
  dealerId: string
  
  // Trump
  trumpSuit: Suit | null
  trumpCard: Card | null
  isNoTrump: boolean
  
  // Bidding
  biddingOrder: string[] // player IDs in bidding order
  currentBidderId: string | null
  allBidsPlaced: boolean
  totalBids: number
  
  // Trick-taking
  currentTrick: Trick
  tricks: Trick[]
  currentPlayerId: string | null
  playOrder: string[] // player IDs in play order
  
  // Timing
  createdAt: number
  startedAt: number | null
  roundStartedAt: number | null
  
  // Deck
  deck: Card[]
  stockPile: Card[]
  
  // History
  roundHistory: RoundResult[]
}

// Round Result for History
export interface RoundResult {
  roundNumber: number
  playerResults: {
    playerId: string
    playerName: string
    bid: number
    tricksWon: number
    pointsEarned: number
    madeBid: boolean
  }[]
}

// Settings
export interface GameSettings {
  maxRounds: number // e.g., 10 or 'full' (ascending + descending)
  roundType: 'ascending' | 'full' // full = ascending then descending
  scoringVariant: 'standard' | 'simple' | 'nilBonus'
  dealerBidRestriction: boolean // true = dealer can't make total = available
  timeLimit: number | null // seconds per action, null = no limit
  autoAdvance: boolean // auto-advance screens or require button press
}
```

---

## Game Logic Functions

### Core Game Engine

```typescript
// Card Management
export function createDeck(): Card[]
export function shuffleDeck(deck: Card[]): Card[]
export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number): {
  playerHands: Card[][]
  stockPile: Card[]
}

// Round Management
export function determineMaxCards(numPlayers: number): number
export function getRoundSequence(maxRound: number, roundType: 'ascending' | 'full'): number[]
export function getNextRoundConfig(currentRound: number, roundSequence: number[]): RoundConfig | null

// Trump Selection
export function selectTrumpCard(stockPile: Card[]): { trumpCard: Card | null, trumpSuit: Suit | null, isNoTrump: boolean }

// Bidding
export function canPlaceBid(
  bid: number,
  playerId: string,
  gameState: KachufulGameState
): { valid: boolean, reason?: string }

export function isIllegalDealerBid(
  bid: number,
  totalBidsSoFar: number,
  cardsInRound: number
): boolean

// Card Playing
export function getPlayableCards(
  hand: Card[],
  ledSuit: Suit | null,
  trumpSuit: Suit | null
): Card[]

export function canPlayCard(
  card: Card,
  hand: Card[],
  ledSuit: Suit | null
): { valid: boolean, reason?: string }

// Trick Evaluation
export function determineTrickWinner(
  cardsPlayed: PlayedCard[],
  ledSuit: Suit,
  trumpSuit: Suit | null
): string // returns winner player ID

export function getCardValue(rank: Rank): number // A=14, K=13, ..., 2=2

// Scoring
export function calculateRoundScore(
  bid: number,
  tricksWon: number,
  scoringVariant: GameSettings['scoringVariant']
): number

export function updatePlayerScores(
  players: KachufulPlayer[],
  scoringVariant: GameSettings['scoringVariant']
): KachufulPlayer[]

// Game Flow
export function advanceToNextPhase(gameState: KachufulGameState): KachufulGameState
export function checkGameEnd(gameState: KachufulGameState): boolean
export function determineWinner(players: KachufulPlayer[]): KachufulPlayer[]
```

---

## API / Message Protocol

### Client → Server Messages

```typescript
// Lobby Actions
{
  type: 'create_kachuful_lobby',
  payload: {
    hostName: string
    maxPlayers: number
    settings: GameSettings
  }
}

{
  type: 'join_kachuful_lobby',
  payload: {
    lobbyCode: string
    playerName: string
  }
}

{
  type: 'leave_kachuful_lobby',
  payload: {}
}

{
  type: 'start_kachuful_game',
  payload: {}
}

// Game Actions
{
  type: 'place_bid',
  payload: {
    bid: number
  }
}

{
  type: 'play_card',
  payload: {
    cardId: string
  }
}

{
  type: 'advance_phase',
  payload: {} // Host triggers phase advancement
}
```

### Server → Client Messages

```typescript
// State Updates
{
  type: 'kachuful_game_state',
  payload: KachufulGameState
}

// Events
{
  type: 'player_joined',
  payload: {
    player: KachufulPlayer
  }
}

{
  type: 'player_left',
  payload: {
    playerId: string
  }
}

{
  type: 'round_started',
  payload: {
    roundNumber: number
    cardsPerPlayer: number
  }
}

{
  type: 'trump_revealed',
  payload: {
    trumpCard: Card | null
    trumpSuit: Suit | null
    isNoTrump: boolean
  }
}

{
  type: 'bid_placed',
  payload: {
    playerId: string
    playerName: string
    bid: number
  }
}

{
  type: 'card_played',
  payload: {
    playerId: string
    playerName: string
    card: Card
  }
}

{
  type: 'trick_completed',
  payload: {
    winnerId: string
    winnerName: string
    trick: Trick
  }
}

{
  type: 'round_completed',
  payload: {
    roundResult: RoundResult
  }
}

{
  type: 'game_ended',
  payload: {
    winners: KachufulPlayer[]
    finalStandings: KachufulPlayer[]
  }
}

{
  type: 'error',
  payload: {
    message: string
    code: string
  }
}
```

---

## File Structure

### Client (app/)

```
app/
├── components/
│   ├── kachuful/
│   │   ├── Card.tsx                    # Card component
│   │   ├── CardHand.tsx                # Player hand display
│   │   ├── TrickDisplay.tsx            # Center table for tricks
│   │   ├── PlayerAvatar.tsx            # Player info card
│   │   ├── BiddingInterface.tsx        # Bid selection UI
│   │   ├── TrumpIndicator.tsx          # Trump suit display
│   │   ├── ScoreTable.tsx              # Scoring display
│   │   ├── RoundProgress.tsx           # Round info header
│   │   └── GameAnimations.tsx          # Animation components
│   │
│   ├── GameHeader.tsx                  # (existing)
│   ├── ResponsiveContainer.tsx         # (existing)
│   └── Provider.tsx                    # (existing)
│
├── screens/
│   ├── kachuful/
│   │   ├── KachufulLobbyScreen.tsx     # Lobby with game settings
│   │   ├── RoundStartScreen.tsx        # Round announcement
│   │   ├── TrumpRevealScreen.tsx       # Trump card reveal
│   │   ├── BiddingScreen.tsx           # Bidding phase
│   │   ├── TrickPlayingScreen.tsx      # Main gameplay
│   │   ├── TrickResultScreen.tsx       # Trick winner
│   │   ├── RoundScoringScreen.tsx      # Round scores
│   │   ├── ScoreboardScreen.tsx        # Cumulative scores
│   │   └── GameEndScreen.tsx           # Final results
│
├── utils/
│   ├── kachuful/
│   │   ├── gameLogic.ts                # Core game rules
│   │   ├── cardUtils.ts                # Card management
│   │   ├── scoringUtils.ts             # Scoring calculations
│   │   ├── validationUtils.ts          # Rule validation
│   │   └── constants.ts                # Game constants
│   │
│   ├── gameClient.ts                   # (existing, extend for Kachuful)
│   └── responsiveTokens.ts             # (existing)
│
├── types/
│   ├── kachuful.ts                     # Kachuful type definitions
│   └── game.ts                         # (existing, extend)
│
├── hooks/
│   ├── useKachufulGame.ts              # Kachuful game state hook
│   ├── useCardAnimation.ts             # Card animation hook
│   └── useResponsive.tsx               # (existing)
│
└── app/
    └── (tabs)/
        └── kachuful.tsx                # Entry point for Kachuful game
```

### Server (partykit/)

```
partykit/
├── src/
│   ├── kachuful/
│   │   ├── KachufulRoom.ts             # Main room handler
│   │   ├── gameEngine.ts               # Game logic (server-side)
│   │   ├── cardManager.ts              # Deck and card operations
│   │   ├── roundManager.ts             # Round progression
│   │   ├── trickManager.ts             # Trick evaluation
│   │   ├── scoringManager.ts           # Score calculation
│   │   └── validators.ts               # Server-side validation
│   │
│   └── index.ts                        # (existing, route to KachufulRoom)
│
└── package.json
```

---

## Implementation Phases

**NOTE**: Phases 0 (Infrastructure) is already complete. Start with Phase 1.

---

### Phase 0: Infrastructure ✅ COMPLETE

**Goal**: Set up base infrastructure for multiplayer gaming

✅ **Already Implemented**:
- ✅ React Native + Expo setup
- ✅ Tamagui UI library with gaming theme
- ✅ PartyKit server infrastructure
- ✅ WebSocket client (`GameClient` class)
- ✅ `useGameClient` hook for React
- ✅ Base types (`Player`, `GameState`, `LobbyInfo`)
- ✅ Lobby system (create, join, leave, kick)
- ✅ Responsive design utilities
- ✅ Gaming color palette (purple/green/gold)
- ✅ Testing infrastructure (Vitest)

**Deliverable**: ✅ Working multiplayer lobby - `app/app/index.tsx`

---

### Phase 1: Foundation (Week 1) ⬜ NEXT

**Goal**: Set up Kachuful-specific types, utilities, and basic components

**Leverage Existing** (✅):
- Extend `types/game.ts` instead of creating from scratch
- Reuse `useGameClient` and add Kachuful methods
- Use existing Tamagui components and theme
- Use existing responsive utilities

**New Work** (⬜):
- [ ] Create `types/kachuful.ts` (extend existing types)
- [ ] Implement `utils/kachuful/cardUtils.ts` (deck, shuffle, deal)
- [ ] Implement `utils/kachuful/constants.ts` (game constants)
- [ ] Create `components/kachuful/Card.tsx` (card display)
- [ ] Create `components/kachuful/CardHand.tsx` (hand display)
- [ ] Create `hooks/useKachufulClient.ts` (extend useGameClient)
- [ ] Write tests for card utilities

**Deliverable**: Card components rendering with test data

**Time**: 2-3 days (reduced from 3-4 due to existing infrastructure)

---

### Phase 2: Lobby Integration (Week 1) ⬜

**Goal**: Integrate Kachuful with existing lobby system

**Leverage Existing** (✅):
- Modify `app/app/index.tsx` to add game mode selection
- Reuse lobby UI components
- Reuse deep linking and code sharing
- Reuse player list and kick functionality

**New Work** (⬜):
- [ ] Add game mode selector to lobby (Card Masters vs Kachuful)
- [ ] Add Kachuful settings UI (rounds, scoring variant, dealer restriction)
- [ ] Store settings in game state
- [ ] Add routing to Kachuful screens when "Start Game" pressed
- [ ] Update `types/game.ts` with Kachuful message types
- [ ] Test lobby flow with Kachuful mode

**Deliverable**: Functional Kachuful lobby with settings

**Time**: 1-2 days (reduced from 2-3 due to reusing lobby)

---

### Phase 3: Game Flow Screens (Week 2) ⬜

**Goal**: Implement all Kachuful game screens (UI only, demo data)

**Leverage Existing** (✅):
- Use `ResponsiveContainer` for all screens
- Use `GameHeader` component
- Use Tamagui Card, Button, XStack, YStack
- Use gaming theme colors
- Use responsive hooks

**New Work** (⬜):
- [ ] Create `screens/kachuful/RoundStartScreen.tsx`
- [ ] Create `screens/kachuful/TrumpRevealScreen.tsx`
- [ ] Create `screens/kachuful/BiddingScreen.tsx`
- [ ] Create `screens/kachuful/TrickPlayingScreen.tsx`
- [ ] Create `screens/kachuful/TrickResultScreen.tsx`
- [ ] Create `screens/kachuful/RoundScoringScreen.tsx`
- [ ] Create `screens/kachuful/ScoreboardScreen.tsx`
- [ ] Create `screens/kachuful/GameEndScreen.tsx`
- [ ] Create navigation flow between screens
- [ ] Add demo/mock data for testing

**Deliverable**: Complete screen flow with static data

**Time**: 4-5 days (reduced from 5-7 due to reusable components)

---

### Phase 4: Core Game Logic (Week 2-3) ⬜

**Goal**: Implement all Kachuful game rules and logic

**New Work** (⬜):
- [ ] Implement deck creation and shuffling
- [ ] Implement card dealing logic
- [ ] Implement trump selection
- [ ] Implement bidding validation (including dealer restriction)
- [ ] Implement card playability rules (follow suit)
- [ ] Implement trick winner determination
- [ ] Implement scoring calculations
- [ ] Implement round progression
- [ ] Write comprehensive tests for all logic

**Deliverable**: Complete game engine with tests

**Time**: 7-10 days (same - core logic is custom)

---

### Phase 5: Server Integration (Week 3) ⬜

**Goal**: Connect client and server with real-time gameplay

**Leverage Existing** (✅):
- Extend existing PartyKit server
- Reuse WebSocket message handling
- Reuse room management
- Reuse event broadcasting

**New Work** (⬜):
- [ ] Create `partykit/src/kachuful/KachufulRoom.ts`
- [ ] Implement Kachuful message handlers
- [ ] Implement game state broadcasting
- [ ] Implement turn management
- [ ] Add error handling and validation
- [ ] Test multiplayer synchronization
- [ ] Handle reconnection

**Deliverable**: Working multiplayer Kachuful game

**Time**: 3-4 days (reduced from 4-5 due to existing server infrastructure)
- [ ] Add error handling and validation
- [ ] Test multiplayer synchronization

**Deliverable**: Working multiplayer game

---

### Phase 6: Animations & Polish (Week 4)

**Goal**: Add animations and improve UX

- [ ] Card dealing animation
- [ ] Trump reveal flip animation
- [ ] Bid placement animation
- [ ] Card play animation (slide to center)
- [ ] Trick winner animation (cards fly)
### Phase 6: Animations & Polish (Week 4) ⬜

**Goal**: Add animations and improve UX

**Leverage Existing** (✅):
- Use react-native-reanimated (already installed)
- Use Tamagui animation system
- Follow existing animation patterns

**New Work** (⬜):
- [ ] Card dealing animation
- [ ] Trump reveal flip animation
- [ ] Bid placement animation
- [ ] Card play animation (slide to center)
- [ ] Trick winner animation (cards fly)
- [ ] Score counting animation
- [ ] Confetti for game winner
- [ ] Sound effects (optional)
- [ ] Loading states and transitions

**Deliverable**: Polished, animated gameplay

**Time**: 3-4 days (reduced from 4-5 due to existing animation utilities)

---

### Phase 7: Advanced Features (Week 4-5) ⬜

**Goal**: Add enhancements and quality-of-life features

**Leverage Existing** (✅):
- Reuse existing UI patterns
- Extend existing state management

**New Work** (⬜):
- [ ] Game tutorial/help screen
- [ ] Settings screen (sound, animations)
- [ ] Game history/statistics
- [ ] Spectator mode
- [ ] Reconnection handling (leverage existing WebSocket reconnection)
- [ ] Offline AI opponents (optional)
- [ ] Achievement system (optional)

**Deliverable**: Feature-complete game

**Time**: 4-6 days (reduced from 5-7 due to reusable patterns)

---

### Phase 8: Testing & Optimization (Week 5) ⬜

**Goal**: Ensure stability and performance

**Leverage Existing** (✅):
- Use existing Vitest setup
- Use existing testing patterns
- Follow existing CI/CD if available

**New Work** (⬜):
- [ ] Comprehensive integration tests
- [ ] Multiplayer stress testing
- [ ] Performance optimization
- [ ] Responsive design validation
- [ ] Cross-platform testing (iOS, Android, Web)
- [ ] Bug fixes
- [ ] Documentation

**Deliverable**: Production-ready game

**Time**: 5-7 days (same - thorough testing required)

---

## Updated Timeline Summary

| Phase | What | Days | Status |
|-------|------|------|--------|
| Phase 0 | Infrastructure | - | ✅ COMPLETE |
| Phase 1 | Foundation | 2-3 | ⬜ NEXT |
| Phase 2 | Lobby Integration | 1-2 | ⬜ |
| Phase 3 | Game Screens | 4-5 | ⬜ |
| Phase 4 | Core Logic | 7-10 | ⬜ |
| Phase 5 | Server Integration | 3-4 | ⬜ |
| Phase 6 | Animations | 3-4 | ⬜ |
| Phase 7 | Advanced Features | 4-6 | ⬜ |
| Phase 8 | Testing | 5-7 | ⬜ |

**Total**: ~30-45 days (4-6 weeks)

**Savings**: 1-2 weeks saved by leveraging existing infrastructure!

---

## Testing Strategy

### Unit Tests

```typescript
// Card utilities
describe('createDeck', () => {
  it('creates a 52-card deck', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
  })
})

// Game logic
describe('determineTrickWinner', () => {
  it('trump card beats non-trump', () => {
    const winner = determineTrickWinner(
      [
        { card: { suit: 'hearts', rank: 'A' }, playerId: 'p1' },
        { card: { suit: 'spades', rank: '2' }, playerId: 'p2' }
      ],
      'hearts',
      'spades'
    )
    expect(winner).toBe('p2')
  })
})

// Scoring
describe('calculateRoundScore', () => {
  it('awards 10 + bid*5 for successful bid', () => {
    const score = calculateRoundScore(3, 3, 'standard')
    expect(score).toBe(25) // 10 + 3*5
  })
  
  it('penalizes -(diff*5) for failed bid', () => {
    const score = calculateRoundScore(3, 1, 'standard')
    expect(score).toBe(-10) // -(|3-1|*5)
  })
})
```

### Integration Tests

```typescript
describe('Kachuful Game Flow', () => {
  it('completes a full round', async () => {
    // Create lobby
    // Start game
    // Deal cards
    // Reveal trump
    // Place bids
    // Play tricks
    // Calculate scores
    // Verify results
  })
})
```

### Manual Testing Checklist

- [ ] Lobby creation and joining
- [ ] Starting game with 3-7 players
- [ ] Card dealing animation
- [ ] Trump reveal (including no-trump)
- [ ] All bidding scenarios (including dealer restriction)
- [ ] Following suit rules
- [ ] Trump beating non-trump
- [ ] Trick winner determination
- [ ] Score calculation (success and failure)
- [ ] Round progression (ascending)
- [ ] Round progression (descending)
- [ ] Game end and winner announcement
- [ ] Disconnection handling
- [ ] Reconnection
- [ ] Multiple simultaneous games

---

## Performance Considerations

### Optimization Strategies

1. **Card Rendering**: Use memoization for card components
2. **State Updates**: Batch updates to minimize re-renders
3. **Animations**: Use native driver for animations
4. **Images**: Vector graphics for cards (SVG)
5. **Network**: Minimize message size, use compression
6. **Memory**: Clean up completed games

### Metrics to Monitor

- **Frame Rate**: Maintain 60 FPS during animations
- **Network Latency**: <100ms for actions
- **Bundle Size**: Keep under 5MB
- **Memory Usage**: Monitor for leaks
- **Load Time**: Initial screen <2 seconds

---

## Deployment Plan

### Development Environment

- **Local Testing**: Use localhost PartyKit server
- **Dev Server**: Deploy to PartyKit dev environment
- **CI/CD**: GitHub Actions for automated testing

### Production Environment

- **Server**: Deploy PartyKit to production
- **Client**: Build optimized React Native bundle
- **Monitoring**: Set up error tracking (Sentry)
- **Analytics**: Track user engagement (optional)

### Rollout Strategy

1. **Alpha**: Internal testing with team
2. **Beta**: Limited release to test users
3. **Soft Launch**: Gradual rollout
4. **Full Launch**: Public release

---

## Maintenance & Future Enhancements

### Planned Features (Post-Launch)

- **Tournaments**: Organized competitive play
- **Leaderboards**: Global rankings
- **Friends System**: Invite and play with friends
- **Customization**: Card backs, themes, avatars
- **Chat**: In-game messaging
- **Replays**: Watch past games
- **Tutorial**: Interactive learning mode
- **AI Difficulty**: Multiple AI skill levels

### Technical Debt

- Refactor duplicated code
- Improve test coverage (target 80%+)
- Document complex algorithms
- Optimize bundle size
- Add comprehensive error logging

---

This roadmap provides a complete blueprint for implementing the Kachuful card game from conception to production-ready deployment.
