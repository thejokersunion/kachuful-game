import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameClient } from '../utils/gameClient'
import PartySocket from 'partysocket'

// Mock PartySocket
vi.mock('partysocket', () => {
  return {
    default: class MockPartySocket {
      static instance: MockPartySocket
      // biome-ignore lint/suspicious/noExplicitAny: Mocking options
      constructor(public options: any) {
        MockPartySocket.instance = this
      }
      addEventListener = vi.fn()
      removeEventListener = vi.fn()
      send = vi.fn()
      close = vi.fn()
    }
  }
})

describe('GameClient - Client Side Lobby Management', () => {
  let client: GameClient
  // biome-ignore lint/suspicious/noExplicitAny: Mock socket
  let mockSocket: any

  beforeEach(() => {
    vi.clearAllMocks()
    client = new GameClient('localhost:1999', 'test-room')
    client.connect()
    // biome-ignore lint/suspicious/noExplicitAny: Debugging
    console.log('Client socket:', (client as any).socket)
    // Get the mock instance created by connect()
    // biome-ignore lint/suspicious/noExplicitAny: Accessing mock static
    mockSocket = (PartySocket as unknown as { instance: any }).instance
    console.log('Mock socket instance:', mockSocket)
  })

  describe('Connection', () => {
    it('should connect to the correct room', () => {
      expect(mockSocket.options.host).toBe('localhost:1999')
      expect(mockSocket.options.room).toBe('test-room')
    })

    it('should register event listeners', () => {
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })

  describe('Lobby Actions', () => {
    it('should send create_lobby message', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Debugging
      console.log('Socket in test:', (client as any).socket)
      client.createLobby('Host', 4, 'avatar-1')
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'create_lobby',
        payload: { hostName: 'Host', maxPlayers: 4, avatar: 'avatar-1' }
      }))
    })

    it('should send join_lobby message', () => {
      client.joinLobby('ABC123', 'Player', 'avatar-2')
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'join_lobby',
        payload: { lobbyCode: 'ABC123', playerName: 'Player', avatar: 'avatar-2' }
      }))
    })

    it('should send leave_lobby message', () => {
      client.leaveLobby()
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'leave_lobby',
        payload: {}
      }))
    })

    it('should send start_game message', () => {
      client.startGame()
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'start_game',
        payload: {}
      }))
    })

    it('should send kick_player message', () => {
      client.kickPlayer('player-123')
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'kick_player',
        payload: { playerId: 'player-123' }
      }))
    })
  })

  describe('Event Handling', () => {
    it('should emit game_state event when receiving game_state message', () => {
      const onGameState = vi.fn()
      client.on('game_state', onGameState)

      // Simulate receiving message
      // biome-ignore lint/suspicious/noExplicitAny: Mock calls access
      const messageHandler = mockSocket.addEventListener.mock.calls.find((call: any[]) => call[0] === 'message')[1]
      const payload = { status: 'lobby', players: [] }
      
      messageHandler({
        data: JSON.stringify({
          type: 'game_state',
          payload
        })
      })

      expect(onGameState).toHaveBeenCalledWith(payload)
    })

    it('should emit error event when receiving error message', () => {
      const onError = vi.fn()
      client.on('error', onError)

      // biome-ignore lint/suspicious/noExplicitAny: Mock calls access
      const messageHandler = mockSocket.addEventListener.mock.calls.find((call: any[]) => call[0] === 'message')[1]
      const payload = { message: 'Lobby full' }
      
      messageHandler({
        data: JSON.stringify({
          type: 'error',
          payload
        })
      })

      expect(onError).toHaveBeenCalledWith(payload)
    })
  })
})
