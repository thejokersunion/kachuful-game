import { useEffect, useMemo, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, XStack, YStack } from 'tamagui'
import { useResponsive } from '../hooks/useResponsive'
import { ResponsiveContainer } from '../components/ResponsiveContainer'
import { CardFlight } from '../components/game-table/CardFlight'
import { CenterDeck } from '../components/game-table/CenterDeck'
import { FloatingCards, type FloatingCardDecoration } from '../components/game-table/FloatingCards'
import { PlayerBadge } from '../components/game-table/PlayerBadge'
import { PlayerHand } from '../components/game-table/PlayerHand'
import { TrumpCardSpotlight } from '../components/game-table/TrumpCardSpotlight'
import { getDeckOrigin, type Point2D } from '../components/game-table/animationTargets'
import { getPlayerDirection, getPlayerPosition, getPlayerTargetPoint, getTrumpTargetPoint, type PlayerDirection } from '../components/game-table/playerLayout'
import type { PlayingCard, TablePlayer } from '../components/game-table/types'
import type { GameCardSize } from '../components/game-table/GameCard'

export default function GameTable() {
  const { width, height, isMobile, isTablet } = useResponsive()

  const players = useMemo<TablePlayer[]>(
    () => [
      { id: '1', displayName: 'GUEST001', coins: 3_500_000, avatar: '🎮', isCurrentTurn: true },
      { id: '2', displayName: 'GUEST689', coins: 5_500_000, avatar: '👨', isCurrentTurn: false },
      { id: '3', displayName: 'GUEST391', coins: 9_100_000, avatar: '👩', isCurrentTurn: false },
      { id: '4', displayName: 'GUEST252', coins: 6_900_000, avatar: '👴', isCurrentTurn: false },
      { id: '5', displayName: 'GUEST258', coins: 6_900_000, avatar: '👧', isCurrentTurn: false },
    ],
    []
  )

  const playerHand = useMemo<PlayingCard[]>(
    () => [
      { suit: '♠', rank: 'A', id: 'c1' },
      { suit: '♠', rank: '4', id: 'c2' },
      { suit: '♠', rank: 'J', id: 'c3' },
      { suit: '♠', rank: 'K', id: 'c4' },
      { suit: '♦', rank: 'Q', id: 'c5' },
    ],
    []
  )

  const floatingCards = useMemo<FloatingCardDecoration[]>(
    () => [
      { suit: '♣', rank: 'A', id: 'fc1', top: '5%', right: '10%', rotation: 15 },
      { suit: '♦', rank: 'K', id: 'fc2', top: '8%', right: '25%', rotation: -20 },
      { suit: '♥', rank: 'Q', id: 'fc3', top: '3%', left: '15%', rotation: 25 },
    ],
    []
  )

  const trumpCard = useMemo<PlayingCard>(() => ({ suit: '♠', rank: 'A', id: 'trump' }), [])
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [dealtCounts, setDealtCounts] = useState<Record<string, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )
  const [isTrumpRevealed, setIsTrumpRevealed] = useState(false)
  type ActiveFlight = {
    id: string
    playerId: string
    direction: PlayerDirection
    target: Point2D
  }

  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([])

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const cardSize: GameCardSize = isMobile ? 'normal' : isTablet ? 'normal' : 'large'

  const currentPlayer = players[0]
  const otherPlayers = players.slice(1)

  const playerDirections = useMemo<Record<string, PlayerDirection>>(
    () =>
      players.reduce((acc, player, index) => {
        acc[player.id] = getPlayerDirection(index, players.length)
        return acc
      }, {} as Record<string, PlayerDirection>),
    [players]
  )

  const deckOrigin = useMemo(() => getDeckOrigin(width, height), [width, height])
  const trumpTarget = useMemo(() => getTrumpTargetPoint(width, height, isMobile), [width, height, isMobile])

  const playerTargets = useMemo<Record<string, Point2D>>(
    () =>
      players.reduce((acc, player, index) => {
        acc[player.id] = getPlayerTargetPoint(index, players.length, width, height, isMobile)
        return acc
      }, {} as Record<string, Point2D>),
    [players, width, height, isMobile]
  )

  useEffect(() => {
    setIsTrumpRevealed(false)
    const totalDeals = players.length * 5
    const travelDuration = isMobile ? 360 : 440
    let cancelled = false
    let flightTimer: ReturnType<typeof setTimeout> | null = null
    let delayTimer: ReturnType<typeof setTimeout> | null = null
    let dealIndex = 0
    let trumpFlightStarted = false

    const startTrumpFlight = () => {
      if (cancelled || trumpFlightStarted) return
      trumpFlightStarted = true
      const dealId = 'trump-flight'
      setActiveFlights((prev) => [
        ...prev.filter((flight) => flight.id !== dealId),
        {
          id: dealId,
          playerId: 'TRUMP',
          direction: 'trump',
          target: trumpTarget,
        },
      ])

      flightTimer = setTimeout(() => {
        if (cancelled) {
          return
        }
        setActiveFlights((prev) => prev.filter((flight) => flight.id !== dealId))
        setIsTrumpRevealed(true)
      }, travelDuration)
    }

    const tick = () => {
      if (cancelled) {
        return
      }

      if (dealIndex >= totalDeals) {
        startTrumpFlight()
        return
      }

      const targetPlayer = players[dealIndex % players.length]
      const direction = playerDirections[targetPlayer.id] ?? 'top'
      const dealId = `${targetPlayer.id}-${dealIndex}`
      const targetPoint = playerTargets[targetPlayer.id] ?? deckOrigin

      setActiveFlights((prev) => [...prev.filter((flight) => flight.id !== dealId), { id: dealId, playerId: targetPlayer.id, direction, target: targetPoint }])

      flightTimer = setTimeout(() => {
        if (cancelled) {
          return
        }
        setDealtCounts((prev) => ({
          ...prev,
          [targetPlayer.id]: Math.min((prev[targetPlayer.id] ?? 0) + 1, 5),
        }))
        setActiveFlights((prev) => prev.filter((flight) => flight.id !== dealId))
        dealIndex += 1
        delayTimer = setTimeout(tick, 140)
      }, travelDuration)
    }

    tick()

    return () => {
      cancelled = true
      if (flightTimer) clearTimeout(flightTimer)
      if (delayTimer) clearTimeout(delayTimer)
      setIsTrumpRevealed(false)
      setActiveFlights([])
    }
  }, [players, playerDirections, playerTargets, deckOrigin, isMobile, trumpTarget])

  const visibleHandCount = Math.min(playerHand.length, dealtCounts[currentPlayer.id] ?? 0)
  const visibleHand = useMemo(() => playerHand.slice(0, visibleHandCount), [playerHand, visibleHandCount])

  useEffect(() => {
    setSelectedCards((prev) => {
      const allowedIds = new Set(visibleHand.map((card) => card.id))
      const filtered = new Set(Array.from(prev).filter((id) => allowedIds.has(id)))
      return filtered.size === prev.size ? prev : filtered
    })
  }, [visibleHand])

  const totalDealsNeeded = players.length * 5 + 1
  const totalDealt = players.reduce((sum, player) => sum + (dealtCounts[player.id] ?? 0), 0)
  const dealtWithTrump = totalDealt + (isTrumpRevealed ? 1 : 0)
  const remainingCards = Math.max(totalDealsNeeded - dealtWithTrump - activeFlights.length, 0)

  return (
    <ResponsiveContainer bg="$background" overflow="hidden">
      <Stack flex={1} position="relative" overflow="hidden">
        <LinearGradient
          colors={['#2563EB', '#1E40AF', '#1E3A8A']}
          start={[0, 0]}
          end={[1, 1]}
          style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        />

        <FloatingCards cards={floatingCards} isMobile={isMobile} />

        {otherPlayers.map((player, idx) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isMobile={isMobile}
            placementStyle={getPlayerPosition(idx + 1, players.length, width, height, isMobile)}
            dealtCount={dealtCounts[player.id] ?? 0}
          />
        ))}

        {/* Center playing area */}
        <YStack
          gap="$3"
          ai="center"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <CenterDeck remainingCards={remainingCards} isAnimating={activeFlights.length > 0} />
        </YStack>

        {activeFlights.map((flight) => (
          <CardFlight
            key={flight.id}
            direction={flight.direction}
            origin={deckOrigin}
            target={flight.target}
            isMobile={isMobile}
          />
        ))}

        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingVertical={isMobile ? '$2' : '$3'}
          paddingHorizontal={isMobile ? '$3' : '$4'}
        >
          <XStack jc="space-between" ai="flex-end" gap="$3">
            <PlayerBadge
              player={currentPlayer}
              isMobile={isMobile}
              variant="inline"
              dealtCount={dealtCounts[currentPlayer.id] ?? 0}
            />
            <YStack flex={0} width={isMobile ? 40 : 48} />
          </XStack>
        </YStack>

        <PlayerHand
          cards={visibleHand}
          selectedCards={selectedCards}
          onToggle={toggleCardSelection}
          cardSize={cardSize}
          bottomOffset={isMobile ? 10 : 15}
        />

        <TrumpCardSpotlight
          card={trumpCard}
          isMobile={isMobile}
          position={trumpTarget}
          isVisible={isTrumpRevealed}
        />
      </Stack>
    </ResponsiveContainer>
  )
}
