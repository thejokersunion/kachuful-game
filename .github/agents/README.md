# Agent Instructions for Card Masters Game Development

This directory contains specialized instructions for AI agents working on different aspects of the Card Masters game project.

## Directory Structure

- **`partykit-server.md`** - Instructions for PartyKit server development and multiplayer game logic
- **`game-integration.md`** - Client-server integration patterns and WebSocket communication
- **`type-safety.md`** - Type definitions, shared types, and type safety best practices
- **`testing-e2e.md`** - End-to-end testing strategies for multiplayer game features
- **`deployment.md`** - Deployment workflows for both frontend and backend
- **`quick-reference.md`** - Quick reference guide for common development tasks

## When to Use Each Guide

### Frontend Development (UI/UX)
→ Use `.github/copilot-instructions.md` for Expo/Tamagui frontend work

### Backend Development (Game Server)
→ Use `.github/agents/partykit-server.md` for server logic, lobby system, game state

### Integration Work (Client ↔️ Server)
→ Use `.github/agents/game-integration.md` for WebSocket communication, state sync

### Type Updates (Shared Types)
→ Use `.github/agents/type-safety.md` when modifying game types or messages

### Testing (E2E)
→ Use `.github/agents/testing-e2e.md` for multiplayer scenarios and integration tests

### Deployment
→ Use `.github/agents/deployment.md` for production deployments

## Development Workflow

1. **Plan** - Read relevant agent guide(s) before starting work
2. **Implement** - Follow patterns and conventions from guides
3. **Type Safety** - Ensure types are synchronized between client and server
4. **Test** - Write tests following testing-e2e.md guidelines
5. **Document** - Update relevant documentation if adding new patterns
6. **Deploy** - Follow deployment.md for production releases

## Project Architecture Overview

```
expo_tamagui/
├── app/                          # Expo frontend (React Native + Tamagui)
│   ├── app/                      # File-based routing
│   ├── components/               # Reusable UI components
│   ├── types/game.ts            # Client-side game types (shared with server)
│   ├── utils/gameClient.ts      # PartyKit WebSocket client
│   └── tamagui.config.ts        # Gaming theme configuration
│
├── partykit/                     # Multiplayer game server
│   ├── src/
│   │   ├── server.ts            # Main server logic with lobby system
│   │   ├── types.ts             # Server-side types (mirrored in app)
│   │   └── utils.ts             # Lobby utilities
│   └── partykit.json            # Server configuration
│
└── .github/
    ├── copilot-instructions.md  # Frontend development guide
    └── agents/                   # Specialized agent instructions
        └── (this directory)
```

## Key Technologies

- **Frontend**: Expo SDK 54, React 19, React Native 0.81, Tamagui, Expo Router
- **Backend**: PartyKit (WebSocket server), TypeScript
- **Communication**: WebSocket via `partysocket` library
- **Testing**: Vitest, React Native Testing Library
- **Deployment**: Expo (app), PartyKit Cloud (server)

## Communication Protocol

The game uses a WebSocket-based protocol with typed messages:

```typescript
// Client → Server
type ClientMessage = {
  type: 'create_lobby' | 'join_lobby' | 'start_game' | 'play_card' | ...
  payload: TypedPayload
}

// Server → Client
type ServerMessage = {
  type: 'game_state' | 'player_joined' | 'turn_update' | ...
  payload: TypedPayload
  timestamp: number
}
```

All message types and payloads are strongly typed and shared between client and server via `app/types/game.ts` and `partykit/src/types.ts`.

## Development Principles

1. **Type Safety First** - Always maintain type synchronization between client/server
2. **Minimal Changes** - Make surgical, focused changes to existing code
3. **Test Everything** - Write tests for new features, especially multiplayer interactions
4. **Document Patterns** - If you create a new pattern, document it for future agents
5. **Gaming UX** - Prioritize responsive, engaging, rewarding user experiences

## Getting Help

- Frontend issues → See `.github/copilot-instructions.md`
- Server issues → See `partykit/README.md` and `.github/agents/partykit-server.md`
- Integration issues → See `.github/agents/game-integration.md`
- Type issues → See `.github/agents/type-safety.md`

## Contributing to Agent Instructions

When you discover a useful pattern or solve a tricky problem:

1. Document it in the relevant agent guide
2. Add examples with code snippets
3. Include common pitfalls and how to avoid them
4. Update this README if adding new guides
