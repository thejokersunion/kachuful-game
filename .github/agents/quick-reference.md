# Quick Reference Guide

## Common Development Tasks

### Start Development Environment

```bash
# Terminal 1: Start PartyKit server
cd partykit
yarn dev

# Terminal 2: Start Expo app
cd app
yarn start

# Press 'w' for web, 'i' for iOS, 'a' for Android
```

### Run Tests

```bash
# Frontend tests
cd app
yarn test              # Watch mode
yarn test:run          # CI mode
yarn test:coverage     # With coverage

# Type checks
cd app
npx tsc --noEmit

cd partykit
npx tsc --noEmit
```

### Deploy

```bash
# Deploy server
cd partykit
yarn deploy

# Build web app
cd app
npx expo export --platform web
```

## Message Types Quick Reference

### Client → Server

| Type | Payload | Description |
|------|---------|-------------|
| `create_lobby` | `CreateLobbyPayload` | Host creates new lobby |
| `join_lobby` | `JoinLobbyPayload` | Player joins with code |
| `leave_lobby` | `{}` | Player leaves lobby |
| `start_game` | `{}` | Host starts game (min 2 players) |
| `ready` | `{}` | Player marks ready |
| `play_card` | `PlayCardPayload` | Play card during turn |
| `chat` | `ChatPayload` | Send chat message |
| `kick_player` | `KickPlayerPayload` | Host kicks player |

### Server → Client

| Type | Payload Type | Description |
|------|--------------|-------------|
| `lobby_created` | `LobbyInfo` | Lobby created successfully |
| `lobby_joined` | `GameState` | Successfully joined lobby |
| `game_state` | `GameState` | Full state update |
| `player_joined` | `Player` | New player joined |
| `player_left` | `{ playerName }` | Player left lobby |
| `player_kicked` | `{ playerName }` | Player was kicked |
| `host_changed` | `{ newHostId, newHostName }` | Host migrated |
| `turn_update` | `{ playerId, cardId, currentTurn }` | Turn changed |
| `game_started` | `{ round, currentTurn }` | Game began |
| `game_ended` | `{ winner, finalScores }` | Game finished |
| `lobby_destroyed` | `{ message }` | Lobby destroyed |
| `error` | `{ message }` | Error occurred |
| `chat` | `ChatPayload` | Chat message broadcast |

## Code Snippets

### Create Lobby (Client)

```typescript
import { useGameClient } from 'utils/gameClient'

function LobbyScreen() {
  const { createLobby, on } = useGameClient(host, roomId)
  
  const handleCreate = () => {
    createLobby('PlayerName', 4, '👑')
  }
  
  useEffect(() => {
    const handler = (info: LobbyInfo) => {
      console.log('Lobby code:', info.code)
    }
    on('lobby_created', handler)
    return () => off('lobby_created', handler)
  }, [on])
}
```

### Join Lobby (Client)

```typescript
const { joinLobby, on } = useGameClient(host, roomId)

const handleJoin = (code: string) => {
  joinLobby(code, 'PlayerName', '🎮')
}

useEffect(() => {
  const handler = (state: GameState) => {
    console.log('Joined:', state.lobbyCode)
  }
  on('lobby_joined', handler)
  return () => off('lobby_joined', handler)
}, [on])
```

### Handle Game State Updates (Client)

```typescript
const [gameState, setGameState] = useState<GameState | null>(null)
const { on } = useGameClient(host, roomId)

useEffect(() => {
  const handler = (state: GameState) => {
    setGameState(state)
  }
  on('game_state', handler)
  return () => off('game_state', handler)
}, [on])
```

### Create Lobby (Server)

```typescript
private handleCreateLobby(conn: Party.Connection, payload: CreateLobbyPayload) {
  // Validate
  if (this.gameState.players.length > 0) {
    this.sendError(conn, 'Lobby already exists')
    return
  }
  
  // Create host
  const host: Player = {
    id: conn.id,
    name: payload.hostName,
    status: 'connected',
    score: 0,
    cards: [],
    avatar: payload.avatar,
    isHost: true,
    joinedAt: Date.now(),
  }
  
  this.gameState.hostId = conn.id
  this.gameState.players.push(host)
  
  // Send response
  this.sendToConnection(conn, {
    type: 'lobby_created',
    payload: { code: this.gameState.lobbyCode, ... },
    timestamp: Date.now(),
  })
  
  this.broadcastGameState()
}
```

### Validate and Handle Action (Server)

```typescript
private handlePlayCard(conn: Party.Connection, payload: PlayCardPayload) {
  const player = this.findPlayer(conn.id)
  
  // Validate
  if (!player) {
    this.sendError(conn, 'Player not found')
    return
  }
  
  if (this.gameState.currentTurn !== conn.id) {
    this.sendError(conn, 'Not your turn')
    return
  }
  
  if (!player.cards.includes(payload.cardId)) {
    this.sendError(conn, 'Card not in hand')
    return
  }
  
  // Process action
  player.cards = player.cards.filter(c => c !== payload.cardId)
  player.score += 10
  
  this.nextTurn()
  
  // Broadcast update
  this.broadcastMessage({
    type: 'turn_update',
    payload: { playerId: conn.id, cardId: payload.cardId, currentTurn: this.gameState.currentTurn },
    timestamp: Date.now(),
  })
  
  this.broadcastGameState()
}
```

## Component Patterns

### Responsive Game Card

```typescript
import { useResponsive, useResponsiveIconSize, useResponsiveFontSize } from 'hooks/useResponsive'
import { Card, H3, Paragraph } from 'tamagui'
import { Crown } from '@tamagui/lucide-icons'

function GameCard() {
  const { isMobile } = useResponsive()
  const iconSizes = useResponsiveIconSize()
  const fontSizes = useResponsiveFontSize()
  
  return (
    <Card
      elevate
      bordered
      bg="$primary"
      p={isMobile ? '$3' : '$4'}
      pressStyle={{ scale: 0.98 }}
      animation="bouncy"
    >
      <Card.Header padded>
        <Crown size={iconSizes.md} color="$accent" />
        <H3 fontSize={fontSizes.title} color="$pearl">Quick Match</H3>
        <Paragraph fontSize={fontSizes.caption} color="$pearl" opacity={0.9}>
          Jump into a game
        </Paragraph>
      </Card.Header>
    </Card>
  )
}
```

### Player List Component

```typescript
function PlayerList({ players }: { players: Player[] }) {
  return (
    <YStack gap="$2">
      {players.map(player => (
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
              <Paragraph fontSize="$2" color="$accent">HOST</Paragraph>
            )}
          </XStack>
          <Paragraph color="$secondary">{player.score}</Paragraph>
        </XStack>
      ))}
    </YStack>
  )
}
```

### Connection Status Indicator

```typescript
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <XStack gap="$2" items="center">
      <Circle size={8} bg={isConnected ? '$secondary' : '$error'} />
      <Paragraph fontSize="$2" color={isConnected ? '$secondary' : '$error'}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </Paragraph>
    </XStack>
  )
}
```

## Debugging Commands

### Server Logs

```bash
# View logs
npx partykit logs

# Follow logs in real-time
npx partykit logs --follow

# View specific room
npx partykit logs --room ABC123

# Filter by level
npx partykit logs --level error
```

### Client Debug

```typescript
// Enable debug logging in GameClient
private emit(event: string, data: unknown) {
  console.log('[GameClient] Event:', event, data)
  // ...
}

// Log all WebSocket messages
useEffect(() => {
  const handler = (msg: ServerMessage) => {
    console.log('[WS] Received:', msg.type, msg.payload)
  }
  on('message', handler)
  return () => off('message', handler)
}, [on])
```

### Network Inspection

**Browser DevTools:**
```
1. Open DevTools (F12)
2. Network tab
3. Filter: WS (WebSocket)
4. Click connection to see messages
```

**React Native Debugger:**
```bash
# Install
brew install --cask react-native-debugger

# Run
open -g "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

## Type Definitions Quick Reference

### Core Types

```typescript
type GameStatus = 'lobby' | 'starting' | 'playing' | 'finished'
type PlayerStatus = 'connected' | 'ready' | 'playing' | 'disconnected'

interface Player {
  id: string
  name: string
  status: PlayerStatus
  score: number
  cards: string[]
  avatar?: string
  isHost: boolean
  joinedAt: number
}

interface GameState {
  lobbyCode: string
  hostId: string
  status: GameStatus
  players: Player[]
  currentTurn: string | null
  round: number
  maxPlayers: number
  createdAt: number
  startedAt: number | null
}
```

### Message Payloads

```typescript
interface CreateLobbyPayload {
  hostName: string
  maxPlayers?: number
  avatar?: string
}

interface JoinLobbyPayload {
  lobbyCode: string
  playerName: string
  avatar?: string
}

interface PlayCardPayload {
  cardId: string
  targetPlayerId?: string
}

interface ChatPayload {
  message: string
  playerId?: string
  playerName?: string
}

interface KickPlayerPayload {
  playerId: string
}
```

## Environment Variables

### Development

```bash
# app/.env
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### Production

```bash
# app/.env.production
EXPO_PUBLIC_PARTYKIT_HOST=your-project.partykit.dev
```

### Usage

```typescript
const host = process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999'
```

## Common Errors & Solutions

### Error: "Lobby code mismatch"

**Cause**: Client sends different code than room ID

**Solution**: Ensure room ID matches lobby code
```typescript
useGameClient(host, lobbyCode) // lobbyCode must match
```

### Error: "Only host can start game"

**Cause**: Non-host tries to start game

**Solution**: Check `player.isHost` before showing start button
```typescript
{player.isHost && (
  <Button onPress={startGame}>Start Game</Button>
)}
```

### Error: "Not your turn"

**Cause**: Player tries to play card when it's not their turn

**Solution**: Disable actions when not current turn
```typescript
const isMyTurn = gameState.currentTurn === myPlayerId

<Button disabled={!isMyTurn} onPress={playCard}>
  Play Card
</Button>
```

### Error: "WebSocket connection failed"

**Cause**: Server not running or wrong host

**Solution**: 
1. Verify server is running: `cd partykit && yarn dev`
2. Check environment variable: `EXPO_PUBLIC_PARTYKIT_HOST`
3. Test connection: `curl http://localhost:1999`

## Git Workflow

### Feature Development

```bash
# Create feature branch
git checkout -b feature/new-game-mode

# Make changes, commit frequently
git add .
git commit -m "Add new game mode"

# Push to remote
git push origin feature/new-game-mode

# Create PR on GitHub
```

### Type Synchronization

```bash
# After modifying server types
vim partykit/src/types.ts

# Immediately sync to client
vim app/types/game.ts

# Test both sides
cd partykit && npx tsc --noEmit
cd app && npx tsc --noEmit

# Commit together
git add partykit/src/types.ts app/types/game.ts
git commit -m "Update Player type: add powerups field"
```

## Performance Tips

### Server Performance

```typescript
// ✅ Efficient: Exclude sender from broadcast
this.broadcastGameState([conn.id])

// ✅ Efficient: Remove disconnected players immediately
this.removePlayer(conn.id)

// ❌ Inefficient: Large state objects
interface GameState {
  history: Move[] // Don't store entire history
}
```

### Client Performance

```typescript
// ✅ Efficient: Memoize expensive computations
const sortedPlayers = useMemo(
  () => players.sort((a, b) => b.score - a.score),
  [players]
)

// ✅ Efficient: Clean up subscriptions
useEffect(() => {
  on('event', handler)
  return () => off('event', handler)
}, [])

// ❌ Inefficient: Re-render on every message
on('game_state', () => forceUpdate())
```

## Useful Commands

### Package Management

```bash
# Install new package
yarn add package-name

# Remove package
yarn remove package-name

# Update all packages
yarn upgrade

# Update Tamagui packages
cd app
yarn upgrade:tamagui
```

### Build & Deploy

```bash
# Type check
npx tsc --noEmit

# Build web
npx expo export --platform web

# Build iOS
npx eas build --platform ios

# Deploy server
cd partykit && yarn deploy
```

### Clean & Reset

```bash
# Clear Expo cache
npx expo start -c

# Reset Metro bundler
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install

# Clear PartyKit cache
npx partykit clear-cache
```

## File Locations Reference

### Key Files

| File | Description |
|------|-------------|
| `partykit/src/server.ts` | Server implementation |
| `partykit/src/types.ts` | Server type definitions |
| `app/types/game.ts` | Client type definitions |
| `app/utils/gameClient.ts` | WebSocket client |
| `app/tamagui.config.ts` | Gaming theme config |
| `.github/copilot-instructions.md` | Frontend guide |
| `.github/agents/` | Specialized agent guides |

### Configuration Files

| File | Purpose |
|------|---------|
| `partykit/partykit.json` | Server config |
| `app/app.json` | Expo config |
| `app/tsconfig.json` | TypeScript config |
| `app/vitest.config.ts` | Test config |
| `app/metro.config.js` | Metro bundler config |

## Links & Resources

### Documentation

- [PartyKit Docs](https://docs.partykit.io/)
- [Expo Docs](https://docs.expo.dev/)
- [Tamagui Docs](https://tamagui.dev/)
- [React Native Docs](https://reactnative.dev/)

### Project Guides

- Frontend: `.github/copilot-instructions.md`
- Server: `.github/agents/partykit-server.md`
- Integration: `.github/agents/game-integration.md`
- Types: `.github/agents/type-safety.md`
- Testing: `.github/agents/testing-e2e.md`
- Deployment: `.github/agents/deployment.md`

### Community

- [PartyKit Discord](https://discord.gg/partykit)
- [Expo Discord](https://chat.expo.dev/)
- [Tamagui Discord](https://tamagui.dev/community)
