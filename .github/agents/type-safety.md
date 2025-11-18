# Type Safety and Shared Types Guide

## Overview

Maintaining type synchronization between the Expo frontend and PartyKit server is critical for reliable multiplayer functionality. This guide covers type management, validation, and best practices.

## Type Architecture

### Dual Type System

Types are **duplicated** in two locations:

1. **Server**: `partykit/src/types.ts` - Server-side types
2. **Client**: `app/types/game.ts` - Client-side types

**Why duplicate?** 
- Server and client are separate packages
- No shared package dependencies
- Ensures each side can build independently

### Keeping Types in Sync

**Critical Rule**: When you modify types in one location, **immediately** update the other.

```typescript
// ✅ Correct workflow
1. Modify partykit/src/types.ts
2. Copy changes to app/types/game.ts
3. Update server logic (partykit/src/server.ts)
4. Update client logic (app/utils/gameClient.ts)
5. Test both sides
```

## Core Type Definitions

### Game Status

```typescript
export type GameStatus = 'lobby' | 'starting' | 'playing' | 'finished'
```

- **lobby**: Waiting for players to join
- **starting**: Game initialization in progress
- **playing**: Active gameplay
- **finished**: Game completed with winner

### Player Status

```typescript
export type PlayerStatus = 'connected' | 'ready' | 'playing' | 'disconnected'
```

- **connected**: In lobby, not ready
- **ready**: Marked ready to start
- **playing**: Currently in game
- **disconnected**: Connection lost

### Player

```typescript
export interface Player {
  id: string              // Connection ID
  name: string            // Display name
  status: PlayerStatus    // Current status
  score: number           // Game score
  cards: string[]         // Card IDs in hand
  avatar?: string         // Emoji avatar
  isHost: boolean         // Host privileges
  joinedAt: number        // Timestamp joined
}
```

### GameState

```typescript
export interface GameState {
  lobbyCode: string          // 6-char code (ABC123)
  hostId: string             // Host player ID
  status: GameStatus         // Current game phase
  players: Player[]          // All players
  currentTurn: string | null // ID of player whose turn
  round: number              // Current round
  maxPlayers: number         // Max allowed players
  createdAt: number          // Lobby creation time
  startedAt: number | null   // Game start time
}
```

### LobbyInfo

```typescript
export interface LobbyInfo {
  code: string          // Lobby code
  hostId: string        // Host player ID
  hostName: string      // Host display name
  playerCount: number   // Current player count
  maxPlayers: number    // Max players allowed
  createdAt: number     // Creation timestamp
  status: GameStatus    // Current status
}
```

## Message Types

### Client Messages

```typescript
export interface ClientMessage {
  type: ClientMessageType
  payload: 
    | CreateLobbyPayload 
    | JoinLobbyPayload 
    | PlayCardPayload 
    | ChatPayload 
    | KickPlayerPayload 
    | Record<string, unknown>
}

export type ClientMessageType = 
  | 'create_lobby'   // Host creates lobby
  | 'join_lobby'     // Player joins with code
  | 'leave_lobby'    // Player leaves
  | 'start_game'     // Host starts game
  | 'ready'          // Player marks ready
  | 'play_card'      // Play card action
  | 'chat'           // Send chat message
  | 'kick_player'    // Host kicks player
```

### Server Messages

```typescript
export interface ServerMessage {
  type: ServerMessageType
  payload: 
    | LobbyInfo 
    | GameState 
    | Player 
    | ChatPayload 
    | { message: string } 
    | Record<string, unknown>
  timestamp: number  // Server timestamp
}

export type ServerMessageType = 
  | 'lobby_created'    // Lobby created response
  | 'lobby_joined'     // Join success
  | 'game_state'       // Full state update
  | 'player_joined'    // New player joined
  | 'player_left'      // Player left
  | 'player_kicked'    // Player was kicked
  | 'host_changed'     // Host migrated
  | 'turn_update'      // Turn changed
  | 'game_started'     // Game began
  | 'game_ended'       // Game finished
  | 'lobby_destroyed'  // Lobby destroyed
  | 'error'            // Error message
  | 'chat'             // Chat broadcast
```

## Payload Types

### CreateLobbyPayload

```typescript
export interface CreateLobbyPayload {
  hostName: string      // Host's display name
  maxPlayers?: number   // Max players (default 4)
  avatar?: string       // Emoji avatar
}
```

### JoinLobbyPayload

```typescript
export interface JoinLobbyPayload {
  lobbyCode: string   // 6-char lobby code
  playerName: string  // Player display name
  avatar?: string     // Emoji avatar
}
```

### PlayCardPayload

```typescript
export interface PlayCardPayload {
  cardId: string            // Card to play
  targetPlayerId?: string   // Optional target player
}
```

### ChatPayload

```typescript
export interface ChatPayload {
  message: string       // Chat message text
  playerId?: string     // Sender ID (added by server)
  playerName?: string   // Sender name (added by server)
}
```

### KickPlayerPayload

```typescript
export interface KickPlayerPayload {
  playerId: string   // ID of player to kick
}
```

## Adding New Types

### Workflow for Adding a New Message Type

**Example**: Adding a "use_powerup" action

#### Step 1: Define Payload Type

Add to both `partykit/src/types.ts` and `app/types/game.ts`:

```typescript
export interface UsePowerupPayload {
  powerupId: string
  targetPlayerId?: string
}
```

#### Step 2: Update ClientMessage Type

```typescript
export interface ClientMessage {
  type: 
    | 'create_lobby' 
    | 'join_lobby' 
    // ... existing types
    | 'use_powerup'  // ← Add new type
  payload: 
    | CreateLobbyPayload 
    | JoinLobbyPayload 
    // ... existing payloads
    | UsePowerupPayload  // ← Add new payload
    | Record<string, unknown>
}
```

#### Step 3: Update ServerMessage Type (if needed)

If server needs to broadcast powerup usage:

```typescript
export interface ServerMessage {
  type: 
    | 'lobby_created' 
    | 'lobby_joined' 
    // ... existing types
    | 'powerup_used'  // ← Add new type
  payload: 
    | LobbyInfo 
    | GameState 
    // ... existing payloads
    | { playerId: string; powerupId: string }  // ← Add payload type
    | Record<string, unknown>
  timestamp: number
}
```

#### Step 4: Update Server Handler

In `partykit/src/server.ts`:

```typescript
async onMessage(message: string, sender: Party.Connection) {
  try {
    const msg: ClientMessage = JSON.parse(message)
    
    switch (msg.type) {
      // ... existing cases
      case 'use_powerup':
        this.handleUsePowerup(sender, msg.payload as UsePowerupPayload)
        break
    }
  } catch (error) {
    // ...
  }
}

private handleUsePowerup(conn: Party.Connection, payload: UsePowerupPayload) {
  // Validate and handle
  const player = this.findPlayer(conn.id)
  
  // ... implementation
  
  this.broadcastMessage({
    type: 'powerup_used',
    payload: { playerId: conn.id, powerupId: payload.powerupId },
    timestamp: Date.now(),
  })
}
```

#### Step 5: Update Client Methods

In `app/utils/gameClient.ts`:

```typescript
export class GameClient {
  // ... existing methods
  
  /**
   * Use powerup
   */
  usePowerup(powerupId: string, targetPlayerId?: string) {
    this.send({
      type: 'use_powerup',
      payload: { powerupId, targetPlayerId } as UsePowerupPayload,
    })
  }
}

// Update hook
export function useGameClient(host: string, roomId: string) {
  // ... existing code
  
  const usePowerup = useCallback(
    (powerupId: string, target?: string) => 
      clientRef.current?.usePowerup(powerupId, target), 
    []
  )
  
  return {
    // ... existing returns
    usePowerup,
  }
}
```

#### Step 6: Test Both Sides

```typescript
// Test server handling
// Send message from client and verify server response

// Test client sending
const { usePowerup } = useGameClient(host, room)
usePowerup('speed-boost', 'player-2')

// Test server broadcasting
on('powerup_used', (data) => {
  console.log('Powerup used:', data)
})
```

## Type Validation

### Runtime Validation

TypeScript only validates at compile time. Add runtime checks for critical data:

```typescript
// Server-side validation
private handleJoinLobby(conn: Party.Connection, payload: JoinLobbyPayload) {
  // Validate payload shape
  if (!payload || typeof payload.lobbyCode !== 'string') {
    this.sendError(conn, 'Invalid payload')
    return
  }
  
  if (!payload.playerName || payload.playerName.trim().length === 0) {
    this.sendError(conn, 'Player name required')
    return
  }
  
  // Proceed with logic
}
```

### Client-Side Validation

```typescript
// Validate before sending
export class GameClient {
  joinLobby(lobbyCode: string, playerName: string, avatar?: string) {
    // Validate inputs
    if (!lobbyCode || lobbyCode.length !== 6) {
      throw new Error('Invalid lobby code format')
    }
    
    if (!playerName || playerName.trim().length === 0) {
      throw new Error('Player name required')
    }
    
    this.send({
      type: 'join_lobby',
      payload: { lobbyCode, playerName, avatar } as JoinLobbyPayload,
    })
  }
}
```

## Type Guards

Use type guards for discriminated unions:

```typescript
function isGameState(payload: unknown): payload is GameState {
  const state = payload as GameState
  return (
    typeof state.lobbyCode === 'string' &&
    typeof state.hostId === 'string' &&
    Array.isArray(state.players) &&
    typeof state.status === 'string'
  )
}

// Usage
on('game_state', (payload) => {
  if (isGameState(payload)) {
    // TypeScript knows this is GameState
    console.log(payload.players.length)
  }
})
```

## Best Practices

### 1. Always Use Types

✅ **Correct**
```typescript
import type { GameState, Player } from 'types/game'

const [gameState, setGameState] = useState<GameState | null>(null)

on('game_state', (state: GameState) => {
  setGameState(state)
})
```

❌ **Avoid**
```typescript
const [gameState, setGameState] = useState(null)

on('game_state', (state: any) => {
  setGameState(state)
})
```

### 2. Explicit Type Assertions

✅ **Correct**
```typescript
this.send({
  type: 'play_card',
  payload: { cardId, targetPlayerId } as PlayCardPayload,
})
```

❌ **Avoid**
```typescript
this.send({
  type: 'play_card',
  payload: { cardId, targetPlayerId },
})
```

### 3. Sync Types Immediately

✅ **Correct Workflow**
```bash
# 1. Update server types
vim partykit/src/types.ts

# 2. Immediately update client types
vim app/types/game.ts

# 3. Update server logic
vim partykit/src/server.ts

# 4. Update client logic
vim app/utils/gameClient.ts

# 5. Test
yarn dev  # in both directories
```

### 4. Document Complex Types

```typescript
/**
 * Represents a player in the game.
 * - `id`: Unique connection ID from PartyKit
 * - `name`: Player's display name (max 20 chars)
 * - `status`: Current player state
 * - `cards`: Array of card IDs in player's hand
 * - `isHost`: Whether this player is the lobby host
 */
export interface Player {
  id: string
  name: string
  status: PlayerStatus
  score: number
  cards: string[]
  avatar?: string
  isHost: boolean
  joinedAt: number
}
```

### 5. Use Enums for Constants

Instead of string literals everywhere:

```typescript
// Instead of this
type GameStatus = 'lobby' | 'starting' | 'playing' | 'finished'

// Consider this
export enum GameStatus {
  Lobby = 'lobby',
  Starting = 'starting',
  Playing = 'playing',
  Finished = 'finished',
}

// Usage
if (gameState.status === GameStatus.Playing) {
  // ...
}
```

## Type Checking Workflow

### Before Committing

```bash
# Check server types
cd partykit
npx tsc --noEmit

# Check client types
cd ../app
npx tsc --noEmit
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Type check server
  run: |
    cd partykit
    yarn install
    npx tsc --noEmit

- name: Type check client
  run: |
    cd app
    yarn install
    npx tsc --noEmit
```

## Common Type Errors

### Error: Property does not exist

```typescript
// Error: Property 'cards' does not exist on type 'Player'
player.cards.push(newCard)
```

**Cause**: Types are out of sync

**Fix**: Ensure `Player` interface includes `cards: string[]` in both files

### Error: Type 'X' is not assignable to type 'Y'

```typescript
// Error: Type 'string' is not assignable to type 'PlayerStatus'
player.status = 'active'
```

**Cause**: Using invalid value for typed field

**Fix**: Use valid type value
```typescript
player.status = 'playing' as PlayerStatus
```

### Error: Argument of type 'unknown' is not assignable

```typescript
// Error when calling handler
on('game_state', (state) => {
  console.log(state.players)  // Error: state is unknown
})
```

**Fix**: Add type annotation
```typescript
on('game_state', (state: GameState) => {
  console.log(state.players)  // OK
})
```

## Type Migration Checklist

When modifying existing types:

- [ ] Update `partykit/src/types.ts`
- [ ] Update `app/types/game.ts` (mirror changes)
- [ ] Update server handlers (`partykit/src/server.ts`)
- [ ] Update client methods (`app/utils/gameClient.ts`)
- [ ] Update UI components using the types
- [ ] Run type checks on both server and client
- [ ] Test end-to-end functionality
- [ ] Update documentation/comments
- [ ] Commit with descriptive message

## Type Safety Tools

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.strictNullChecks": true,
  "typescript.preferences.noImplicitAny": true
}
```

### TypeScript Config

Both `partykit/tsconfig.json` and `app/tsconfig.json` should have:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Reference

- **Server Types**: `partykit/src/types.ts`
- **Client Types**: `app/types/game.ts`
- **Server Implementation**: `partykit/src/server.ts`
- **Client Implementation**: `app/utils/gameClient.ts`
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
