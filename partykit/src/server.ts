import type * as Party from "partykit/server"
import type { 
  GameState, 
  Player, 
  ClientMessage, 
  ServerMessage,
  CreateLobbyPayload,
  JoinLobbyPayload,
  PlayCardPayload,
  ChatPayload,
  KickPlayerPayload,
  SubmitBidPayload,
  GameStatus,
  PlayerStatus,
  LobbyInfo,
  PlayingCard
} from "./types"
import { generateLobbyCode } from "./utils"
import { 
  KachufulEngine,
  IllegalBidError,
  IllegalPlayError,
  type EngineSnapshot,
  type GameConfig as EngineRulesConfig,
  type ScoreModel
} from "./game-engine"

/**
 * Card Masters Game Server - Enterprise Lobby System
 * Features:
 * - Create lobby with 6-digit alphanumeric code
 * - Host controls (start game, kick players)
 * - Join/leave lobby with code
 * - Auto-destroy on empty
 * - Host migration on disconnect
 */
export default class CardMastersServer implements Party.Server {
  gameState: GameState
  private engine: KachufulEngine | null = null
  private readonly scoringModel: ScoreModel = { type: 'standard', hitPoints: 10 }
  private readonly handSequence = [8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8]
  private roundTransitionTimer: ReturnType<typeof setTimeout> | null = null
  private roundTransitionDelayMs = 10_000
  private readonly avatarEmojis = ['🦊', '🐺', '🦁', '🐯', '🐸', '🐙', '🦄', '🐉', '🦅', '🐼']
  private readonly assignedAvatars = new Map<string, string>()
  
  constructor(readonly room: Party.Room) {
    // Generate unique lobby code for this room
    const lobbyCode = room.id === 'default' ? generateLobbyCode() : room.id.toUpperCase()
    
    // Initialize lobby state
    this.gameState = {
      lobbyCode,
      hostId: '',
      status: 'lobby' as GameStatus,
      players: [],
      currentTurn: null,
      round: 0,
      maxPlayers: 4,
      createdAt: Date.now(),
      startedAt: null,
      phase: 'idle',
      handSize: 0,
      trump: null,
      bids: {},
      tricksWon: {},
      currentTrick: [],
      pendingAction: 'none',
      deckCount: 0,
      lastTrickWinner: null,
      history: [],
      handSequence: this.handSequence,
    }
  }

  /**
   * Called when a new connection is established
   */
  async onConnect(conn: Party.Connection) {
    console.log('[Server] New connection:', conn.id, 'to room:', this.room.id)
    // Send current lobby state to new connection
    this.sendToConnection(conn, {
      type: 'game_state',
      payload: this.gameState,
      timestamp: Date.now(),
    })
    console.log('[Server] Sent initial game state to:', conn.id)
  }

  /**
   * Handle incoming messages from clients
   */
  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message)
      console.log('[Server] Message from', sender.id, ':', msg.type)

      switch (msg.type) {
        case 'create_lobby':
          this.handleCreateLobby(sender, msg.payload as CreateLobbyPayload)
          break
        case 'join_lobby':
          this.handleJoinLobby(sender, msg.payload as JoinLobbyPayload)
          break
        case 'leave_lobby':
          this.handleLeaveLobby(sender)
          break
        case 'start_game':
          this.handleStartGame(sender)
          break
        case 'ready':
          this.handleReady(sender)
          break
        case 'play_card':
          this.handlePlayCard(sender, msg.payload as PlayCardPayload)
          break
        case 'submit_bid':
          this.handleSubmitBid(sender, msg.payload as SubmitBidPayload)
          break
        case 'chat':
          this.handleChat(sender, msg.payload as ChatPayload)
          break
        case 'kick_player':
          this.handleKickPlayer(sender, msg.payload as KickPlayerPayload)
          break
        default:
          this.sendError(sender, 'Unknown message type')
      }
    } catch (error) {
      console.error('[Server] Error processing message:', error)
      this.sendError(sender, 'Invalid message format')
    }
  }

  /**
   * Handle player disconnection
   */
  async onClose(conn: Party.Connection) {
    const player = this.findPlayer(conn.id)
    if (player) {
      player.status = 'disconnected' as PlayerStatus
      this.broadcastMessage({
        type: 'player_left',
        payload: { playerId: conn.id, playerName: player.name },
        timestamp: Date.now(),
      })
      
      if (this.gameState.status === 'lobby') {
        // Remove player immediately while in lobby
        this.removePlayer(conn.id)
        
        // Check if lobby is empty
        if (this.gameState.players.length === 0) {
          this.destroyLobby()
        } else if (player.isHost) {
          // Migrate host to next player
          this.migrateHost()
        }
      }
      
      this.broadcastGameState()
    }
  }

  /**
   * Create new lobby (host creates)
   */
  private handleCreateLobby(conn: Party.Connection, payload: CreateLobbyPayload) {
    console.log('[Server] Creating lobby for host:', payload.hostName)
    // Check if lobby already has players
    if (this.gameState.players.length > 0) {
      console.log('[Server] Lobby already exists with', this.gameState.players.length, 'players')
      this.sendError(conn, 'Lobby already exists')
      return
    }

    // Create host player
    const host: Player = {
      id: conn.id,
      name: payload.hostName,
      status: 'connected' as PlayerStatus,
      score: 0,
      handCount: 0,
      bid: null,
      tricksWon: 0,
      avatar: this.assignAvatar(conn.id),
      isHost: true,
      joinedAt: Date.now(),
    }

    this.gameState.hostId = conn.id
    this.gameState.players.push(host)
    this.gameState.maxPlayers = payload.maxPlayers || 4

    // Send lobby info to host
    const lobbyInfo: LobbyInfo = {
      code: this.gameState.lobbyCode,
      hostId: this.gameState.hostId,
      hostName: payload.hostName,
      playerCount: 1,
      maxPlayers: this.gameState.maxPlayers,
      createdAt: this.gameState.createdAt,
      status: this.gameState.status,
    }

    this.sendToConnection(conn, {
      type: 'lobby_created',
      payload: lobbyInfo,
      timestamp: Date.now(),
    })

    this.broadcastGameState()
  }

  /**
   * Join existing lobby with code
   */
  private handleJoinLobby(conn: Party.Connection, payload: JoinLobbyPayload) {
    // Verify lobby code matches
    if (payload.lobbyCode.toUpperCase() !== this.gameState.lobbyCode) {
      this.sendError(conn, 'Invalid lobby code')
      return
    }

    // Check if player already in lobby
    if (this.findPlayer(conn.id)) {
      this.sendError(conn, 'Already in lobby')
      return
    }

    // Check if lobby is full
    if (this.gameState.players.length >= this.gameState.maxPlayers) {
      this.sendError(conn, 'Lobby is full')
      return
    }

    // Check if game already started
    if (this.gameState.status !== 'lobby') {
      this.sendError(conn, 'Game already in progress')
      return
    }

    // Add player to lobby
    const player: Player = {
      id: conn.id,
      name: payload.playerName,
      status: 'connected' as PlayerStatus,
      score: 0,
      handCount: 0,
      bid: null,
      tricksWon: 0,
      avatar: this.assignAvatar(conn.id),
      isHost: false,
      joinedAt: Date.now(),
    }

    this.gameState.players.push(player)

    // Notify all players
    this.broadcastMessage({
      type: 'player_joined',
      payload: player,
      timestamp: Date.now(),
    })

    this.sendToConnection(conn, {
      type: 'lobby_joined',
      payload: this.gameState,
      timestamp: Date.now(),
    })

    this.broadcastGameState()
  }

  /**
   * Leave lobby
   */
  private handleLeaveLobby(conn: Party.Connection) {
    const player = this.findPlayer(conn.id)
    if (!player) {
      this.sendError(conn, 'Not in lobby')
      return
    }

    if (this.gameState.status !== 'lobby') {
      this.sendError(conn, 'Cannot leave during an active game')
      return
    }

    this.removePlayer(conn.id)

    this.broadcastMessage({
      type: 'player_left',
      payload: { playerId: conn.id, playerName: player.name },
      timestamp: Date.now(),
    })

    // Check if lobby is empty
    if (this.gameState.players.length === 0) {
      this.destroyLobby()
      return
    }

    // Migrate host if leaving player was host
    if (player.isHost) {
      this.migrateHost()
    }

    this.broadcastGameState()
  }

  /**
   * Start game (host only)
   */
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
      this.sendError(conn, 'Need at least 2 players to start')
      return
    }

    if (this.gameState.status !== 'lobby') {
      this.sendError(conn, 'Game already started')
      return
    }

    this.startGame()
  }

  /**
   * Kick player (host only)
   */
  private handleKickPlayer(conn: Party.Connection, payload: KickPlayerPayload) {
    if (!payload || !payload.playerId) {
      this.sendError(conn, 'Invalid kick payload')
      return
    }

    const kicker = this.findPlayer(conn.id)
    
    if (!kicker) {
      this.sendError(conn, 'Player not found')
      return
    }

    if (!kicker.isHost) {
      this.sendError(conn, 'Only host can kick players')
      return
    }

    if (this.gameState.status !== 'lobby') {
      this.sendError(conn, 'Cannot kick players after the game has started')
      return
    }

    const playerToKick = this.findPlayer(payload.playerId)
    if (!playerToKick) {
      this.sendError(conn, 'Player to kick not found')
      return
    }

    if (playerToKick.isHost) {
      this.sendError(conn, 'Cannot kick the host')
      return
    }

    // Remove player
    this.removePlayer(payload.playerId)

    // Notify all players
    this.broadcastMessage({
      type: 'player_kicked',
      payload: { playerId: payload.playerId, playerName: playerToKick.name },
      timestamp: Date.now(),
    })

    // Close connection for kicked player
    const kickedConn = this.room.getConnection(payload.playerId)
    if (kickedConn) {
      kickedConn.close()
    }

    // Broadcast new state, excluding the kicked player (who is now closed)
    this.broadcastGameState([payload.playerId])
  }

  /**
   * Player ready to start
   */
  private handleReady(conn: Party.Connection) {
    const player = this.findPlayer(conn.id)
    if (!player) {
      this.sendError(conn, 'Player not found')
      return
    }

    player.status = 'ready' as PlayerStatus

    // Check if all players are ready
    const allReady = this.gameState.players.every(
      p => p.status === 'ready'
    )

    if (allReady && this.gameState.players.length >= 2) {
      this.startGame()
    } else {
      this.broadcastGameState()
    }
  }

  /**
   * Start the game
   */
  private startGame() {
    const config = this.buildEngineConfig()
    this.engine = new KachufulEngine(config)
    const snapshot = this.engine.start()

    this.gameState.status = 'playing' as GameStatus
    this.gameState.startedAt = Date.now()

    // Mark all players as actively playing
    this.gameState.players = this.gameState.players.map(player => ({
      ...player,
      status: 'playing' as PlayerStatus,
    }))

    this.syncFromSnapshot(snapshot)
    this.broadcastMessage({
      type: 'game_started',
      payload: { round: this.gameState.round, currentTurn: this.gameState.currentTurn },
      timestamp: Date.now(),
    })

    this.sendHandsToPlayers()
    this.broadcastGameState()
  }

  /**
   * Handle card play action
   */
  private handlePlayCard(conn: Party.Connection, payload: PlayCardPayload) {
    if (!this.engine) {
      this.sendError(conn, 'Game has not started yet')
      return
    }

    if (!payload || !payload.cardId) {
      this.sendError(conn, 'Invalid play payload')
      return
    }

    try {
      const result = this.engine.playCard(conn.id, payload.cardId)
      this.afterEngineUpdate(result.snapshot)
    } catch (error) {
      if (error instanceof IllegalPlayError) {
        this.sendError(conn, error.message)
        return
      }
      console.error('[Server] Play card error', error)
      this.sendError(conn, 'Failed to play card')
    }
  }

  /**
   * Handle bid submissions during the bidding phase
   */
  private handleSubmitBid(conn: Party.Connection, payload: SubmitBidPayload) {
    if (!this.engine) {
      this.sendError(conn, 'Game has not started yet')
      return
    }

    if (typeof payload?.bid !== 'number') {
      this.sendError(conn, 'Invalid bid payload')
      return
    }

    try {
      const snapshot = this.engine.submitBid(conn.id, payload.bid)
      this.afterEngineUpdate(snapshot)
    } catch (error) {
      if (error instanceof IllegalBidError) {
        this.sendError(conn, error.message)
        return
      }
      console.error('[Server] Bid submission error', error)
      this.sendError(conn, 'Failed to submit bid')
    }
  }

  /**
   * Handle chat message
   */
  private handleChat(conn: Party.Connection, payload: ChatPayload) {
    const player = this.findPlayer(conn.id)
    if (!player) return

    this.broadcastMessage({
      type: 'chat',
      payload: {
        playerId: conn.id,
        playerName: player.name,
        message: payload.message,
      },
      timestamp: Date.now(),
    })
  }

  /**
   * End the game
   */
  private endGame() {
    if (this.gameState.status === 'finished') {
      return
    }

    this.gameState.status = 'finished' as GameStatus
    this.gameState.phase = 'completed'
    
    const winner = this.gameState.players.reduce((prev, current) => 
      prev.score >= current.score ? prev : current
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

    this.broadcastGameState()
  }

  /**
   * Migrate host to another player
   */
  private migrateHost() {
    const oldHostId = this.gameState.hostId
    
    // Find next player to be host (oldest join time)
    const newHost = this.gameState.players
      .filter(p => p.id !== oldHostId)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0]

    if (!newHost) return

    // Update old host
    const oldHost = this.findPlayer(oldHostId)
    if (oldHost) {
      oldHost.isHost = false
    }

    // Set new host
    newHost.isHost = true
    this.gameState.hostId = newHost.id

    this.broadcastMessage({
      type: 'host_changed',
      payload: {
        oldHostId,
        newHostId: newHost.id,
        newHostName: newHost.name,
      },
      timestamp: Date.now(),
    })

    this.broadcastGameState()
  }

  /**
   * Destroy lobby
   */
  private destroyLobby() {
    this.broadcastMessage({
      type: 'lobby_destroyed',
      payload: { message: 'Lobby has been destroyed' },
      timestamp: Date.now(),
    })
    this.assignedAvatars.clear()
  }

  private buildEngineConfig(): EngineRulesConfig {
    const dealerIndex = this.findDealerIndex()
    return {
      players: this.gameState.players.map(player => ({ id: player.id, name: player.name })),
      handSequence: this.gameState.handSequence,
      scoring: this.scoringModel,
      lastBidRestriction: true,
      trumpRotation: 'rotate',
      initialDealerIndex: dealerIndex >= 0 ? dealerIndex : 0,
      rngSeed: `${this.gameState.lobbyCode}-${this.gameState.createdAt}`,
    }
  }

  private findDealerIndex(): number {
    return this.gameState.players.findIndex(player => player.id === this.gameState.hostId)
  }

  private syncFromSnapshot(snapshot: EngineSnapshot) {
    this.gameState.phase = snapshot.phase
    this.gameState.handSize = snapshot.handSize
    this.gameState.trump = snapshot.trump
    this.gameState.currentTurn = snapshot.pendingPlayerId
    this.gameState.round = snapshot.roundIndex + 1
    this.gameState.bids = { ...snapshot.bids }
    this.gameState.tricksWon = { ...snapshot.tricksWon }
    this.gameState.currentTrick = snapshot.currentTrick.map(play => ({
      playerId: play.playerId,
      card: play.card as PlayingCard,
    }))
    this.gameState.pendingAction = snapshot.pendingAction
    this.gameState.deckCount = snapshot.deckCount
    this.gameState.lastTrickWinner = snapshot.lastTrickWinner
    this.gameState.history = [...snapshot.history]

    this.gameState.players = this.gameState.players.map(player => {
      const view = snapshot.players.find(p => p.id === player.id)
      if (!view) {
        return player
      }
      return {
        ...player,
        score: view.score,
        handCount: view.handCount,
        bid: view.bid,
        tricksWon: view.tricksWon,
        status: player.status === 'disconnected' ? player.status : 'playing',
      }
    })
  }

  private afterEngineUpdate(snapshot: EngineSnapshot) {
    this.syncFromSnapshot(snapshot)
    this.sendHandsToPlayers()
    this.broadcastGameState()

    if (snapshot.phase === 'completed') {
      this.clearRoundTransitionTimer()
      this.engine = null
      this.endGame()
      return
    }

    if (snapshot.phase === 'round_end') {
      this.scheduleNextRound()
      return
    }

    this.clearRoundTransitionTimer()
  }

  private scheduleNextRound() {
    if (!this.engine) {
      return
    }

    if (this.roundTransitionTimer) {
      return
    }

    this.roundTransitionTimer = setTimeout(() => {
      this.roundTransitionTimer = null
      if (!this.engine) {
        return
      }

      if (this.gameState.phase !== 'round_end') {
        return
      }

      try {
        const snapshot = this.engine.startNextRound()
        this.afterEngineUpdate(snapshot)
      } catch (error) {
        console.error('[Server] Failed to start next round', error)
      }
    }, this.roundTransitionDelayMs)
  }

  private clearRoundTransitionTimer() {
    if (this.roundTransitionTimer) {
      clearTimeout(this.roundTransitionTimer)
      this.roundTransitionTimer = null
    }
  }

  private sendHandsToPlayers() {
    if (!this.engine) {
      return
    }

    this.gameState.players.forEach(player => {
      const view = this.engine?.getPlayerView(player.id)
      if (!view) {
        return
      }
      const playableCardIds = this.getPlayableCardIds(player.id)
      this.sendHandToPlayer(player.id, view.cards as PlayingCard[], playableCardIds)
    })
  }

  private sendHandToPlayer(playerId: string, cards: PlayingCard[], playableCardIds: string[]) {
    const conn = this.room.getConnection(playerId)
    if (!conn) {
      return
    }

    this.sendToConnection(conn, {
      type: 'hand_update',
      payload: { playerId, cards, playableCardIds },
      timestamp: Date.now(),
    })
  }

  private getPlayableCardIds(playerId: string): string[] {
    if (!this.engine) {
      return []
    }

    const snapshot = this.engine.getSnapshot(playerId)
    const viewer = snapshot.players.find(player => player.id === playerId)
    if (!viewer || !viewer.cards.length) {
      return []
    }

    const allCards = viewer.cards.map(card => card.id)
    if (snapshot.phase !== 'playing' || snapshot.pendingPlayerId !== playerId) {
      return allCards
    }

    const leadSuit = snapshot.currentTrick[0]?.card.suit
    if (!leadSuit) {
      return allCards
    }

    const suitMatches = viewer.cards.filter(card => card.suit === leadSuit).map(card => card.id)
    return suitMatches.length > 0 ? suitMatches : allCards
  }

  private assignAvatar(playerId: string): string {
    const existing = this.assignedAvatars.get(playerId)
    if (existing) {
      return existing
    }

    const used = new Set(this.assignedAvatars.values())
    const available = this.avatarEmojis.filter(emoji => !used.has(emoji))
    const avatar = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : '🎴'

    this.assignedAvatars.set(playerId, avatar)
    return avatar
  }

  private releaseAvatar(playerId: string) {
    this.assignedAvatars.delete(playerId)
  }

  /**
   * Find player by ID
   */
  private findPlayer(playerId: string): Player | undefined {
    return this.gameState.players.find(p => p.id === playerId)
  }

  /**
   * Remove player by ID
   */
  private removePlayer(playerId: string) {
    this.releaseAvatar(playerId)
    this.gameState.players = this.gameState.players.filter(p => p.id !== playerId)
  }

  /**
   * Broadcast message to all connections
   */
  private broadcastMessage(message: ServerMessage, exclude?: string[]) {
    this.room.broadcast(JSON.stringify(message), exclude)
  }

  /**
   * Broadcast current game state to all players
   */
  private broadcastGameState(exclude?: string[]) {
    this.broadcastMessage({
      type: 'game_state',
      payload: this.gameState,
      timestamp: Date.now(),
    }, exclude)
  }

  /**
   * Send message to specific connection
   */
  private sendToConnection(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message))
  }

  /**
   * Send error message to connection
   */
  private sendError(conn: Party.Connection, message: string) {
    this.sendToConnection(conn, {
      type: 'error',
      payload: { message },
      timestamp: Date.now(),
    })
  }
}
