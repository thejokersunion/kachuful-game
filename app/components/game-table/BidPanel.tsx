import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated } from 'react-native'
import { Button, Card, Paragraph, Text, XStack, YStack } from 'tamagui'
import { Sparkles, Target } from '@tamagui/lucide-icons'
import type { PendingAction, RoundPhase } from '../../types/game'

interface BidPanelProps {
  handSize: number
  phase: RoundPhase
  currentBid: number | null
  canBid: boolean
  pendingAction: PendingAction
  round: number
  onBid: (amount: number) => void
}

const phaseCopy: Record<RoundPhase, string> = {
  idle: 'Waiting for the next round…',
  bidding: 'Place your contract for this round',
  playing: 'Bidding locked — focus on the trick',
  scoring: 'Scoring in progress',
  round_end: 'Round results incoming',
  completed: 'Match completed',
}

function Component({ handSize, phase, currentBid, canBid, pendingAction, round, onBid }: BidPanelProps) {
  const bidValues = useMemo(() => {
    if (!handSize || handSize < 0) {
      return [0]
    }
    return Array.from({ length: handSize + 1 }, (_, idx) => idx)
  }, [handSize])

  const showBidButtons = phase === 'bidding'
  const statusLabel = canBid && pendingAction === 'bid' ? 'Your turn to bid' : phaseCopy[phase]
  const bidPulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (currentBid === null) {
      return
    }
    bidPulse.setValue(0)
    Animated.spring(bidPulse, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 140,
    }).start()
  }, [currentBid, bidPulse])

  return (
    <Card elevate bordered bg="rgba(15,23,42,0.88)" p="$3" gap="$2" ai="flex-start" width="100%">
      <XStack gap="$2" ai="center">
        <Sparkles size={18} color="#FDE68A" />
        <Text color="white" fontSize={14} fontWeight="700" letterSpacing={0.3}>
          Round {round || 1} • {handSize || 0}-card hand
        </Text>
      </XStack>

      <Paragraph color="rgba(255,255,255,0.8)" fontSize="$3">
        {statusLabel}
      </Paragraph>

      {showBidButtons ? (
        <XStack flexWrap="wrap" gap="$2">
          {bidValues.map((value) => {
            const isLocked = currentBid !== null && currentBid === value
            const disabled = !canBid || isLocked
            return (
              <Button
                key={value}
                size="$3"
                bg={isLocked ? '$secondary' : 'rgba(30,64,175,0.8)'}
                color="white"
                borderColor={isLocked ? 'transparent' : 'rgba(255,255,255,0.15)'}
                borderWidth={1}
                disabled={disabled}
                opacity={disabled ? 0.4 : 1}
                pressStyle={{ scale: 0.95 }}
                hoverStyle={{ scale: 1.02 }}
                animation="bouncy"
                onPress={() => onBid(value)}
              >
                {isLocked ? 'Bid ' : ''}
                {value}
              </Button>
            )
          })}
        </XStack>
      ) : null}

      {currentBid !== null ? (
        <Animated.View
          style={{
            width: '100%',
            transform: [
              {
                scale: bidPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
              },
            ],
            opacity: bidPulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
          }}
        >
          <XStack
            mt="$2"
            gap="$2"
            ai="center"
            bg="rgba(52,211,153,0.15)"
            px="$3"
            py="$2"
            br="$4"
            borderWidth={1}
            borderColor="rgba(52,211,153,0.4)"
          >
            <Target size={18} color="#34D399" />
            <YStack>
              <Paragraph color="#34D399" fontWeight="700">
                Bid locked at {currentBid}
              </Paragraph>
              <Paragraph color="rgba(255,255,255,0.6)" fontSize={11}>
                Sit tight while opponents decide
              </Paragraph>
            </YStack>
          </XStack>
        </Animated.View>
      ) : null}
    </Card>
  )
}

export const BidPanel = memo(Component)
