/**
 * Hook for managing Kachuful game state
 * Handles WebSocket communication and state synchronization
 */

import { useState, useEffect, useCallback } from 'react'
import { useGameClient } from '../utils/gameClient'
import type { KachufulGameState, GameSettings } from '../types/kachuful'

interface UseKachufulGameReturn {
  gameState: KachufulGameState | null
  isConnected: boolean
  startGame: (settings: GameSettings) => void
  placeBid: (bid: number) => void
  playCard: (cardId: string) => void
  error: string | null
}

export function useKachufulGame(
  host: string,
  roomId: string,
  playerId: string
): UseKachufulGameReturn {
  const [gameState, setGameState] = useState<KachufulGameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const {
    isConnected,
    startKachufulGame,
    placeBid: placeBidClient,
    playKachufulCard,
    on,
    off,
  } = useGameClient(host, roomId)

  // Subscribe to game state updates
  useEffect(() => {
    const handleGameState = (data: unknown) => {
      const state = data as KachufulGameState
      setGameState(state)
      setError(null)
    }

    const handleError = (data: unknown) => {
      const errorData = data as { message: string }
      setError(errorData.message)
    }

    on('kachuful_game_state', handleGameState)
    on('error', handleError)

    return () => {
      off('kachuful_game_state', handleGameState)
      off('error', handleError)
    }
  }, [on, off])

  // Start game wrapper
  const startGame = useCallback(
    (settings: GameSettings) => {
      setError(null)
      startKachufulGame(settings)
    },
    [startKachufulGame]
  )

  // Place bid wrapper
  const placeBid = useCallback(
    (bid: number) => {
      setError(null)
      placeBidClient(bid)
    },
    [placeBidClient]
  )

  // Play card wrapper
  const playCard = useCallback(
    (cardId: string) => {
      setError(null)
      playKachufulCard(cardId)
    },
    [playKachufulCard]
  )

  return {
    gameState,
    isConnected,
    startGame,
    placeBid,
    playCard,
    error,
  }
}

/**
 * Get current player from game state
 */
export function useCurrentPlayer(gameState: KachufulGameState | null, playerId: string) {
  return gameState?.players.find(p => p.id === playerId) || null
}

/**
 * Check if it's current player's turn
 */
export function useIsMyTurn(gameState: KachufulGameState | null, playerId: string): boolean {
  if (!gameState) return false
  
  // Check bidding phase
  if (gameState.phase === 'bidding') {
    return gameState.currentBidderId === playerId
  }
  
  // Check playing phase
  if (gameState.phase === 'playing') {
    return gameState.currentPlayerId === playerId
  }
  
  return false
}
