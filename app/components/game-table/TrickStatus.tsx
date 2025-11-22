import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated } from 'react-native'
import { Card, Paragraph, Separator, Text, XStack, YStack } from 'tamagui'
import { Crown, Shuffle, TimerReset } from '@tamagui/lucide-icons'
import type { PendingAction, RoundPhase, Suit, TrickView } from '../../types/game'
import type { TablePlayer } from './types'

interface TrickStatusProps {
  players?: TablePlayer[]
  currentTrick?: TrickView[]
  trump: Suit | null
  phase: RoundPhase
  pendingAction: PendingAction
  round: number
  lastTrickWinner: string | null
}

const phaseDescriptions: Record<RoundPhase, string> = {
  idle: 'Preparing the deck',
  bidding: 'Players are bidding contracts',
  playing: 'Cards in flight — follow suit!',
  scoring: 'Calculating points',
  round_end: 'Round wrap-up',
  completed: 'Match finished',
}

const SUIT_EMOJI: Record<Suit, string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
}

function Component({
  players = [],
  currentTrick = [],
  trump,
  phase,
  pendingAction,
  round,
  lastTrickWinner,
}: TrickStatusProps) {
  const playerMap = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]))
  }, [players])

  const phaseLabel = phaseDescriptions[phase]
  const trumpGlyph = trump ? SUIT_EMOJI[trump] : '—'
  const trumpColor = trumpGlyph === '♦' || trumpGlyph === '♥' ? '#F87171' : '#60A5FA'
  const trickPulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!lastTrickWinner) {
      return
    }
    trickPulse.setValue(0)
    Animated.sequence([
      Animated.spring(trickPulse, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 140,
      }),
      Animated.timing(trickPulse, {
        toValue: 0,
        duration: 400,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start()
  }, [lastTrickWinner, trickPulse])

  return (
    <Card elevate bordered bg="rgba(15,23,42,0.85)" p="$3" gap="$3" width="100%">
      <XStack ai="center" jc="space-between">
        <XStack ai="center" gap="$2">
          <TimerReset size={18} color="#FCD34D" />
          <Text color="white" fontWeight="800" fontSize={14}>
            Round {round || 1}
          </Text>
        </XStack>
        <XStack ai="center" gap="$1.5">
          <Text color="rgba(255,255,255,0.7)" fontSize={12}>
            Trump
          </Text>
          <Text color={trumpColor} fontSize={18} fontWeight="900">
            {trumpGlyph}
          </Text>
        </XStack>
      </XStack>

      <Paragraph color="rgba(255,255,255,0.8)" fontSize="$3">
        {phaseLabel}{pendingAction === 'play' ? ' • Waiting for next card' : ''}
      </Paragraph>

      <Separator borderColor="rgba(255,255,255,0.1)" />

      {currentTrick.length === 0 ? (
        <YStack ai="center" gap="$1" py="$2">
          <Shuffle size={24} color="rgba(255,255,255,0.4)" />
          <Paragraph color="rgba(255,255,255,0.6)">
            No cards played yet
          </Paragraph>
        </YStack>
      ) : (
        <YStack gap="$2">
          {currentTrick.map((play) => {
            const player = playerMap.get(play.playerId)
            const label = player?.displayName ?? 'Player'
            const rankLabel = play.card.label?.replace(play.card.symbol, '') ?? `${play.card.rank}`
            return (
              <XStack key={`${play.playerId}-${play.card.id}`} jc="space-between" ai="center">
                <YStack gap="$0.5">
                  <Text color="rgba(255,255,255,0.85)" fontWeight="600" fontSize={12}>
                    {label}
                  </Text>
                  <Text color="rgba(255,255,255,0.55)" fontSize={11}>
                    {play.card.symbol}
                  </Text>
                </YStack>
                <Text color="white" fontSize={20} fontWeight="800">
                  {rankLabel}
                </Text>
              </XStack>
            )
          })}
        </YStack>
      )}

      {lastTrickWinner && (
        <Animated.View
          style={{
            transform: [
              {
                scale: trickPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }),
              },
            ],
            opacity: trickPulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
          }}
        >
          <YStack bg="rgba(16,185,129,0.12)" p="$2" br="$3" gap="$1" ai="flex-start" borderWidth={1} borderColor="rgba(16,185,129,0.4)">
            <XStack gap="$1.5" ai="center">
              <Crown size={16} color="#34D399" />
              <Text color="#34D399" fontWeight="700" fontSize={12}>
                Last trick: {playerMap.get(lastTrickWinner)?.displayName ?? '—'}
              </Text>
            </XStack>
            <Paragraph color="rgba(255,255,255,0.6)" fontSize={11}>
              They lead the next turn
            </Paragraph>
          </YStack>
        </Animated.View>
      )}
    </Card>
  )
}

export const TrickStatus = memo(Component)
