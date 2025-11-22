import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, Paragraph, Stack, XStack, YStack } from 'tamagui'
import { useResponsive } from '../hooks/useResponsive'
import { ResponsiveContainer } from '../components/ResponsiveContainer'
import { FloatingCards, type FloatingCardDecoration } from '../components/game-table/FloatingCards'
import { CardFlight } from '../components/game-table/CardFlight'
import { PlayerBadge } from '../components/game-table/PlayerBadge'
import { PlayerHand } from '../components/game-table/PlayerHand'
import { TrumpCardSpotlight } from '../components/game-table/TrumpCardSpotlight'
import { CenterDeck } from '../components/game-table/CenterDeck'
import { getDeckOrigin, type Point2D } from '../components/game-table/animationTargets'
import { getPlayerDirection, getPlayerPosition, getPlayerTargetPoint, type PlayerDirection } from '../components/game-table/playerLayout'
import type { PlayingCard as TableCard, TablePlayer } from '../components/game-table/types'
import type { PlayingCard as EngineCard, PendingAction, RoundPhase, Suit, TrickView } from '../types/game'
import type { GameCardSize } from '../components/game-table/GameCard'
import { BidPanel } from '../components/game-table/BidPanel'
import { TrickStatus } from '../components/game-table/TrickStatus'
import { HandToolbar } from '../components/game-table/HandToolbar'

interface GameTableProps {
  players?: TablePlayer[]
  playerCount?: number
  maxPlayers?: number
  hand?: EngineCard[]
  onLeaveGame?: () => void
  round?: number
  phase?: RoundPhase
  pendingAction?: PendingAction
  trump?: Suit | null
  currentTrick?: TrickView[]
  lastTrickWinner?: string | null
  deckCount?: number
  myBid?: number | null
  myTricksWon?: number
  isMyTurn?: boolean
  handSize?: number
  onSubmitBid?: (bid: number) => void
  onPlayCard?: (cardId: string) => void
  playableCardIds?: string[]
}

interface DealFlight {
  id: string
  direction: PlayerDirection
  origin: Point2D
  target: Point2D
  reveal?: boolean
  revealDelay?: number
  cardRank?: string
  cardSuit?: TableCard['suit']
}

const RANK_LABEL: Record<number, TableCard['rank']> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
}

const SUIT_GLYPH: Record<Suit, TableCard['suit']> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
}

const fallbackHand: TableCard[] = [
  { suit: '♠', rank: 'A', id: 'sample-1' },
  { suit: '♠', rank: '4', id: 'sample-2' },
  { suit: '♠', rank: 'J', id: 'sample-3' },
  { suit: '♠', rank: 'K', id: 'sample-4' },
  { suit: '♦', rank: 'Q', id: 'sample-5' },
]

const floatingCards: FloatingCardDecoration[] = [
  { suit: '♣', rank: 'A', id: 'fc1', top: '5%', right: '10%', rotation: 15 },
  { suit: '♦', rank: 'K', id: 'fc2', top: '8%', right: '25%', rotation: -20 },
  { suit: '♥', rank: 'Q', id: 'fc3', top: '3%', left: '15%', rotation: 25 },
]

const defaultPlayers: TablePlayer[] = [
  { id: '1', displayName: 'GUEST001', coins: 3_500_000, avatar: '🎮', isCurrentTurn: true, bid: null, tricksWon: 0, status: 'connected', score: 0, handCount: 5, isHost: true, isSelf: true },
  { id: '2', displayName: 'GUEST689', coins: 5_500_000, avatar: '👨', isCurrentTurn: false, bid: null, tricksWon: 0, status: 'connected', score: 0, handCount: 5, isHost: false, isSelf: false },
  { id: '3', displayName: 'GUEST391', coins: 9_100_000, avatar: '👩', isCurrentTurn: false, bid: null, tricksWon: 0, status: 'connected', score: 0, handCount: 5, isHost: false, isSelf: false },
]

function mapToTableCard(card: EngineCard): TableCard {
  const rank = RANK_LABEL[card.rank] ?? 'A'
  const suit = (card.symbol as TableCard['suit']) ?? SUIT_GLYPH[card.suit]
  return { id: card.id, rank, suit }
}

export default function GameTable({
  players: providedPlayers,
  playerCount,
  maxPlayers,
  hand,
  onLeaveGame,
  round = 1,
  phase = 'idle',
  pendingAction = 'none',
  trump = null,
  currentTrick = [],
  lastTrickWinner = null,
  deckCount = 0,
  myBid = null,
  myTricksWon = 0,
  isMyTurn = false,
  handSize = 0,
  onSubmitBid,
  onPlayCard,
  playableCardIds,
}: GameTableProps = {}) {
  const { width, height, isMobile, isTablet } = useResponsive()
  const [dealFlights, setDealFlights] = useState<DealFlight[]>([])
  const [isDealing, setIsDealing] = useState(false)
  const dealTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const clearDealTimers = useCallback(() => {
    dealTimeoutsRef.current.forEach((timer) => clearTimeout(timer))
    dealTimeoutsRef.current = []
  }, [])

  const tablePlayers = providedPlayers && providedPlayers.length > 0 ? providedPlayers : defaultPlayers
  const deckOrigin = useMemo(() => getDeckOrigin(width ?? 0, height ?? 0), [width, height])
  const playerTargets = useMemo(
    () =>
      tablePlayers.map((_, idx) => ({
        target: getPlayerTargetPoint(idx, tablePlayers.length, width ?? 0, height ?? 0, isMobile),
        direction: getPlayerDirection(idx, tablePlayers.length),
      })),
    [tablePlayers, width, height, isMobile]
  )
  const tableHand = useMemo<TableCard[]>(() => {
    if (hand && hand.length > 0) {
      return hand.map(mapToTableCard)
    }
    return fallbackHand
  }, [hand])
  const [revealedHandCount, setRevealedHandCount] = useState(tableHand.length)
  const [trumpRevealed, setTrumpRevealed] = useState(Boolean(trump))
  const displayedHand = useMemo(() => tableHand.slice(0, revealedHandCount), [tableHand, revealedHandCount])

  const playableSet = useMemo(() => {
    if (!playableCardIds) return null
    return new Set(playableCardIds)
  }, [playableCardIds])

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedCards((prev) => {
      const permitted = new Set(displayedHand.map((card) => card.id))
      const retained = Array.from(prev).filter((id) => permitted.has(id))
      return new Set(retained)
    })
  }, [displayedHand])

  const toggleCardSelection = (cardId: string) => {
    if (playableSet && !playableSet.has(cardId)) {
      return
    }

    setSelectedCards((prev) => {
      if (prev.has(cardId)) {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      }
      return new Set([cardId])
    })
  }

  const selectedCardId = useMemo(() => {
    const iterator = selectedCards.values().next()
    return iterator.done ? null : iterator.value
  }, [selectedCards])

  const cardSize: GameCardSize = isMobile ? 'normal' : isTablet ? 'normal' : 'large'

  const currentPlayer = tablePlayers[0]
  const otherPlayers = currentPlayer ? tablePlayers.slice(1) : []

  const remainingCards = deckCount
  const handRailOffset = isMobile ? 170 : 230
  const handBottomOffset = isMobile ? 24 : 36
  const trumpCardDimensions = useMemo(
    () => ({ width: isMobile ? 90 : 120, height: isMobile ? 126 : 168 }),
    [isMobile]
  )

  const trumpCard = useMemo(() => {
    if (!trump) return null
    return {
      id: `trump-${trump}`,
      suit: SUIT_GLYPH[trump],
      rank: 'A',
    } as TableCard
  }, [trump])

  const trumpTarget = useMemo(() => {
    const horizontalPadding = isMobile ? 20 : 32
    const verticalPadding = isMobile ? 20 : 32
    const viewportWidth = Math.max(width ?? 0, trumpCardDimensions.width + horizontalPadding * 2)
    const viewportHeight = Math.max(height ?? 0, trumpCardDimensions.height + verticalPadding * 2)
    const centerX = viewportWidth - horizontalPadding - trumpCardDimensions.width / 2
    const centerY = viewportHeight - verticalPadding - trumpCardDimensions.height / 2
    const clampedX = Math.max(trumpCardDimensions.width / 2, centerX)
    const clampedY = Math.max(trumpCardDimensions.height / 2, centerY)
    return {
      x: clampedX,
      y: clampedY,
    }
  }, [width, height, isMobile, trumpCardDimensions])

  const [lastDealtRound, setLastDealtRound] = useState<number | null>(null)
  const awaitingDeal = phase === 'bidding' && round > 0 && lastDealtRound !== round
  const showBidPanel = phase === 'bidding'
  const showTrickStatus = phase !== 'bidding'
  const activeBidder = useMemo(() => {
    if (!showBidPanel) return null
    return tablePlayers.find((player) => player.isCurrentTurn) ?? null
  }, [showBidPanel, tablePlayers])
  const activeBidderName = activeBidder?.displayName ?? null
  const activeBidderIsSelf = Boolean(activeBidder?.isSelf)

  useEffect(() => {
    if (awaitingDeal) {
      setRevealedHandCount(0)
      setTrumpRevealed(false)
      return
    }
    if (!isDealing) {
      setRevealedHandCount(tableHand.length)
      setTrumpRevealed(Boolean(trump))
    } else {
      setRevealedHandCount((prev) => Math.min(prev, tableHand.length))
    }
  }, [awaitingDeal, isDealing, tableHand, trump])

  const startDealAnimation = useCallback(() => {
    if (!tablePlayers.length) return
    const cardsPerPlayer = handSize || tableHand.length || 0
    if (cardsPerPlayer === 0 && !trumpCard) {
      setIsDealing(false)
      return
    }

    clearDealTimers()
    setDealFlights([])
    setIsDealing(true)
    setRevealedHandCount(0)
    setTrumpRevealed(false)

    const stepInterval = isMobile ? 110 : 140
    const revealDelay = stepInterval + 160
    const origin = deckOrigin
    let delay = 0

    for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex += 1) {
      tablePlayers.forEach((player, idx) => {
        const mapping = playerTargets[idx]
        if (!mapping) return
        const { target, direction } = mapping
        const card = idx === 0 ? tableHand[cardIndex] : undefined
        const flightId = `deal-${round}-${cardIndex}-${player.id}`
        const appear = setTimeout(() => {
          setDealFlights((prev) => [
            ...prev,
            {
              id: flightId,
              direction,
              origin,
              target,
              reveal: Boolean(card) && idx === 0,
              revealDelay,
              cardRank: card?.rank,
              cardSuit: card?.suit,
            },
          ])
          const expiry = setTimeout(() => {
            setDealFlights((prev) => prev.filter((flight) => flight.id !== flightId))
          }, idx === 0 && card ? 1500 : 950)
          dealTimeoutsRef.current.push(expiry)
        }, delay)
        dealTimeoutsRef.current.push(appear)
        if (idx === 0 && card) {
          const revealTimer = setTimeout(() => {
            setRevealedHandCount((prev) => Math.min(cardIndex + 1, tableHand.length))
          }, delay + revealDelay)
          dealTimeoutsRef.current.push(revealTimer)
        }
        delay += stepInterval
      })
    }

    if (trump && trumpCard) {
      const flightId = `deal-${round}-trump`
      const appear = setTimeout(() => {
        setDealFlights((prev) => [
          ...prev,
          {
            id: flightId,
            direction: 'trump',
            origin,
            target: trumpTarget,
            reveal: true,
            revealDelay: 200,
            cardRank: trumpCard.rank,
            cardSuit: trumpCard.suit,
          },
        ])
        const expiry = setTimeout(() => {
          setDealFlights((prev) => prev.filter((flight) => flight.id !== flightId))
        }, 1500)
        dealTimeoutsRef.current.push(expiry)
        const revealTrumpTimer = setTimeout(() => setTrumpRevealed(true), 400)
        dealTimeoutsRef.current.push(revealTrumpTimer)
      }, delay + 220)
      dealTimeoutsRef.current.push(appear)
      delay += 220
    }

    const finishTimer = setTimeout(() => {
      setDealFlights([])
      setIsDealing(false)
    }, delay + 1400)
    dealTimeoutsRef.current.push(finishTimer)
  }, [tablePlayers, handSize, tableHand, trumpCard, clearDealTimers, isMobile, deckOrigin, playerTargets, round, trump, trumpTarget])

  useEffect(() => {
    return () => {
      clearDealTimers()
    }
  }, [clearDealTimers])

  useEffect(() => {
    const hasCards = (handSize ?? tableHand.length) > 0
    if (!hasCards) return
    if (!tablePlayers.length) return
    if (phase !== 'bidding') return
    if (lastDealtRound === round) return
    setLastDealtRound(round)
    startDealAnimation()
  }, [phase, round, handSize, tableHand.length, tablePlayers.length, startDealAnimation, lastDealtRound])

  const canBid = showBidPanel && pendingAction === 'bid' && isMyTurn
  const isHandInteractive = phase === 'playing' && pendingAction === 'play' && isMyTurn
  const canPlayCard = Boolean(
    selectedCardId &&
      phase === 'playing' &&
      pendingAction === 'play' &&
      isMyTurn &&
      (!playableSet || playableSet.has(selectedCardId))
  )

  const handlePlay = (cardId?: string) => {
    const playId = cardId ?? selectedCardId
    if (!playId) return
    onPlayCard?.(playId)
    setSelectedCards(new Set())
  }

  const handleClearSelection = () => setSelectedCards(new Set())

  const displayPlayerCount = playerCount ?? tablePlayers.length
  const displayMaxPlayers = maxPlayers ?? Math.max(tablePlayers.length, displayPlayerCount, 1)

  return (
    <ResponsiveContainer bg="$background" overflow="hidden">
      <Stack flex={1} position="relative" overflow="hidden">
        <LinearGradient
          colors={['#141332', '#10152E', '#0F172A']}
          start={[0, 0]}
          end={[1, 1]}
          style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        />

        <FloatingCards cards={floatingCards} isMobile={isMobile} />

        {dealFlights.map((flight) => (
          <CardFlight
            key={flight.id}
            direction={flight.direction}
            origin={flight.origin}
            target={flight.target}
            isMobile={isMobile}
            revealCard={flight.reveal}
            revealDelay={flight.revealDelay}
            cardRank={flight.cardRank}
            cardSuit={flight.cardSuit}
          />
        ))}

        <XStack
          position="absolute"
          top={isMobile ? '$3' : '$4'}
          left={isMobile ? '$3' : '$4'}
          right={isMobile ? '$3' : '$4'}
          jc="space-between"
          ai="flex-start"
          gap="$3"
          flexWrap="wrap"
        >
          <YStack
            bg="rgba(15, 23, 42, 0.85)"
            px="$3"
            py="$2"
            br="$4"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.1)"
            gap="$1"
            shadowColor="#000"
            shadowOpacity={0.45}
            shadowRadius={12}
          >
            <Paragraph color="$color" fontSize="$2" opacity={0.8} fontWeight="600">
              Players Online
            </Paragraph>
            <Paragraph color="$color" fontSize="$6" fontWeight="800">
              {displayPlayerCount}/{displayMaxPlayers}
            </Paragraph>
          </YStack>

          {onLeaveGame && (
            <Button
              size={isMobile ? '$3' : '$4'}
              bg="$error"
              color="$background"
              onPress={onLeaveGame}
              pressStyle={{ scale: 0.97 }}
              hoverStyle={{ scale: 1.02 }}
              animation="bouncy"
              alignSelf="flex-start"
            >
              Leave Game
            </Button>
          )}
        </XStack>

        {showTrickStatus && (
          <YStack
            position="absolute"
            top={isMobile ? 120 : 150}
            left={isMobile ? '$3' : '$4'}
            right={isMobile ? '$3' : '$4'}
          >
            <TrickStatus
              players={tablePlayers}
              currentTrick={currentTrick}
              trump={trump}
              phase={phase}
              pendingAction={pendingAction}
              round={round}
              lastTrickWinner={lastTrickWinner}
            />
          </YStack>
        )}

        {otherPlayers.map((player, idx) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isMobile={isMobile}
            placementStyle={getPlayerPosition(idx + 1, tablePlayers.length, width, height, isMobile)}
            dealtCount={player.handCount}
          />
        ))}

        <YStack
          gap="$3"
          ai="center"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <CenterDeck remainingCards={remainingCards} isAnimating={isDealing} />
        </YStack>

        {trumpCard && (
          <TrumpCardSpotlight
            card={trumpCard}
            isMobile={isMobile}
            position={trumpTarget}
            isVisible={trumpRevealed}
          />
        )}

        <YStack
          position="absolute"
          bottom={handRailOffset}
          left={isMobile ? '$3' : '$4'}
          right={isMobile ? '$3' : '$4'}
          gap="$3"
          maxWidth={isTablet ? 720 : undefined}
          alignSelf="center"
        >
          {showBidPanel && (
            <BidPanel
              handSize={handSize}
              phase={phase}
              currentBid={myBid}
              canBid={canBid}
              pendingAction={pendingAction}
              round={round}
              activeBidderName={activeBidderName}
              activeBidderIsSelf={activeBidderIsSelf}
              onBid={(amount) => onSubmitBid?.(amount)}
            />
          )}

          <HandToolbar
            selectedCardId={selectedCardId}
            onPlay={handlePlay}
            onClear={handleClearSelection}
            canPlay={canPlayCard}
            phase={phase}
            pendingAction={pendingAction}
            isMyTurn={isMyTurn}
            handCount={displayedHand.length}
            myBid={myBid}
            tricksWon={myTricksWon ?? 0}
          />
        </YStack>

        <PlayerHand
          cards={displayedHand}
          selectedCards={selectedCards}
          onToggle={toggleCardSelection}
          onPlaySelected={handlePlay}
          canPlaySelected={canPlayCard}
          cardSize={cardSize}
          bottomOffset={handBottomOffset}
          isInteractive={isHandInteractive}
        />

        {currentPlayer && (
          <PlayerBadge
            player={currentPlayer}
            isMobile={isMobile}
            dealtCount={displayedHand.length}
            placementStyle={{
              bottom: handBottomOffset + (isMobile ? 3 : 3),
              left: isMobile ? 10 : 20,
            }}
          />
        )}
      </Stack>
    </ResponsiveContainer>
  )
}
