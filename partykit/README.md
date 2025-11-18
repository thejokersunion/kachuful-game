# Card Masters PartyKit Server

Real-time multiplayer game server for Card Masters using PartyKit.

## Setup

1. Install dependencies:
```bash
cd partykit
yarn install
```

2. Run development server:
```bash
yarn dev
```

The server will run on `http://localhost:1999`

## Deploy

Deploy to PartyKit cloud:
```bash
yarn deploy
```

## Environment Variables

For the Expo app, create `.env` file:
```
EXPO_PUBLIC_PARTYKIT_HOST=your-project.party.sh
```

For local development, use:
```
EXPO_PUBLIC_PARTYKIT_HOST=localhost:1999
```

## Game Flow

1. Players join a room with a room ID
2. Players mark themselves as "ready"
3. Game starts when all players (min 2) are ready
4. Players take turns playing cards
5. First player to reach 100 points wins

## API

### Client Messages

- `join` - Join game room with player name
- `ready` - Mark player as ready to start
- `play_card` - Play a card from hand
- `chat` - Send chat message
- `leave` - Leave game room

### Server Messages

- `game_state` - Full game state update
- `player_joined` - New player joined
- `player_left` - Player left/disconnected
- `turn_update` - Turn changed
- `game_started` - Game has started
- `game_ended` - Game finished with winner
- `chat` - Chat message broadcast
- `error` - Error message
