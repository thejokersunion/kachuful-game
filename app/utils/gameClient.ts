import { useRef, useState, useEffect, useCallback } from 'react'
import PartySocket from "partysocket"
import type { ClientMessage, ServerMessage, CreateLobbyPayload, JoinLobbyPayload, PlayCardPayload, ChatPayload, KickPlayerPayload } from "../types/game"

/**
 * PartyKit client for Card Masters game with enterprise lobby system
 * Manages WebSocket connection and game state sync
 */
export class GameClient {
  private socket: PartySocket | null = null
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()

  constructor(
    private host: string,
    private roomId: string
  ) {}

  /**
   * Connect to game room
   */
  connect() {
    if (this.socket) {
      return
    }

    this.socket = new PartySocket({
      host: this.host,
      room: this.roomId,
    })

    this.socket.addEventListener('message', (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data as string)
        this.emit(message.type, message.payload)
        this.emit('message', message)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    })

    this.socket.addEventListener('open', () => {
      this.emit('connected', {})
    })

    this.socket.addEventListener('close', () => {
      this.emit('disconnected', {})
    })

    this.socket.addEventListener('error', (error) => {
      this.emit('error', error)
    })
  }

  /**
   * Disconnect from game room
   */
  disconnect() {
    if (this.socket) {
      this.send({ type: 'leave_lobby', payload: {} })
      this.socket.close()
      this.socket = null
    }
  }

  /**
   * Create new lobby
   */
  createLobby(hostName: string, maxPlayers = 4, avatar?: string) {
    this.send({
      type: 'create_lobby',
      payload: { hostName, maxPlayers, avatar } as CreateLobbyPayload,
    })
  }

  /**
   * Join lobby with code
   */
  joinLobby(lobbyCode: string, playerName: string, avatar?: string) {
    this.send({
      type: 'join_lobby',
      payload: { lobbyCode, playerName, avatar } as JoinLobbyPayload,
    })
  }

  /**
   * Leave lobby
   */
  leaveLobby() {
    this.send({
      type: 'leave_lobby',
      payload: {},
    })
  }

  /**
   * Start game (host only)
   */
  startGame() {
    this.send({
      type: 'start_game',
      payload: {},
    })
  }

  /**
   * Mark player as ready
   */
  ready() {
    this.send({
      type: 'ready',
      payload: {},
    })
  }

  /**
   * Kick player (host only)
   */
  kickPlayer(playerId: string) {
    this.send({
      type: 'kick_player',
      payload: { playerId } as KickPlayerPayload,
    })
  }

  /**
   * Play a card
   */
  playCard(cardId: string, targetPlayerId?: string) {
    this.send({
      type: 'play_card',
      payload: { cardId, targetPlayerId } as PlayCardPayload,
    })
  }

  /**
   * Send chat message
   */
  chat(message: string) {
    this.send({
      type: 'chat',
      payload: { message } as ChatPayload,
    })
  }

  /**
   * Send message to server
   */
  private send(message: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Socket not connected')
      return
    }

    this.socket.send(JSON.stringify(message))
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (data: unknown) => void) {
    this.listeners.get(event)?.delete(callback)
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: unknown) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      for (const callback of listeners) {
        callback(data)
      }
    }
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

/**
 * React hook for using GameClient
 */
export function useGameClient(host: string, roomId: string) {
  const clientRef = useRef<GameClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Re-initialize client when host or roomId changes
  useEffect(() => {
    // Disconnect existing client if any
    if (clientRef.current) {
      clientRef.current.disconnect()
    }

    // Create new client
    clientRef.current = new GameClient(host, roomId)
    clientRef.current.connect()

    // Setup connection listeners
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    clientRef.current.on('connected', onConnect)
    clientRef.current.on('disconnected', onDisconnect)

    return () => {
      if (clientRef.current) {
        clientRef.current.off('connected', onConnect)
        clientRef.current.off('disconnected', onDisconnect)
        clientRef.current.disconnect()
      }
    }
  }, [host, roomId])

  const connect = useCallback(() => clientRef.current?.connect(), [])
  const disconnect = useCallback(() => clientRef.current?.disconnect(), [])
  const createLobby = useCallback((name: string, maxPlayers?: number, avatar?: string) => 
    clientRef.current?.createLobby(name, maxPlayers, avatar), [])
  const joinLobby = useCallback((code: string, name: string, avatar?: string) => 
    clientRef.current?.joinLobby(code, name, avatar), [])
  const leaveLobby = useCallback(() => clientRef.current?.leaveLobby(), [])
  const startGame = useCallback(() => clientRef.current?.startGame(), [])
  const ready = useCallback(() => clientRef.current?.ready(), [])
  const kickPlayer = useCallback((playerId: string) => clientRef.current?.kickPlayer(playerId), [])
  const playCard = useCallback((cardId: string, target?: string) => clientRef.current?.playCard(cardId, target), [])
  const chat = useCallback((message: string) => clientRef.current?.chat(message), [])
  const on = useCallback((event: string, callback: (data: unknown) => void) => clientRef.current?.on(event, callback), [])
  const off = useCallback((event: string, callback: (data: unknown) => void) => clientRef.current?.off(event, callback), [])

  return {
    client: clientRef.current,
    isConnected,
    connect,
    disconnect,
    createLobby,
    joinLobby,
    leaveLobby,
    startGame,
    ready,
    kickPlayer,
    playCard,
    chat,
    on,
    off,
  }
}
