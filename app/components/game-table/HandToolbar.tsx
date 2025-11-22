import { memo, useMemo } from 'react'
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui'
import { Sword, Undo2 } from '@tamagui/lucide-icons'
import type { PendingAction, RoundPhase } from '../../types/game'

interface HandToolbarProps {
  selectedCardId: string | null
  onPlay: () => void
  onClear: () => void
  canPlay: boolean
  phase: RoundPhase
  pendingAction: PendingAction
  isMyTurn: boolean
  handCount: number
  myBid: number | null
  tricksWon: number
}

function Component({
  selectedCardId,
  onPlay,
  onClear,
  canPlay,
  phase,
  pendingAction,
  isMyTurn,
  handCount,
  myBid,
  tricksWon,
}: HandToolbarProps) {
  const status = useMemo(() => {
    if (!isMyTurn) {
      return 'Watching opponents…'
    }
    if (phase === 'bidding') {
      return 'Waiting for bids to complete'
    }
    if (pendingAction === 'bid') {
      return 'Place your bid to continue'
    }
    if (pendingAction === 'play') {
      return selectedCardId ? 'Play the highlighted card' : 'Select a card to play'
    }
    return 'Enjoy the show'
  }, [isMyTurn, phase, pendingAction, selectedCardId])

  return (
    <Card bg="rgba(15,23,42,0.9)" p="$3" br="$4" gap="$2" borderColor="rgba(255,255,255,0.08)" borderWidth={1}>
      <XStack jc="space-between" ai="center">
        <YStack gap="$1">
          <Text color="rgba(255,255,255,0.85)" fontWeight="700" fontSize={13}>
            Hand: {handCount} cards
          </Text>
          <Paragraph color="rgba(255,255,255,0.6)" fontSize={12}>
            Contract {myBid ?? '—'} • Tricks {tricksWon}
          </Paragraph>
        </YStack>
        <XStack gap="$2">
          {selectedCardId && (
            <Button
              size="$3"
              bg="rgba(255,255,255,0.05)"
              color="white"
              icon={<Undo2 size={16} />}
              onPress={onClear}
              pressStyle={{ bg: 'rgba(255,255,255,0.15)' }}
            >
              Clear
            </Button>
          )}
          <Button
            size="$3"
            bg={canPlay ? '$accent' : 'rgba(255,255,255,0.08)'}
            color={canPlay ? '$backgroundStrong' : 'rgba(255,255,255,0.4)'}
            icon={<Sword size={16} />}
            disabled={!canPlay}
            opacity={canPlay ? 1 : 0.5}
            onPress={onPlay}
            pressStyle={{ scale: 0.96 }}
          >
            Play Card
          </Button>
        </XStack>
      </XStack>

      <Paragraph color={canPlay ? '#34D399' : 'rgba(255,255,255,0.65)'} fontSize={12}>
        {status}
      </Paragraph>
    </Card>
  )
}

export const HandToolbar = memo(Component)
