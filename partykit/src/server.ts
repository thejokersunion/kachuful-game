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
  GameStatus,
  PlayerStatus,
  LobbyInfo
} from "./types"
import { generateLobbyCode } from "./utils"

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
      
      // Remove player immediately
      this.removePlayer(conn.id)
      
      // Check if lobby is empty
      if (this.gameState.players.length === 0) {
        this.destroyLobby()
      } else if (player.isHost) {
        // Migrate host to next player
        this.migrateHost()
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
      cards: [],
      avatar: payload.avatar,
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
      cards: [],
      avatar: payload.avatar,
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
    this.gameState.status = 'starting' as GameStatus
    this.gameState.startedAt = Date.now()

    // Deal initial cards to players
    this.gameState.players.forEach(player => {
      player.status = 'playing' as PlayerStatus
      player.cards = this.dealCards(5)
    })

    // Set first player turn (host goes first)
    this.gameState.currentTurn = this.gameState.hostId
    this.gameState.status = 'playing' as GameStatus
    this.gameState.round = 1

    this.broadcastMessage({
      type: 'game_started',
      payload: { round: 1, currentTurn: this.gameState.currentTurn },
      timestamp: Date.now(),
    })

    this.broadcastGameState()
  }

  /**
   * Handle card play action
   */
  private handlePlayCard(conn: Party.Connection, payload: PlayCardPayload) {
    const player = this.findPlayer(conn.id)
    
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

    // Remove card from hand
    player.cards = player.cards.filter(c => c !== payload.cardId)
    
    // Award points (simplified)
    player.score += 10

    // Move to next player's turn
    this.nextTurn()

    this.broadcastMessage({
      type: 'turn_update',
      payload: {
        playerId: conn.id,
        cardId: payload.cardId,
        currentTurn: this.gameState.currentTurn,
      },
      timestamp: Date.now(),
    })

    this.broadcastGameState()
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
   * Move to next player's turn
   */
  private nextTurn() {
    const currentIndex = this.gameState.players.findIndex(
      p => p.id === this.gameState.currentTurn
    )
    const nextIndex = (currentIndex + 1) % this.gameState.players.length
    this.gameState.currentTurn = this.gameState.players[nextIndex].id

    // Check if round is complete
    if (nextIndex === 0) {
      this.gameState.round++
    }

    // Check win condition
    const winner = this.gameState.players.find(p => p.score >= 100)
    
    if (winner) {
      this.endGame()
    }
  }

  /**
   * End the game
   */
  private endGame() {
    this.gameState.status = 'finished' as GameStatus
    
    // Get winner
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
  }

  /**
   * Deal random cards
   */
  private dealCards(count: number): string[] {
    const cards: string[] = []
    const cardTypes = ['attack', 'defense', 'special', 'power']
    
    for (let i = 0; i < count; i++) {
      const type = cardTypes[Math.floor(Math.random() * cardTypes.length)]
      const value = Math.floor(Math.random() * 10) + 1
      cards.push(`${type}-${value}-${Date.now()}-${i}`)
    }
    
    return cards
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
