# End-to-End Testing Guide

## Overview

This guide covers testing strategies for the Card Masters multiplayer game, including unit tests, integration tests, and end-to-end multiplayer scenarios.

## Testing Stack

- **Frontend**: Vitest + React Native Testing Library
- **Backend**: PartyKit server testing with mock connections
- **E2E**: Manual testing with multiple clients

## Project Test Structure

```
app/
├── __tests__/               # Test files
│   ├── example.test.tsx     # Example component test
│   ├── gameClient.test.ts   # GameClient unit tests
│   └── integration/         # Integration tests
├── vitest.config.ts         # Vitest configuration
└── vitest.setup.ts          # Test setup

partykit/
└── src/
    ├── server.test.ts       # Server unit tests
    └── __mocks__/           # Mock utilities
```

## Frontend Testing

### Running Tests

```bash
cd app

# Run tests in watch mode
yarn test

# Run tests with UI
yarn test:ui

# Run tests once (CI mode)
yarn test:run

# Run with coverage
yarn test:coverage
```

### Component Testing

Test game UI components with Tamagui provider:

```typescript
// __tests__/LobbyCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { Provider } from 'components/Provider'
import { LobbyCard } from 'components/LobbyCard'

describe('LobbyCard', () => {
  it('renders lobby code', () => {
    render(
      <Provider>
        <LobbyCard lobbyCode="ABC123" playerCount={2} maxPlayers={4} />
      </Provider>
    )
    
    expect(screen.getByText('ABC123')).toBeTruthy()
    expect(screen.getByText('2/4')).toBeTruthy()
  })
  
  it('shows full indicator when lobby is full', () => {
    render(
      <Provider>
        <LobbyCard lobbyCode="DEF456" playerCount={4} maxPlayers={4} />
      </Provider>
    )
    
    expect(screen.getByText('Full')).toBeTruthy()
  })
})
```

### GameClient Unit Tests

Test WebSocket client logic:

```typescript
// __tests__/gameClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameClient } from 'utils/gameClient'

// Mock PartySocket
vi.mock('partysocket', () => ({
  default: vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: WebSocket.OPEN,
  })),
}))

describe('GameClient', () => {
  let client: GameClient
  
  beforeEach(() => {
    client = new GameClient('localhost:1999', 'ABC123')
  })
  
  afterEach(() => {
    client.disconnect()
  })
  
  it('creates client with host and room', () => {
    expect(client).toBeDefined()
  })
  
  it('sends create_lobby message', () => {
    client.connect()
    
    const mockSend = vi.spyOn(client['socket']!, 'send')
    client.createLobby('Alice', 4, '👑')
    
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'create_lobby',
        payload: { hostName: 'Alice', maxPlayers: 4, avatar: '👑' },
      })
    )
  })
  
  it('handles game_state event', () => {
    client.connect()
    
    const handler = vi.fn()
    client.on('game_state', handler)
    
    // Simulate message from server
    const message = {
      type: 'game_state',
      payload: {
        lobbyCode: 'ABC123',
        hostId: 'conn-1',
        status: 'lobby',
        players: [],
        currentTurn: null,
        round: 0,
        maxPlayers: 4,
        createdAt: Date.now(),
        startedAt: null,
      },
      timestamp: Date.now(),
    }
    
    // Trigger message handler
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(message),
    })
    client['socket']!.dispatchEvent(messageEvent)
    
    expect(handler).toHaveBeenCalledWith(message.payload)
  })
})
```

### Hook Testing

Test React hooks with act():

```typescript
// __tests__/useGameClient.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useGameClient } from 'utils/gameClient'

describe('useGameClient', () => {
  it('initializes client', () => {
    const { result } = renderHook(() =>
      useGameClient('localhost:1999', 'ABC123')
    )
    
    expect(result.current.client).toBeDefined()
    expect(result.current.isConnected).toBe(false)
  })
  
  it('creates lobby', () => {
    const { result } = renderHook(() =>
      useGameClient('localhost:1999', 'ABC123')
    )
    
    act(() => {
      result.current.createLobby('Alice', 4, '👑')
    })
    
    // Verify client method was called
    expect(result.current.client).toBeDefined()
  })
  
  it('handles connection state changes', () => {
    const { result } = renderHook(() =>
      useGameClient('localhost:1999', 'ABC123')
    )
    
    // Simulate connection
    act(() => {
      result.current.client?.emit('connected', {})
    })
    
    expect(result.current.isConnected).toBe(true)
  })
})
```

## Server Testing

### Mock PartyKit Connection

```typescript
// partykit/src/__mocks__/mockConnection.ts
import type * as Party from 'partykit/server'

export class MockConnection implements Partial<Party.Connection> {
  id: string
  sentMessages: string[] = []
  
  constructor(id: string) {
    this.id = id
  }
  
  send(message: string) {
    this.sentMessages.push(message)
  }
  
  close() {
    // Mock close
  }
  
  getLastMessage(): any {
    const last = this.sentMessages[this.sentMessages.length - 1]
    return last ? JSON.parse(last) : null
  }
}
```

### Mock PartyKit Room

```typescript
// partykit/src/__mocks__/mockRoom.ts
import type * as Party from 'partykit/server'
import { MockConnection } from './mockConnection'

export class MockRoom implements Partial<Party.Room> {
  id: string
  connections: Map<string, MockConnection> = new Map()
  broadcasts: string[] = []
  
  constructor(id: string) {
    this.id = id
  }
  
  getConnection(id: string): MockConnection | undefined {
    return this.connections.get(id)
  }
  
  broadcast(message: string, exclude?: string[]) {
    this.broadcasts.push(message)
  }
  
  getLastBroadcast(): any {
    const last = this.broadcasts[this.broadcasts.length - 1]
    return last ? JSON.parse(last) : null
  }
}
```

### Server Unit Tests

```typescript
// partykit/src/server.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import CardMastersServer from './server'
import { MockRoom } from './__mocks__/mockRoom'
import { MockConnection } from './__mocks__/mockConnection'

describe('CardMastersServer', () => {
  let server: CardMastersServer
  let room: MockRoom
  
  beforeEach(() => {
    room = new MockRoom('test-room')
    server = new CardMastersServer(room as any)
  })
  
  describe('Lobby Creation', () => {
    it('creates lobby for host', async () => {
      const conn = new MockConnection('conn-1')
      
      await server.onConnect(conn as any)
      await server.onMessage(
        JSON.stringify({
          type: 'create_lobby',
          payload: { hostName: 'Alice', maxPlayers: 4, avatar: '👑' },
        }),
        conn as any
      )
      
      // Verify lobby was created
      expect(server.gameState.players.length).toBe(1)
      expect(server.gameState.players[0].name).toBe('Alice')
      expect(server.gameState.players[0].isHost).toBe(true)
      expect(server.gameState.hostId).toBe('conn-1')
      
      // Verify response was sent
      const response = conn.getLastMessage()
      expect(response.type).toBe('lobby_created')
      expect(response.payload.code).toBeDefined()
    })
    
    it('prevents duplicate lobby creation', async () => {
      const conn1 = new MockConnection('conn-1')
      const conn2 = new MockConnection('conn-2')
      
      // First host creates lobby
      await server.onConnect(conn1 as any)
      await server.onMessage(
        JSON.stringify({
          type: 'create_lobby',
          payload: { hostName: 'Alice', maxPlayers: 4 },
        }),
        conn1 as any
      )
      
      // Second host tries to create
      await server.onConnect(conn2 as any)
      await server.onMessage(
        JSON.stringify({
          type: 'create_lobby',
          payload: { hostName: 'Bob', maxPlayers: 4 },
        }),
        conn2 as any
      )
      
      // Should receive error
      const response = conn2.getLastMessage()
      expect(response.type).toBe('error')
      expect(response.payload.message).toBe('Lobby already exists')
    })
  })
  
  describe('Player Join', () => {
    beforeEach(async () => {
      // Create lobby first
      const hostConn = new MockConnection('conn-1')
      await server.onConnect(hostConn as any)
      await server.onMessage(
        JSON.stringify({
          type: 'create_lobby',
          payload: { hostName: 'Alice', maxPlayers: 4 },
        }),
        hostConn as any
      )
    })
    
    it('allows player to join with valid code', async () => {
      const conn = new MockConnection('conn-2')
      
      await server.onConnect(conn as any)
      await server.onMessage(
        JSON.stringify({
          type: 'join_lobby',
          payload: {
            lobbyCode: server.gameState.lobbyCode,
            playerName: 'Bob',
          },
        }),
        conn as any
      )
      
      // Verify player joined
      expect(server.gameState.players.length).toBe(2)
      expect(server.gameState.players[1].name).toBe('Bob')
      expect(server.gameState.players[1].isHost).toBe(false)
      
      // Verify response
      const response = conn.getLastMessage()
      expect(response.type).toBe('lobby_joined')
    })
    
    it('rejects join with invalid code', async () => {
      const conn = new MockConnection('conn-2')
      
      await server.onConnect(conn as any)
      await server.onMessage(
        JSON.stringify({
          type: 'join_lobby',
          payload: { lobbyCode: 'WRONG1', playerName: 'Bob' },
        }),
        conn as any
      )
      
      // Should receive error
      const response = conn.getLastMessage()
      expect(response.type).toBe('error')
      expect(response.payload.message).toBe('Invalid lobby code')
    })
    
    it('rejects join when lobby is full', async () => {
      // Fill lobby to max players
      for (let i = 2; i <= 4; i++) {
        const conn = new MockConnection(`conn-${i}`)
        await server.onConnect(conn as any)
        await server.onMessage(
          JSON.stringify({
            type: 'join_lobby',
            payload: {
              lobbyCode: server.gameState.lobbyCode,
              playerName: `Player${i}`,
            },
          }),
          conn as any
        )
      }
      
      // Try to join when full
      const conn = new MockConnection('conn-5')
      await server.onConnect(conn as any)
      await server.onMessage(
        JSON.stringify({
          type: 'join_lobby',
          payload: {
            lobbyCode: server.gameState.lobbyCode,
            playerName: 'Player5',
          },
        }),
        conn as any
      )
      
      const response = conn.getLastMessage()
      expect(response.type).toBe('error')
      expect(response.payload.message).toBe('Lobby is full')
    })
  })
  
  describe('Game Start', () => {
    beforeEach(async () => {
      // Create lobby with 2 players
      const host = new MockConnection('conn-1')
      const player = new MockConnection('conn-2')
      
      await server.onConnect(host as any)
      await server.onMessage(
        JSON.stringify({
          type: 'create_lobby',
          payload: { hostName: 'Alice', maxPlayers: 4 },
        }),
        host as any
      )
      
      await server.onConnect(player as any)
      await server.onMessage(
        JSON.stringify({
          type: 'join_lobby',
          payload: {
            lobbyCode: server.gameState.lobbyCode,
            playerName: 'Bob',
          },
        }),
        player as any
      )
    })
    
    it('allows host to start game', async () => {
      const host = new MockConnection('conn-1')
      
      await server.onMessage(
        JSON.stringify({ type: 'start_game', payload: {} }),
        host as any
      )
      
      // Verify game started
      expect(server.gameState.status).toBe('playing')
      expect(server.gameState.round).toBe(1)
      expect(server.gameState.currentTurn).toBe('conn-1')
      
      // Verify players have cards
      expect(server.gameState.players[0].cards.length).toBe(5)
      expect(server.gameState.players[1].cards.length).toBe(5)
    })
    
    it('prevents non-host from starting game', async () => {
      const player = new MockConnection('conn-2')
      
      await server.onMessage(
        JSON.stringify({ type: 'start_game', payload: {} }),
        player as any
      )
      
      // Should receive error
      const response = player.getLastMessage()
      expect(response.type).toBe('error')
      expect(response.payload.message).toBe('Only host can start game')
    })
  })
  
  describe('Host Migration', () => {
    it('migrates host when host disconnects', async () => {
      // Create lobby with 2 players
      const host = new MockConnection('conn-1')
      const player = new MockConnection('conn-2')
      
      await server.onConnect(host as any)
      await server.onMessage(
        JSON.stringify({
          type: 'create_lobby',
          payload: { hostName: 'Alice', maxPlayers: 4 },
        }),
        host as any
      )
      
      await server.onConnect(player as any)
      await server.onMessage(
        JSON.stringify({
          type: 'join_lobby',
          payload: {
            lobbyCode: server.gameState.lobbyCode,
            playerName: 'Bob',
          },
        }),
        player as any
      )
      
      // Host disconnects
      await server.onClose(host as any)
      
      // Verify host migrated
      expect(server.gameState.hostId).toBe('conn-2')
      expect(server.gameState.players[0].isHost).toBe(true)
      
      // Verify broadcast
      const broadcast = room.getLastBroadcast()
      expect(broadcast.type).toBe('host_changed')
    })
  })
})
```

## Integration Testing

### Multi-Client Scenario Tests

```typescript
// __tests__/integration/multiplayer.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameClient } from 'utils/gameClient'

describe('Multiplayer Integration', () => {
  let host: GameClient
  let player1: GameClient
  let player2: GameClient
  
  beforeEach(() => {
    host = new GameClient('localhost:1999', 'test-room')
    player1 = new GameClient('localhost:1999', 'test-room')
    player2 = new GameClient('localhost:1999', 'test-room')
  })
  
  it('completes full game flow', async () => {
    // Track events
    const hostEvents: any[] = []
    const p1Events: any[] = []
    
    host.on('message', (msg) => hostEvents.push(msg))
    player1.on('message', (msg) => p1Events.push(msg))
    
    // Connect all clients
    host.connect()
    player1.connect()
    player2.connect()
    
    // Wait for connections
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Host creates lobby
    host.createLobby('Alice', 4, '👑')
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Get lobby code from host events
    const lobbyCreated = hostEvents.find((e) => e.type === 'lobby_created')
    const lobbyCode = lobbyCreated.payload.code
    
    // Players join
    player1.joinLobby(lobbyCode, 'Bob', '🎮')
    player2.joinLobby(lobbyCode, 'Carol', '🎲')
    await new Promise((resolve) => setTimeout(resolve, 200))
    
    // Verify all players received state updates
    const p1GameState = p1Events.find((e) => e.type === 'game_state')
    expect(p1GameState.payload.players.length).toBe(3)
    
    // Host starts game
    host.startGame()
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Verify game started
    const gameStarted = hostEvents.find((e) => e.type === 'game_started')
    expect(gameStarted).toBeDefined()
    
    // Cleanup
    host.disconnect()
    player1.disconnect()
    player2.disconnect()
  })
})
```

## Manual E2E Testing

### Test Scenarios

#### Scenario 1: Basic Lobby Flow

1. **Host creates lobby**
   - ✅ Lobby code generated (ABC123 format)
   - ✅ Host appears in player list
   - ✅ Host has crown indicator

2. **Players join**
   - ✅ Enter valid code
   - ✅ Players appear in list
   - ✅ Player count updates

3. **Host starts game**
   - ✅ Start button enabled with 2+ players
   - ✅ Game transitions to playing state
   - ✅ Players receive cards

#### Scenario 2: Host Migration

1. **Setup**: Host + 2 players in lobby
2. **Action**: Host closes app/disconnects
3. **Expected**:
   - ✅ Next player becomes host (crown moves)
   - ✅ Remaining players notified
   - ✅ New host can start game

#### Scenario 3: Player Kick

1. **Setup**: Host + 2 players in lobby
2. **Action**: Host kicks a player
3. **Expected**:
   - ✅ Kicked player removed from list
   - ✅ Kicked player's connection closed
   - ✅ Remaining players notified

#### Scenario 4: Game Flow

1. **Setup**: Game started with 2 players
2. **Actions**: Players take turns playing cards
3. **Expected**:
   - ✅ Only current player can play
   - ✅ Turn rotates correctly
   - ✅ Scores update
   - ✅ Game ends when player reaches 100

### Testing Tools

#### Multiple Device Testing

```bash
# Terminal 1: Start server
cd partykit
yarn dev

# Terminal 2: Start app (device 1)
cd app
yarn start
# Press 'w' for web, or run on iOS/Android

# Terminal 3: Start app (device 2)
cd app
yarn start --port 8082
# Press 'w' for web on different port
```

#### Browser DevTools

```javascript
// In browser console, monitor WebSocket
const ws = new WebSocket('ws://localhost:1999/party/test-room')

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data))
}

ws.send(JSON.stringify({
  type: 'create_lobby',
  payload: { hostName: 'Test', maxPlayers: 4 }
}))
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install frontend dependencies
        run: |
          cd app
          yarn install
      
      - name: Run frontend tests
        run: |
          cd app
          yarn test:run
      
      - name: Type check frontend
        run: |
          cd app
          npx tsc --noEmit
  
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install backend dependencies
        run: |
          cd partykit
          yarn install
      
      - name: Type check backend
        run: |
          cd partykit
          npx tsc --noEmit
```

## Best Practices

### 1. Test Isolation

✅ **Each test should be independent**
```typescript
beforeEach(() => {
  // Fresh state for each test
  server = new CardMastersServer(new MockRoom('test'))
})
```

### 2. Mock External Dependencies

✅ **Mock WebSocket connections**
```typescript
vi.mock('partysocket', () => ({
  default: MockPartySocket,
}))
```

### 3. Test Error Paths

✅ **Test both success and failure**
```typescript
it('handles valid join', async () => { /* ... */ })
it('rejects invalid code', async () => { /* ... */ })
it('rejects when full', async () => { /* ... */ })
```

### 4. Use Descriptive Test Names

✅ **Clear test descriptions**
```typescript
it('allows host to start game with 2 players', async () => { /* ... */ })
```

❌ **Vague descriptions**
```typescript
it('works', async () => { /* ... */ })
```

### 5. Clean Up Resources

✅ **Disconnect clients after tests**
```typescript
afterEach(() => {
  client.disconnect()
})
```

## Reference

- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/docs/react-native-testing-library/intro
- **PartyKit Testing**: https://docs.partykit.io/guides/testing/
- **Test Files**: `app/__tests__/` and `partykit/src/*.test.ts`
