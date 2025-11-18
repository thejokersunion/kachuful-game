# Game Integration Guide: Client-Server Communication

## Overview

This guide covers integrating the Expo/Tamagui frontend with the PartyKit multiplayer server. It focuses on WebSocket communication, state synchronization, and real-time game interactions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Expo App                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Game Screen Components                               │  │
│  │  (Lobby, GameBoard, PlayerList, etc.)                 │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │  useGameClient() Hook                                 │  │
│  │  - State management                                   │  │
│  │  - Event handling                                     │  │
│  │  - UI updates                                         │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │  GameClient Class (utils/gameClient.ts)              │  │
│  │  - WebSocket connection                               │  │
│  │  - Message serialization                              │  │
│  │  - Event emitter                                      │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ WebSocket
                            │ (JSON messages)
┌───────────────────────────▼──────────────────────────────────┐
│                   PartyKit Server                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CardMastersServer                                    │  │
│  │  - Lobby management                                   │  │
│  │  - Game state                                         │  │
│  │  - Message routing                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## Client Setup

### GameClient Class

Located at `app/utils/gameClient.ts`, this class wraps PartySocket and provides:

- Connection management
- Type-safe message sending
- Event-driven architecture
- Automatic reconnection

```typescript
import { GameClient } from 'utils/gameClient'

// Create client instance
const client = new GameClient(
  'your-project.partykit.dev', // host
  'ABC123'                     // room ID (lobby code)
)

// Connect
client.connect()

// Send messages
client.createLobby('PlayerName', 4, '🎮')
client.joinLobby('ABC123', 'PlayerName', '🎲')
client.startGame()
client.playCard('card-123')

// Listen to events
client.on('game_state', (state: GameState) => {
  console.log('Game state updated:', state)
})

// Disconnect
client.disconnect()
```

### useGameClient Hook

React hook for using GameClient in components:

```typescript
import { useGameClient } from 'utils/gameClient'

function LobbyScreen() {
  const {
    client,
    isConnected,
    createLobby,
    joinLobby,
    startGame,
    on,
    off,
  } = useGameClient(
    process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999',
    'ABC123'
  )
  
  // Subscribe to events
  useEffect(() => {
    const handleGameState = (state: GameState) => {
      setGameState(state)
    }
    
    on('game_state', handleGameState)
    return () => off('game_state', handleGameState)
  }, [on, off])
  
  // Use client methods
  const handleCreate = () => {
    createLobby('Alice', 4, '👑')
  }
  
  return <Button onPress={handleCreate}>Create Lobby</Button>
}
```

## Message Flow

### Client → Server

All client messages follow this structure:

```typescript
interface ClientMessage {
  type: MessageType
  payload: TypedPayload
}
```

#### Example: Creating a Lobby

```typescript
// Frontend code
createLobby('Alice', 4, '👑')

// Serialized message sent to server
{
  "type": "create_lobby",
  "payload": {
    "hostName": "Alice",
    "maxPlayers": 4,
    "avatar": "👑"
  }
}
```

#### Example: Playing a Card

```typescript
// Frontend code
playCard('attack-5-123456', 'player-2')

// Serialized message sent to server
{
  "type": "play_card",
  "payload": {
    "cardId": "attack-5-123456",
    "targetPlayerId": "player-2"
  }
}
```

### Server → Client

All server messages include a timestamp:

```typescript
interface ServerMessage {
  type: MessageType
  payload: TypedPayload
  timestamp: number
}
```

#### Example: Game State Update

```typescript
// Server sends
{
  "type": "game_state",
  "payload": {
    "lobbyCode": "ABC123",
    "hostId": "conn-1",
    "status": "playing",
    "players": [...],
    "currentTurn": "conn-1",
    "round": 2,
    "maxPlayers": 4,
    "createdAt": 1637000000000,
    "startedAt": 1637000001000
  },
  "timestamp": 1637000002000
}

// Client receives and emits event
client.on('game_state', (state: GameState) => {
  // Update UI with new state
})
```

#### Example: Player Joined

```typescript
// Server sends
{
  "type": "player_joined",
  "payload": {
    "id": "conn-2",
    "name": "Bob",
    "status": "connected",
    "score": 0,
    "cards": [],
    "avatar": "🎲",
    "isHost": false,
    "joinedAt": 1637000001500
  },
  "timestamp": 1637000001500
}

// Client handles
client.on('player_joined', (player: Player) => {
  console.log(`${player.name} joined the lobby!`)
  // Show toast notification
})
```

## Event Handling Patterns

### Pattern 1: State Synchronization

Keep local state in sync with server state:

```typescript
function GameScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const { on, off } = useGameClient(host, roomId)
  
  useEffect(() => {
    const handleGameState = (state: GameState) => {
      setGameState(state)
    }
    
    on('game_state', handleGameState)
    return () => off('game_state', handleGameState)
  }, [on, off])
  
  return (
    <YStack>
      {gameState?.players.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </YStack>
  )
}
```

### Pattern 2: Event-Driven UI Updates

Show notifications/toasts for game events:

```typescript
function GameScreen() {
  const { on, off } = useGameClient(host, roomId)
  
  useEffect(() => {
    const handlePlayerJoined = (player: Player) => {
      toast.show({
        title: 'Player Joined',
        message: `${player.name} joined the lobby`,
        preset: 'done',
      })
    }
    
    const handlePlayerLeft = (data: { playerName: string }) => {
      toast.show({
        title: 'Player Left',
        message: `${data.playerName} left the lobby`,
        preset: 'none',
      })
    }
    
    on('player_joined', handlePlayerJoined)
    on('player_left', handlePlayerLeft)
    
    return () => {
      off('player_joined', handlePlayerJoined)
      off('player_left', handlePlayerLeft)
    }
  }, [on, off])
  
  // ... component JSX
}
```

### Pattern 3: Error Handling

Handle server errors gracefully:

```typescript
function LobbyScreen() {
  const { on, off, joinLobby } = useGameClient(host, roomId)
  
  useEffect(() => {
    const handleError = (error: { message: string }) => {
      toast.show({
        title: 'Error',
        message: error.message,
        preset: 'error',
      })
    }
    
    on('error', handleError)
    return () => off('error', handleError)
  }, [on, off])
  
  const handleJoin = (code: string) => {
    // Validate code format first
    if (!isValidLobbyCode(code)) {
      toast.show({
        title: 'Invalid Code',
        message: 'Lobby code must be 6 characters (ABC123)',
        preset: 'error',
      })
      return
    }
    
    joinLobby(code, playerName, avatar)
  }
  
  // ... component JSX
}
```

### Pattern 4: Connection Status

Show connection status in UI:

```typescript
function GameScreen() {
  const { isConnected, on, off } = useGameClient(host, roomId)
  
  return (
    <YStack>
      {/* Connection indicator */}
      <XStack gap="$2" items="center">
        <Circle
          size={8}
          bg={isConnected ? '$secondary' : '$error'}
        />
        <Paragraph fontSize="$2">
          {isConnected ? 'Connected' : 'Disconnected'}
        </Paragraph>
      </XStack>
      
      {/* Game content */}
      {isConnected ? (
        <GameBoard />
      ) : (
        <Paragraph>Connecting to server...</Paragraph>
      )}
    </YStack>
  )
}
```

## Complete Integration Example

### Lobby Screen with Full Integration

```typescript
import { useState, useEffect } from 'react'
import { YStack, XStack, Card, H3, Button, Input, Paragraph } from 'tamagui'
import { useGameClient } from 'utils/gameClient'
import type { GameState, Player } from 'types/game'

function LobbyScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [lobbyCode, setLobbyCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  
  const {
    isConnected,
    createLobby,
    joinLobby,
    leaveLobby,
    startGame,
    kickPlayer,
    on,
    off,
  } = useGameClient(
    process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999',
    lobbyCode || 'default'
  )
  
  // Subscribe to game state updates
  useEffect(() => {
    const handleGameState = (state: GameState) => {
      setGameState(state)
    }
    
    const handleLobbyCreated = (info: LobbyInfo) => {
      setLobbyCode(info.code)
      setIsHost(true)
      toast.show({
        title: 'Lobby Created',
        message: `Code: ${info.code}`,
        preset: 'done',
      })
    }
    
    const handleLobbyJoined = (state: GameState) => {
      setGameState(state)
      setIsHost(false)
      toast.show({
        title: 'Joined Lobby',
        message: `Code: ${state.lobbyCode}`,
        preset: 'done',
      })
    }
    
    const handlePlayerJoined = (player: Player) => {
      toast.show({
        title: 'Player Joined',
        message: player.name,
        preset: 'done',
      })
    }
    
    const handlePlayerLeft = (data: { playerName: string }) => {
      toast.show({
        title: 'Player Left',
        message: data.playerName,
        preset: 'none',
      })
    }
    
    const handleGameStarted = () => {
      // Navigate to game board
      router.push('/game')
    }
    
    const handleError = (error: { message: string }) => {
      toast.show({
        title: 'Error',
        message: error.message,
        preset: 'error',
      })
    }
    
    // Subscribe to all events
    on('game_state', handleGameState)
    on('lobby_created', handleLobbyCreated)
    on('lobby_joined', handleLobbyJoined)
    on('player_joined', handlePlayerJoined)
    on('player_left', handlePlayerLeft)
    on('game_started', handleGameStarted)
    on('error', handleError)
    
    // Cleanup subscriptions
    return () => {
      off('game_state', handleGameState)
      off('lobby_created', handleLobbyCreated)
      off('lobby_joined', handleLobbyJoined)
      off('player_joined', handlePlayerJoined)
      off('player_left', handlePlayerLeft)
      off('game_started', handleGameStarted)
      off('error', handleError)
    }
  }, [on, off, router])
  
  // Create lobby handler
  const handleCreateLobby = () => {
    if (!playerName.trim()) {
      toast.show({
        title: 'Error',
        message: 'Please enter your name',
        preset: 'error',
      })
      return
    }
    
    createLobby(playerName, 4, '👑')
  }
  
  // Join lobby handler
  const handleJoinLobby = () => {
    if (!playerName.trim() || !lobbyCode.trim()) {
      toast.show({
        title: 'Error',
        message: 'Please enter your name and lobby code',
        preset: 'error',
      })
      return
    }
    
    joinLobby(lobbyCode.toUpperCase(), playerName, '🎮')
  }
  
  // Start game handler (host only)
  const handleStartGame = () => {
    if (!gameState || gameState.players.length < 2) {
      toast.show({
        title: 'Error',
        message: 'Need at least 2 players to start',
        preset: 'error',
      })
      return
    }
    
    startGame()
  }
  
  // Kick player handler (host only)
  const handleKickPlayer = (playerId: string) => {
    kickPlayer(playerId)
  }
  
  return (
    <YStack f={1} gap="$4" p="$4" bg="$background">
      {/* Connection Status */}
      <XStack gap="$2" items="center">
        <Circle size={8} bg={isConnected ? '$secondary' : '$error'} />
        <Paragraph fontSize="$2">
          {isConnected ? 'Connected' : 'Disconnected'}
        </Paragraph>
      </XStack>
      
      {!gameState ? (
        // Join/Create Lobby UI
        <Card elevate bordered>
          <Card.Header padded>
            <H3>Join or Create Lobby</H3>
          </Card.Header>
          <YStack gap="$3" p="$4">
            <Input
              placeholder="Your Name"
              value={playerName}
              onChangeText={setPlayerName}
            />
            <Button
              bg="$primary"
              onPress={handleCreateLobby}
              disabled={!isConnected}
            >
              Create Lobby
            </Button>
            
            <Separator />
            
            <Input
              placeholder="Lobby Code (ABC123)"
              value={lobbyCode}
              onChangeText={setLobbyCode}
              autoCapitalize="characters"
            />
            <Button
              bg="$secondary"
              onPress={handleJoinLobby}
              disabled={!isConnected}
            >
              Join Lobby
            </Button>
          </YStack>
        </Card>
      ) : (
        // Lobby UI (when joined)
        <YStack gap="$4">
          {/* Lobby Info */}
          <Card elevate bordered>
            <Card.Header padded>
              <H3>Lobby: {gameState.lobbyCode}</H3>
              <Paragraph>
                Players: {gameState.players.length}/{gameState.maxPlayers}
              </Paragraph>
            </Card.Header>
          </Card>
          
          {/* Player List */}
          <Card elevate bordered>
            <Card.Header padded>
              <H3>Players</H3>
            </Card.Header>
            <YStack gap="$2" p="$4">
              {gameState.players.map(player => (
                <XStack
                  key={player.id}
                  items="center"
                  justify="space-between"
                  p="$3"
                  bg="$backgroundHover"
                  br="$4"
                >
                  <XStack gap="$2" items="center">
                    <Paragraph fontSize="$6">{player.avatar}</Paragraph>
                    <Paragraph fontWeight="bold">{player.name}</Paragraph>
                    {player.isHost && (
                      <Paragraph fontSize="$2" color="$accent">
                        HOST
                      </Paragraph>
                    )}
                  </XStack>
                  
                  {isHost && !player.isHost && (
                    <Button
                      size="$2"
                      bg="$error"
                      onPress={() => handleKickPlayer(player.id)}
                    >
                      Kick
                    </Button>
                  )}
                </XStack>
              ))}
            </YStack>
          </Card>
          
          {/* Host Controls */}
          {isHost && (
            <Button
              bg="$primary"
              size="$5"
              onPress={handleStartGame}
              disabled={gameState.players.length < 2}
            >
              Start Game
            </Button>
          )}
          
          {/* Leave Button */}
          <Button
            bg="$error"
            onPress={() => {
              leaveLobby()
              setGameState(null)
              setLobbyCode('')
            }}
          >
            Leave Lobby
          </Button>
        </YStack>
      )}
    </YStack>
  )
}
```

## Environment Configuration

### Development

`app/.env`:
```bash
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### Production

`app/.env.production`:
```bash
EXPO_PUBLIC_PARTYKIT_HOST=your-project.partykit.dev
```

### Usage in Code

```typescript
const host = process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999'
```

## Best Practices

### 1. Type Safety

✅ **Always use typed messages**
```typescript
import type { GameState, Player } from 'types/game'

on('game_state', (state: GameState) => {
  // TypeScript knows state shape
  console.log(state.players.length)
})
```

### 2. Cleanup Subscriptions

✅ **Always unsubscribe in cleanup**
```typescript
useEffect(() => {
  const handler = (data) => { /* ... */ }
  on('event', handler)
  return () => off('event', handler) // ← Important!
}, [on, off])
```

### 3. Connection Status

✅ **Check connection before actions**
```typescript
const handleAction = () => {
  if (!isConnected) {
    toast.show({ title: 'Not connected', preset: 'error' })
    return
  }
  
  client.startGame()
}
```

### 4. Error Handling

✅ **Always handle errors**
```typescript
useEffect(() => {
  const handleError = (error: { message: string }) => {
    toast.show({
      title: 'Error',
      message: error.message,
      preset: 'error',
    })
  }
  
  on('error', handleError)
  return () => off('error', handleError)
}, [on, off])
```

### 5. Optimistic Updates

❌ **Don't update state before server confirmation**
```typescript
// Bad
const handlePlayCard = (cardId: string) => {
  // Remove card from local state
  setCards(cards.filter(c => c !== cardId))
  
  // Send to server
  playCard(cardId)
}
```

✅ **Wait for server state update**
```typescript
// Good
const handlePlayCard = (cardId: string) => {
  // Just send to server
  playCard(cardId)
  
  // State will update when server broadcasts new game_state
}
```

## Debugging

### Enable Debug Logging

```typescript
// In gameClient.ts
private emit(event: string, data: unknown) {
  console.log('[GameClient] Event:', event, data) // Add this
  const listeners = this.listeners.get(event)
  // ...
}
```

### Log Connection State

```typescript
useEffect(() => {
  console.log('Connection state:', isConnected)
  console.log('Game state:', gameState)
}, [isConnected, gameState])
```

### Monitor WebSocket Messages

```typescript
useEffect(() => {
  const handleMessage = (message: ServerMessage) => {
    console.log('[WS] Received:', message.type, message.payload)
  }
  
  on('message', handleMessage)
  return () => off('message', handleMessage)
}, [on, off])
```

## Common Issues

### Issue: Client not receiving messages

**Check**:
- WebSocket connection is open (`isConnected === true`)
- Event listener is subscribed before message arrives
- Event type matches exactly (case-sensitive)
- No TypeScript errors in console

### Issue: State updates delayed

**Cause**: Server needs to broadcast after state changes

**Solution**: Ensure server calls `broadcastGameState()` after mutations

### Issue: Duplicate event handlers

**Cause**: Missing cleanup in useEffect

**Solution**: Always return cleanup function that calls `off()`

### Issue: Room ID mismatch

**Cause**: Client connects to different room than intended

**Solution**: Ensure `roomId` parameter matches lobby code exactly

## Reference

- **Client Code**: `app/utils/gameClient.ts`
- **Type Definitions**: `app/types/game.ts` (mirrored in `partykit/src/types.ts`)
- **Server Guide**: `.github/agents/partykit-server.md`
- **PartySocket Docs**: https://github.com/partykit/partykit/tree/main/packages/partysocket
