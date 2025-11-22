import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'
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
import { CenterPile } from '../components/game-table/CenterPile'
import { CardSlide } from '../components/game-table/CardSlide'
import { getDeckOrigin, type Point2D } from '../components/game-table/animationTargets'
import { getPlayerDirection, getPlayerPosition, getPlayerTargetPoint, type PlayerDirection } from '../components/game-table/playerLayout'
import type { PlayingCard as TableCard, TablePlayer } from '../components/game-table/types'
import type { PlayingCard as EngineCard, PendingAction, RoundPhase, Suit, TrickView } from '../types/game'
import { GAME_CARD_DIMENSIONS } from '../components/game-table/GameCard'
import type { GameCardSize } from '../components/game-table/GameCard'
import { BidPanel } from '../components/game-table/BidPanel'

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

interface PlaySlideFlight {
  id: string
  card: TableCard
  origin: Point2D
  target: Point2D
  size: GameCardSize
  delay?: number
  duration?: number
}

interface BadgePulseState {
  playerId: string
  until: number
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

const ROUND_SUMMARY_DURATION_MS = 10_000
const ROUND_SUMMARY_DURATION_SECONDS = Math.floor(ROUND_SUMMARY_DURATION_MS / 1000)

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
  const [playSlides, setPlaySlides] = useState<PlaySlideFlight[]>([])
  const [isDealing, setIsDealing] = useState(false)
  const [deckHidden, setDeckHidden] = useState(false)
  const [collectSlides, setCollectSlides] = useState<PlaySlideFlight[]>([])
  const [badgePulse, setBadgePulse] = useState<BadgePulseState | null>(null)
  const dealTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const deckHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundSummaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundSummaryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousTrickRef = useRef<TrickView[]>([])
  const lastSelfPlayRef = useRef<{ cardId: string; index: number; total: number } | null>(null)
  const lastTrickCardsRef = useRef<TableCard[]>([])

  const clearDealTimers = useCallback(() => {
    dealTimeoutsRef.current.forEach((timer) => clearTimeout(timer))
    dealTimeoutsRef.current = []
  }, [])

  const clearRoundSummaryTimers = useCallback(() => {
    if (roundSummaryTimeoutRef.current) {
      clearTimeout(roundSummaryTimeoutRef.current)
      roundSummaryTimeoutRef.current = null
    }
    if (roundSummaryIntervalRef.current) {
      clearInterval(roundSummaryIntervalRef.current)
      roundSummaryIntervalRef.current = null
    }
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
    if (Array.isArray(hand)) {
      return hand.map(mapToTableCard)
    }
    return fallbackHand
  }, [hand])
  const [revealedHandCount, setRevealedHandCount] = useState(tableHand.length)
  const [trumpRevealed, setTrumpRevealed] = useState(Boolean(trump))
  const displayedHand = useMemo(() => tableHand.slice(0, revealedHandCount), [tableHand, revealedHandCount])
  const trickCards = useMemo<TableCard[]>(() => currentTrick.map(({ card }) => mapToTableCard(card)), [currentTrick])

  useEffect(() => {
    if (currentTrick.length > 0) {
      lastTrickCardsRef.current = currentTrick.map(({ card }) => mapToTableCard(card))
    }
  }, [currentTrick])

  const playableSet = useMemo(() => {
    if (!playableCardIds) return null
    return new Set(playableCardIds)
  }, [playableCardIds])

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [isRoundSummaryVisible, setRoundSummaryVisible] = useState(false)
  const [roundSummaryCountdown, setRoundSummaryCountdown] = useState(0)

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
  const deckVisualSize = useMemo(() => (isMobile ? { width: 72, height: 108 } : { width: 90, height: 132 }), [isMobile])
  const deckCenterPosition = useMemo(() => {
    const safeWidth = width ?? 0
    const safeHeight = height ?? 0
    return {
      x: Math.max((safeWidth - deckVisualSize.width) / 2, 0),
      y: Math.max((safeHeight - deckVisualSize.height) / 2, 0),
    }
  }, [width, height, deckVisualSize])
  const deckDockPosition = useMemo(() => {
    const padding = isMobile ? 16 : 28
    const verticalOffset = isMobile ? 110 : 150
    return {
      x: padding,
      y: verticalOffset,
    }
  }, [isMobile])
  const [lastDealtRound, setLastDealtRound] = useState<number | null>(null)
  const awaitingDeal = phase === 'bidding' && round > 0 && lastDealtRound !== round
  const deckIsDocked = !awaitingDeal && !isDealing
  const deckPositionAnim = useRef(new Animated.Value(0)).current
  const deckTranslateX = deckPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [deckCenterPosition.x, deckDockPosition.x],
  })
  const deckTranslateY = deckPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [deckCenterPosition.y, deckDockPosition.y],
  })
  const deckScale = deckPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  })
  const deckOpacity = deckPositionAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.4, 0],
  })
  useEffect(() => {
    Animated.spring(deckPositionAnim, {
      toValue: deckIsDocked ? 1 : 0,
      tension: 140,
      friction: 18,
      useNativeDriver: false,
    }).start()
  }, [deckIsDocked, deckPositionAnim, deckCenterPosition, deckDockPosition])

  useEffect(() => {
    if (!deckIsDocked) {
      if (deckHideTimeoutRef.current) {
        clearTimeout(deckHideTimeoutRef.current)
        deckHideTimeoutRef.current = null
      }
      setDeckHidden(false)
      return
    }

    deckHideTimeoutRef.current = setTimeout(() => {
      setDeckHidden(true)
    }, 450)

    return () => {
      if (deckHideTimeoutRef.current) {
        clearTimeout(deckHideTimeoutRef.current)
        deckHideTimeoutRef.current = null
      }
    }
  }, [deckIsDocked])
  const handRailOffset = isMobile ? 170 : 230
  const handBottomOffset = isMobile ? 24 : 36
  const getSelfCardOrigin = useCallback(
    (cardIndex: number, totalCards: number): Point2D => {
      const dimensions = GAME_CARD_DIMENSIONS[cardSize]
      const overlap = cardSize === 'large' ? 20 : 15
      const spacing = dimensions.width - overlap
      const centerX = (width ?? 0) / 2
      const offsetFromCenter = (cardIndex - (totalCards - 1) / 2) * spacing
      const x = centerX + offsetFromCenter
      const y = Math.max((height ?? 0) - handBottomOffset - dimensions.height / 2, 0)
      return { x, y }
    },
    [cardSize, handBottomOffset, height, width]
  )
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

  const expectedHandCount = handSize || tableHand.length
  const dealPresentationComplete = !awaitingDeal && !isDealing && revealedHandCount >= expectedHandCount
  const showBidPanel = phase === 'bidding' && dealPresentationComplete
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
    }, delay + 900)
    dealTimeoutsRef.current.push(finishTimer)
  }, [tablePlayers, handSize, tableHand, trumpCard, clearDealTimers, isMobile, deckOrigin, playerTargets, round, trump, trumpTarget])

  useEffect(() => {
    return () => {
      clearDealTimers()
      if (deckHideTimeoutRef.current) {
        clearTimeout(deckHideTimeoutRef.current)
        deckHideTimeoutRef.current = null
      }
      clearRoundSummaryTimers()
    }
  }, [clearDealTimers, clearRoundSummaryTimers])

  useEffect(() => {
    const hasCards = (handSize ?? tableHand.length) > 0
    if (!hasCards) return
    if (!tablePlayers.length) return
    if (phase !== 'bidding') return
    if (lastDealtRound === round) return
    setLastDealtRound(round)
    startDealAnimation()
  }, [phase, round, handSize, tableHand.length, tablePlayers.length, startDealAnimation, lastDealtRound])

  useEffect(() => {
    if (phase === 'round_end') {
      clearRoundSummaryTimers()
      setRoundSummaryVisible(true)
      setRoundSummaryCountdown(ROUND_SUMMARY_DURATION_SECONDS)

      roundSummaryTimeoutRef.current = setTimeout(() => {
        setRoundSummaryVisible(false)
      }, ROUND_SUMMARY_DURATION_MS)

      roundSummaryIntervalRef.current = setInterval(() => {
        setRoundSummaryCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return
    }

    setRoundSummaryVisible(false)
    setRoundSummaryCountdown(0)
    clearRoundSummaryTimers()
  }, [phase, clearRoundSummaryTimers])

    useEffect(() => {
      const previousTrick = previousTrickRef.current
      const previousIds = new Set(previousTrick.map((entry) => entry.card.id))
      const newEntries = currentTrick.filter((entry) => !previousIds.has(entry.card.id))

      if (newEntries.length) {
        const newSlides: PlaySlideFlight[] = []

        newEntries.forEach((entry, idx) => {
          const playerIndex = tablePlayers.findIndex((player) => player.id === entry.playerId)
          const mapping = playerIndex >= 0 ? playerTargets[playerIndex] : null
          let originPoint = mapping?.target ?? deckOrigin
          const tableCard = mapToTableCard(entry.card)

          if (entry.playerId === currentPlayer?.id) {
            const pending = lastSelfPlayRef.current
            if (pending && pending.cardId === entry.card.id) {
              originPoint = getSelfCardOrigin(pending.index, pending.total)
              lastSelfPlayRef.current = null
            }
          }

          newSlides.push({
            id: `play-${entry.card.id}-${Date.now()}-${idx}`,
            card: tableCard,
            origin: originPoint,
            target: deckOrigin,
            size: cardSize,
            delay: idx * 40,
          })
        })

        if (newSlides.length) {
          setPlaySlides((prev) => [...prev, ...newSlides])
        }
      }

      previousTrickRef.current = currentTrick
    }, [cardSize, currentPlayer?.id, currentTrick, deckOrigin, getSelfCardOrigin, playerTargets, tablePlayers])

    useEffect(() => {
      if (!lastTrickWinner) return
      if (currentTrick.length > 0) return
      const winnerIndex = tablePlayers.findIndex((player) => player.id === lastTrickWinner)
      if (winnerIndex < 0) return
      const cardsToCollect = lastTrickCardsRef.current
      if (!cardsToCollect.length) return

      const targetPoint = playerTargets[winnerIndex]?.target ?? deckOrigin
      const centerPoint = deckOrigin
      const gatherOffsets = cardsToCollect.map((_, idx) => {
        const phase = (idx / cardsToCollect.length) * Math.PI
        const radius = 18
        return {
          x: Math.cos(phase) * radius * 0.4,
          y: Math.sin(phase) * radius * 0.25,
        }
      })
      const slides = cardsToCollect.map((card, idx) => ({
        id: `collect-${card.id}-${Date.now()}-${idx}`,
        card,
        origin: {
          x: centerPoint.x + gatherOffsets[idx].x,
          y: centerPoint.y + gatherOffsets[idx].y,
        },
        target: targetPoint,
        size: cardSize,
        delay: 180 + idx * 60,
        duration: 460,
      }))

      setCollectSlides((prev) => [...prev, ...slides])
      setBadgePulse({ playerId: lastTrickWinner, until: Date.now() + 1600 })
      lastTrickCardsRef.current = []
    }, [cardSize, currentTrick.length, deckOrigin, lastTrickWinner, playerTargets, tablePlayers])

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
    const cardIndex = displayedHand.findIndex((card) => card.id === playId)
    if (cardIndex >= 0) {
      lastSelfPlayRef.current = { cardId: playId, index: cardIndex, total: displayedHand.length }
    } else {
      lastSelfPlayRef.current = null
    }
    onPlayCard?.(playId)
    setSelectedCards(new Set())
  }

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

        {!deckHidden && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: deckVisualSize.width,
              height: deckVisualSize.height,
              transform: [{ translateX: deckTranslateX }, { translateY: deckTranslateY }, { scale: deckScale }],
              opacity: deckOpacity,
              zIndex: 5,
            }}
          >
            <CenterDeck remainingCards={remainingCards} isAnimating={isDealing} />
          </Animated.View>
        )}

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

        {playSlides.map((slide) => (
          <CardSlide
            key={slide.id}
            card={slide.card}
            origin={slide.origin}
            target={slide.target}
            size={slide.size}
            delay={slide.delay}
            duration={slide.duration}
            onComplete={() => {
              setPlaySlides((prev) => prev.filter((item) => item.id !== slide.id))
            }}
          />
        ))}

        {collectSlides.map((slide) => (
          <CardSlide
            key={slide.id}
            card={slide.card}
            origin={slide.origin}
            target={slide.target}
            size={slide.size}
            delay={slide.delay}
            duration={slide.duration ?? 420}
            onComplete={() => {
              setCollectSlides((prev) => prev.filter((item) => item.id !== slide.id))
            }}
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
            px="$4"
            py="$3"
            br="$4"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.1)"
            gap="$1"
            shadowColor="#000"
            shadowOpacity={0.45}
            shadowRadius={12}
          >
            <Paragraph color="$color" fontSize="$7" fontWeight="600">
              Round {round}
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


        {otherPlayers.map((player, idx) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isMobile={isMobile}
            placementStyle={getPlayerPosition(idx + 1, tablePlayers.length, width, height, isMobile)}
            dealtCount={player.handCount}
            pulse={badgePulse?.playerId === player.id && badgePulse.until > Date.now()}
          />
        ))}

        <YStack
          ai="center"
          position="absolute"
          top="50%"
          left="50%"
          style={{ transform: 'translate(-50%, -50%)' }}
          width={isMobile ? 220 : 320}
          height={isMobile ? 220 : 320}
          pointerEvents="none"
        >
          {trickCards.length > 0 && (
            <CenterPile
              cards={trickCards}
              cardSize={isMobile ? 'normal' : 'large'}
              maxWidth={isMobile ? 180 : 280}
            />
          )}
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

        </YStack>

        {isRoundSummaryVisible && (
          <Stack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(3, 6, 23, 0.78)"
            zIndex={20}
            jc="center"
            ai="center"
            px={isMobile ? '$3' : '$6'}
          >
            <YStack
              w="100%"
              maxWidth={isMobile ? 320 : 520}
              bg="rgba(15, 23, 42, 0.92)"
              br="$6"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.12)"
              p={isMobile ? '$4' : '$6'}
              gap="$3"
              shadowColor="#000"
              shadowOpacity={0.55}
              shadowRadius={24}
            >
              <YStack gap="$1">
                <Paragraph color="$secondary" fontSize={isMobile ? '$5' : '$6'} fontWeight="600">
                  Round {round} complete
                </Paragraph>
                <Paragraph color="$color" opacity={0.9}>
                  Next round begins in {roundSummaryCountdown}s
                </Paragraph>
              </YStack>

              <YStack gap="$2" maxHeight={isMobile ? 240 : 300} w="100%" overflow="hidden">
                {tablePlayers.map((player) => (
                  <XStack
                    key={player.id}
                    bg="rgba(255,255,255,0.04)"
                    br="$4"
                    borderWidth={1}
                    borderColor={player.isSelf ? 'rgba(243, 197, 74, 0.5)' : 'rgba(255,255,255,0.06)'}
                    px="$3"
                    py="$2"
                    ai="center"
                    gap="$3"
                  >
                    <Paragraph fontSize="$6" color="$accent">
                      {player.avatar ?? '🎴'}
                    </Paragraph>
                    <YStack flex={1} gap={2}>
                      <Paragraph color="$color" fontWeight="600">
                        {player.displayName}
                        {player.isSelf ? ' · You' : ''}
                      </Paragraph>
                      <Paragraph color="$color" opacity={0.85} fontSize="$2">
                        Bid {player.bid ?? '—'} · Tricks {player.tricksWon}
                      </Paragraph>
                    </YStack>
                    <YStack ai="flex-end">
                      <Paragraph color="$primary" fontWeight="700">
                        {player.score}
                      </Paragraph>
                      <Paragraph color="$color" opacity={0.7} fontSize="$2">
                        Score
                      </Paragraph>
                    </YStack>
                  </XStack>
                ))}
              </YStack>

              <Paragraph color="$color" opacity={0.8} fontSize="$2">
                Cards stay put while we tally scores. 🎯
              </Paragraph>
            </YStack>
          </Stack>
        )}

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
            pulse={badgePulse?.playerId === currentPlayer.id && badgePulse.until > Date.now()}
          />
        )}
      </Stack>
    </ResponsiveContainer>
  )
}
