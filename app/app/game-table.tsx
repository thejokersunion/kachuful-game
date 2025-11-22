import { useEffect, useMemo, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, Paragraph, Stack, YStack } from 'tamagui'
import { useResponsive } from '../hooks/useResponsive'
import { ResponsiveContainer } from '../components/ResponsiveContainer'
import { FloatingCards, type FloatingCardDecoration } from '../components/game-table/FloatingCards'
import { PlayerBadge } from '../components/game-table/PlayerBadge'
import { PlayerHand } from '../components/game-table/PlayerHand'
import { TrumpCardSpotlight } from '../components/game-table/TrumpCardSpotlight'
import { CenterDeck } from '../components/game-table/CenterDeck'
import { getPlayerPosition } from '../components/game-table/playerLayout'
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

  const tablePlayers = providedPlayers && providedPlayers.length > 0 ? providedPlayers : defaultPlayers
  const tableHand = useMemo<TableCard[]>(() => {
    if (hand && hand.length > 0) {
      return hand.map(mapToTableCard)
    }
    return fallbackHand
  }, [hand])

  const playableSet = useMemo(() => {
    if (!playableCardIds) return null
    return new Set(playableCardIds)
  }, [playableCardIds])

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedCards((prev) => {
      const permitted = new Set(tableHand.map((card) => card.id))
      const retained = Array.from(prev).filter((id) => permitted.has(id))
      return new Set(retained)
    })
  }, [tableHand])

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

  const trumpCard = useMemo(() => {
    if (!trump) return null
    return {
      id: `trump-${trump}`,
      suit: SUIT_GLYPH[trump],
      rank: 'A',
    } as TableCard
  }, [trump])

  const trumpTarget = useMemo(() => {
    const padding = isMobile ? 80 : 120
    return { x: width - padding, y: padding }
  }, [width, isMobile])

  const canBid = phase === 'bidding' && pendingAction === 'bid' && isMyTurn
  const isHandInteractive = phase === 'playing' && pendingAction === 'play' && isMyTurn
  const canPlayCard = Boolean(
    selectedCardId &&
      phase === 'playing' &&
      pendingAction === 'play' &&
      isMyTurn &&
      (!playableSet || playableSet.has(selectedCardId))
  )

  const handlePlay = () => {
    if (!selectedCardId) return
    onPlayCard?.(selectedCardId)
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

        <YStack
          position="absolute"
          top={isMobile ? '$3' : '$4'}
          left={isMobile ? '$3' : '$4'}
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
          <YStack
            position="absolute"
            top={isMobile ? '$3' : '$4'}
            right={isMobile ? '$3' : '$4'}
            gap="$2"
            ai="flex-end"
          >
            <Button
              size={isMobile ? '$3' : '$4'}
              bg="$error"
              color="$background"
              onPress={onLeaveGame}
              pressStyle={{ scale: 0.97 }}
              hoverStyle={{ scale: 1.02 }}
              animation="bouncy"
            >
              Leave Game
            </Button>
          </YStack>
        )}

        <YStack
          position="absolute"
          top={isMobile ? 120 : 140}
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
          <CenterDeck remainingCards={remainingCards} isAnimating={false} />
        </YStack>

        {trumpCard && (
          <TrumpCardSpotlight
            card={trumpCard}
            isMobile={isMobile}
            position={trumpTarget}
            isVisible={Boolean(trump)}
          />
        )}

        <YStack
          position="absolute"
          bottom={isMobile ? '$4' : '$5'}
          left={isMobile ? '$3' : '$4'}
          right={isMobile ? '$3' : '$4'}
          gap="$3"
        >
          {currentPlayer && (
            <PlayerBadge
              player={currentPlayer}
              isMobile={isMobile}
              variant="inline"
              dealtCount={currentPlayer.handCount}
            />
          )}

          <BidPanel
            handSize={handSize}
            phase={phase}
            currentBid={myBid}
            canBid={canBid}
            pendingAction={pendingAction}
            round={round}
            onBid={(amount) => onSubmitBid?.(amount)}
          />

          <HandToolbar
            selectedCardId={selectedCardId}
            onPlay={handlePlay}
            onClear={handleClearSelection}
            canPlay={canPlayCard}
            phase={phase}
            pendingAction={pendingAction}
            isMyTurn={isMyTurn}
            handCount={tableHand.length}
            myBid={myBid}
            tricksWon={myTricksWon ?? 0}
          />
        </YStack>

        <PlayerHand
          cards={tableHand}
          selectedCards={selectedCards}
          onToggle={toggleCardSelection}
          cardSize={cardSize}
          bottomOffset={isMobile ? 210 : 230}
          isInteractive={isHandInteractive}
        />
      </Stack>
    </ResponsiveContainer>
  )
}
