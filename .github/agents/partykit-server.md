# PartyKit Server Development Guide

## Overview

This guide covers development of the Card Masters multiplayer game server built with PartyKit. The server handles real-time WebSocket connections, lobby management, game state synchronization, and turn-based gameplay.

## Server Architecture

### Core Components

```
partykit/
├── src/
│   ├── server.ts        # Main CardMastersServer class
│   ├── types.ts         # Type definitions (mirrored in app/types/game.ts)
│   └── utils.ts         # Lobby code generation and validation
├── partykit.json        # Server configuration
└── package.json
```

### Key Concepts

1. **Rooms** - Each game lobby is a separate PartyKit room instance
2. **Connections** - Each player has a WebSocket connection with unique ID
3. **State** - Game state is maintained in memory per room
4. **Broadcasting** - Server broadcasts state changes to all connected clients

## Development Setup

### Local Development

```bash
# Navigate to partykit directory
cd partykit

# Install dependencies
yarn install

# Start development server (runs on http://localhost:1999)
yarn dev

# Build for production
yarn build

# Deploy to PartyKit cloud
yarn deploy
```

### Environment Configuration

For the Expo app to connect to the local server, set in `app/.env`:
```bash
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

For production:
```bash
EXPO_PUBLIC_PARTYKIT_HOST=your-project.partykit.dev
```

## Server Implementation

### CardMastersServer Class

```typescript
export default class CardMastersServer implements Party.Server {
  gameState: GameState
  
  constructor(readonly room: Party.Room) {
    // Initialize lobby state with unique code
  }
  
  async onConnect(conn: Party.Connection) {
    // Handle new player connection
  }
  
  async onMessage(message: string, sender: Party.Connection) {
    // Route client messages to handlers
  }
  
  async onClose(conn: Party.Connection) {
    // Handle player disconnection
  }
}
```

### Lobby System Features

#### 1. Lobby Creation (Host)

```typescript
private handleCreateLobby(conn: Party.Connection, payload: CreateLobbyPayload) {
  // Generate 6-character code (ABC123 format)
  // Create host player with isHost: true
  // Initialize game state
  // Send lobby_created message with code
}
```

**Validation**:
- Check if lobby already has players
- Generate unique alphanumeric code
- Set max players (default 4)

#### 2. Lobby Join (Players)

```typescript
private handleJoinLobby(conn: Party.Connection, payload: JoinLobbyPayload) {
  // Verify lobby code matches
  // Check if lobby is full
  // Check if game already started
  // Add player to lobby
  // Broadcast player_joined event
}
```

**Validation**:
- Lobby code must match
- Lobby must not be full
- Game status must be 'lobby'
- Player not already in lobby

#### 3. Host Controls

```typescript
// Start game
private handleStartGame(conn: Party.Connection) {
  // Only host can start
  // Requires minimum 2 players
  // Deal cards and begin gameplay
}

// Kick player
private handleKickPlayer(conn: Party.Connection, payload: KickPlayerPayload) {
  // Only host can kick
  // Cannot kick host
  // Remove player and close connection
}
```

#### 4. Auto-Cleanup

```typescript
async onClose(conn: Party.Connection) {
  // Mark player as disconnected
  // Remove player from lobby
  // If lobby empty → destroy lobby
  // If host left → migrate host to oldest player
  // Broadcast updated state
}
```

### Game State Management

#### GameState Structure

```typescript
interface GameState {
  lobbyCode: string          // 6-char code (ABC123)
  hostId: string             // Connection ID of host
  status: GameStatus         // 'lobby' | 'starting' | 'playing' | 'finished'
  players: Player[]          // Array of players
  currentTurn: string | null // ID of player whose turn it is
  round: number              // Current round number
  maxPlayers: number         // Maximum players allowed
  createdAt: number          // Timestamp
  startedAt: number | null   // Game start timestamp
}
```

#### State Broadcasting

```typescript
// Broadcast to all players
private broadcastGameState(exclude?: string[]) {
  this.broadcastMessage({
    type: 'game_state',
    payload: this.gameState,
    timestamp: Date.now(),
  }, exclude)
}

// Send to specific player
private sendToConnection(conn: Party.Connection, message: ServerMessage) {
  conn.send(JSON.stringify(message))
}
```

### Message Handling

#### Client → Server Messages

```typescript
type ClientMessageType = 
  | 'create_lobby'  // Host creates new lobby
  | 'join_lobby'    // Player joins with code
  | 'leave_lobby'   // Player leaves lobby
  | 'start_game'    // Host starts game (min 2 players)
  | 'ready'         // Player marks ready
  | 'play_card'     // Player plays card during turn
  | 'chat'          // Send chat message
  | 'kick_player'   // Host kicks player
```

#### Server → Client Messages

```typescript
type ServerMessageType = 
  | 'lobby_created'    // Lobby created with code
  | 'lobby_joined'     // Successfully joined lobby
  | 'game_state'       // Full state update
  | 'player_joined'    // New player joined
  | 'player_left'      // Player left
  | 'player_kicked'    // Player was kicked
  | 'host_changed'     // Host migrated to new player
  | 'turn_update'      // Turn changed
  | 'game_started'     // Game began
  | 'game_ended'       // Game finished with winner
  | 'lobby_destroyed'  // Lobby was destroyed
  | 'error'            // Error message
  | 'chat'             // Chat message broadcast
```

### Game Flow Implementation

#### 1. Lobby Phase

```typescript
// Status: 'lobby'
// Players can join, leave
// Host can kick players
// Host can start when >= 2 players
```

#### 2. Starting Phase

```typescript
private startGame() {
  this.gameState.status = 'starting'
  this.gameState.startedAt = Date.now()
  
  // Deal 5 cards to each player
  this.gameState.players.forEach(player => {
    player.status = 'playing'
    player.cards = this.dealCards(5)
  })
  
  // Set first turn (host)
  this.gameState.currentTurn = this.gameState.hostId
  this.gameState.status = 'playing'
  this.gameState.round = 1
  
  this.broadcastMessage({
    type: 'game_started',
    payload: { round: 1, currentTurn: this.gameState.currentTurn },
    timestamp: Date.now(),
  })
}
```

#### 3. Playing Phase

```typescript
private handlePlayCard(conn: Party.Connection, payload: PlayCardPayload) {
  // Verify it's player's turn
  // Verify card is in hand
  // Remove card from hand
  // Award points
  // Move to next turn
  // Check win condition
}

private nextTurn() {
  // Round-robin turn order
  // Increment round when back to first player
  // Check if any player reached 100 points → endGame()
}
```

#### 4. End Phase

```typescript
private endGame() {
  this.gameState.status = 'finished'
  
  const winner = this.gameState.players.reduce((prev, current) => 
    prev.score > current.score ? prev : current
  )
  
  this.broadcastMessage({
    type: 'game_ended',
    payload: {
      winner: winner.id,
      finalScores: this.gameState.players.map(p => ({ 
        id: p.id, 
        name: p.name, 
        score: p.score 
      })),
    },
    timestamp: Date.now(),
  })
}
```

### Host Migration

When the host disconnects:

```typescript
private migrateHost() {
  // Find oldest player (by joinedAt timestamp)
  const newHost = this.gameState.players
    .filter(p => p.id !== oldHostId)
    .sort((a, b) => a.joinedAt - b.joinedAt)[0]
  
  // Update old host
  if (oldHost) oldHost.isHost = false
  
  // Set new host
  newHost.isHost = true
  this.gameState.hostId = newHost.id
  
  // Broadcast host_changed event
}
```

### Utilities

#### Lobby Code Generation

```typescript
// Generate ABC123 format (3 letters + 3 numbers)
export function generateLobbyCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Exclude I, O
  const numbers = '23456789' // Exclude 0, 1
  
  let code = ''
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return code
}
```

#### Validation

```typescript
export function isValidLobbyCode(code: string): boolean {
  const pattern = /^[A-Z]{3}[2-9]{3}$/
  return pattern.test(code.toUpperCase())
}
```

## Best Practices

### 1. State Consistency

✅ **Always broadcast state after mutations**
```typescript
this.gameState.players.push(newPlayer)
this.broadcastGameState() // ← Don't forget!
```

❌ **Don't mutate state without broadcasting**
```typescript
this.gameState.players.push(newPlayer)
// Missing broadcast - clients won't see update!
```

### 2. Validation

✅ **Validate all actions**
```typescript
private handleStartGame(conn: Party.Connection) {
  const player = this.findPlayer(conn.id)
  
  if (!player) {
    this.sendError(conn, 'Player not found')
    return
  }
  
  if (!player.isHost) {
    this.sendError(conn, 'Only host can start game')
    return
  }
  
  if (this.gameState.players.length < 2) {
    this.sendError(conn, 'Need at least 2 players')
    return
  }
  
  // Proceed with start
}
```

### 3. Error Handling

```typescript
async onMessage(message: string, sender: Party.Connection) {
  try {
    const msg: ClientMessage = JSON.parse(message)
    // Handle message...
  } catch (error) {
    console.error('[Server] Error processing message:', error)
    this.sendError(sender, 'Invalid message format')
  }
}
```

### 4. Cleanup

```typescript
async onClose(conn: Party.Connection) {
  // 1. Mark player as disconnected
  // 2. Remove from players array
  // 3. Check if lobby empty → destroy
  // 4. Check if host left → migrate
  // 5. Broadcast updated state
}
```

### 5. Logging

```typescript
// Use consistent logging format
console.log('[Server] New connection:', conn.id, 'to room:', this.room.id)
console.log('[Server] Message from', sender.id, ':', msg.type)
console.log('[Server] Creating lobby for host:', payload.hostName)
```

## Testing Strategies

### Local Testing

1. **Start server**: `yarn dev` in `partykit/`
2. **Start app**: `yarn start` in `app/` with `EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999`
3. **Test scenarios**:
   - Create lobby and verify code generation
   - Join lobby from second device/browser
   - Test host controls (start game, kick player)
   - Test disconnection handling
   - Test game flow (turns, scoring, win condition)

### Debugging

```typescript
// Add debug logging
private handleJoinLobby(conn: Party.Connection, payload: JoinLobbyPayload) {
  console.log('[DEBUG] Join attempt:', {
    providedCode: payload.lobbyCode,
    actualCode: this.gameState.lobbyCode,
    playerCount: this.gameState.players.length,
    maxPlayers: this.gameState.maxPlayers,
    status: this.gameState.status,
  })
  // ...
}
```

## Common Issues & Solutions

### Issue: Players can't join lobby

**Check**:
- Lobby code matches (case-insensitive)
- Lobby not full (`players.length < maxPlayers`)
- Game status is still 'lobby'
- Player not already in lobby

### Issue: Host migration not working

**Check**:
- Players have `joinedAt` timestamps
- Filter correctly excludes old host
- New host gets `isHost: true`
- Old host gets `isHost: false`
- `hostId` updated in game state

### Issue: State not syncing to clients

**Check**:
- `broadcastGameState()` called after mutations
- WebSocket connection is open
- Message is properly serialized with `JSON.stringify()`
- Client is listening to correct event types

### Issue: Cards not dealing properly

**Check**:
- `dealCards()` returns array of unique card IDs
- Each player gets cards in `player.cards`
- Cards don't duplicate across players
- Turn is set correctly after dealing

## Performance Considerations

### Room Limits

- Each room = one game lobby
- Rooms auto-destroy when empty
- Consider max players per room (default 4)

### State Size

- Keep state minimal (no unnecessary data)
- Remove players immediately on disconnect
- Clear finished games after reasonable time

### Broadcasting

- Use `exclude` parameter to avoid sending to specific players
- Only broadcast when state actually changes
- Consider debouncing rapid state changes

## Deployment

### Deploy to PartyKit Cloud

```bash
cd partykit
yarn deploy
```

Your server will be available at: `https://your-project.partykit.dev`

### Update App Configuration

Update `app/.env`:
```bash
EXPO_PUBLIC_PARTYKIT_HOST=your-project.partykit.dev
```

### Monitoring

- Check PartyKit dashboard for active rooms
- Monitor connection counts
- Review error logs
- Track room lifecycle (created, active, destroyed)

## Extending the Server

### Adding New Message Types

1. **Update types.ts**:
```typescript
export interface ClientMessage {
  type: 'create_lobby' | 'join_lobby' | ... | 'new_action'
  payload: ... | NewActionPayload
}
```

2. **Add handler**:
```typescript
async onMessage(message: string, sender: Party.Connection) {
  // ...
  case 'new_action':
    this.handleNewAction(sender, msg.payload as NewActionPayload)
    break
}
```

3. **Implement handler**:
```typescript
private handleNewAction(conn: Party.Connection, payload: NewActionPayload) {
  // Validate
  // Mutate state
  // Broadcast
}
```

4. **Mirror in app/types/game.ts**

### Adding New Game Mechanics

Example: Power-up cards

```typescript
interface Player {
  // ... existing fields
  powerups: string[]  // Add new field
}

private handleUsePowerup(conn: Party.Connection, payload: UsePowerupPayload) {
  const player = this.findPlayer(conn.id)
  
  if (!player.powerups.includes(payload.powerupId)) {
    this.sendError(conn, 'Powerup not available')
    return
  }
  
  // Apply powerup effect
  this.applyPowerup(player, payload.powerupId)
  
  // Remove from inventory
  player.powerups = player.powerups.filter(p => p !== payload.powerupId)
  
  this.broadcastGameState()
}
```

## Reference

- **PartyKit Docs**: https://docs.partykit.io/
- **WebSocket Spec**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **Server Code**: `partykit/src/server.ts`
- **Type Definitions**: `partykit/src/types.ts`
- **Client Integration**: See `.github/agents/game-integration.md`
