/**
 * Shared types for Card Masters multiplayer game
 * These types are used by both the PartyKit server and Expo client
 */

export type GameStatus = 'lobby' | 'starting' | 'playing' | 'finished'

export type PlayerStatus = 'connected' | 'ready' | 'playing' | 'disconnected'

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

export interface LobbyInfo {
  code: string
  hostId: string
  hostName: string
  playerCount: number
  maxPlayers: number
  createdAt: number
  status: GameStatus
}

export interface GameState {
  lobbyCode: string
  hostId: string
  status: GameStatus
  players: Array<Player>
  currentTurn: string | null
  round: number
  maxPlayers: number
  createdAt: number
  startedAt: number | null
}

export interface ClientMessage {
  type: 'create_lobby' | 'join_lobby' | 'leave_lobby' | 'start_game' | 'ready' | 'play_card' | 'chat' | 'kick_player'
  payload: CreateLobbyPayload | JoinLobbyPayload | PlayCardPayload | ChatPayload | KickPlayerPayload | Record<string, unknown>
}

export interface ServerMessage {
  type: 'lobby_created' | 'lobby_joined' | 'game_state' | 'player_joined' | 'player_left' | 'player_kicked' | 'host_changed' | 'turn_update' | 'game_started' | 'game_ended' | 'lobby_destroyed' | 'error' | 'chat'
  payload: LobbyInfo | GameState | Player | ChatPayload | { message: string } | Record<string, unknown>
  timestamp: number
}

export interface CreateLobbyPayload {
  hostName: string
  maxPlayers?: number
  avatar?: string
}

export interface JoinLobbyPayload {
  lobbyCode: string
  playerName: string
  avatar?: string
}

export interface JoinPayload {
  playerName: string
  avatar?: string
}

export interface PlayCardPayload {
  cardId: string
  targetPlayerId?: string
}

export interface ChatPayload {
  message: string
  playerId?: string
  playerName?: string
}

export interface KickPlayerPayload {
  playerId: string
}
