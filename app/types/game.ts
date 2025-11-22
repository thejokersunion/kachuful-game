/**
 * Shared types for Card Masters multiplayer game
 * These types are used by both the PartyKit server and Expo client
 */

export type GameStatus = 'lobby' | 'starting' | 'playing' | 'finished'

export type PlayerStatus = 'connected' | 'ready' | 'playing' | 'disconnected'

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'
export type SuitGlyph = '♣' | '♦' | '♥' | '♠'

export interface PlayingCard {
  id: string
  suit: Suit
  rank: number
  label: string
  symbol: SuitGlyph
}

export interface Player {
  id: string
  name: string
  status: PlayerStatus
  score: number
  cards: PlayingCard[]
  handCount: number
  bid: number | null
  tricksWon: number
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

export type RoundPhase = 'idle' | 'bidding' | 'playing' | 'scoring' | 'round_end' | 'completed'

export type PendingAction = 'bid' | 'play' | 'none'

export interface EngineEvent {
  id: string
  type: 'round_started' | 'bid_submitted' | 'card_played' | 'trick_resolved' | 'round_scored'
  timestamp: number
  payload: Record<string, unknown>
}

export interface TrickView {
  playerId: string
  card: PlayingCard
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
  phase: RoundPhase
  handSize: number
  trump: Suit | null
  bids: Record<string, number | null>
  tricksWon: Record<string, number>
  currentTrick: TrickView[]
  pendingAction: PendingAction
  deckCount: number
  lastTrickWinner: string | null
  history: EngineEvent[]
  handSequence: number[]
}

export interface ClientMessage {
  type: 'create_lobby' | 'join_lobby' | 'leave_lobby' | 'start_game' | 'ready' | 'play_card' | 'submit_bid' | 'chat' | 'kick_player'
  payload: CreateLobbyPayload | JoinLobbyPayload | PlayCardPayload | SubmitBidPayload | ChatPayload | KickPlayerPayload | Record<string, unknown>
}

export interface HandUpdatePayload {
  playerId: string
  cards: PlayingCard[]
  playableCardIds?: string[]
}

export interface ServerMessage {
  type:
    | 'lobby_created'
    | 'lobby_joined'
    | 'game_state'
    | 'player_joined'
    | 'player_left'
    | 'player_kicked'
    | 'host_changed'
    | 'turn_update'
    | 'game_started'
    | 'game_ended'
    | 'lobby_destroyed'
    | 'error'
    | 'chat'
    | 'hand_update'
  payload: LobbyInfo | GameState | Player | ChatPayload | HandUpdatePayload | { message: string } | Record<string, unknown>
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

export interface SubmitBidPayload {
  bid: number
}

export interface ChatPayload {
  message: string
  playerId?: string
  playerName?: string
}

export interface KickPlayerPayload {
  playerId: string
}
