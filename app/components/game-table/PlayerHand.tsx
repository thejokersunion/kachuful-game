import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated } from 'react-native'
import { Button, XStack, YStack } from 'tamagui'
import { Sword } from '@tamagui/lucide-icons'
import type { PlayingCard } from './types'
import type { GameCardSize } from './GameCard'
import { GameCard } from './GameCard'

interface PlayerHandProps {
  cards: PlayingCard[]
  selectedCards: Set<string>
  onToggle: (cardId: string) => void
  cardSize: GameCardSize
  bottomOffset?: number
  isInteractive?: boolean
  onPlaySelected?: (cardId: string) => void
  canPlaySelected?: boolean
}

const overlayOffset: Record<GameCardSize, number> = {
  small: 38,
  normal: 48,
  large: 58,
}

function Component({
  cards,
  selectedCards,
  onToggle,
  cardSize,
  bottomOffset = 10,
  isInteractive = true,
  onPlaySelected,
  canPlaySelected = true,
}: PlayerHandProps) {
  const activation = useRef(new Animated.Value(isInteractive ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(activation, {
      toValue: isInteractive ? 1 : 0,
      useNativeDriver: true,
      tension: 160,
      friction: 18,
    }).start()
  }, [activation, isInteractive])

  const cardStyles = useMemo(() => {
    return cards.map((_, index) => {
      const lift = -4 - index * 0.6
      return {
        opacity: activation.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
        transform: [
          {
            translateY: activation.interpolate({ inputRange: [0, 1], outputRange: [0, lift] }),
          },
        ],
      }
    })
  }, [activation, cards])

  return (
    // @ts-ignore - Tamagui props
    <XStack
      gap={cardSize === 'large' ? -20 : -15}
      ai="flex-end"
      jc="center"
      pointerEvents={isInteractive ? 'auto' : 'none'}
      position="absolute"
      style={{
        bottom: bottomOffset,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      {cards.map((card, index) => {
        const isSelected = selectedCards.has(card.id)
        return (
          <Animated.View key={card.id} style={cardStyles[index]}>
            <YStack position="relative" ai="center">
              <GameCard
                card={card}
                selected={isSelected}
                onPress={() => onToggle(card.id)}
                size={cardSize}
              />
              {isSelected && isInteractive ? (
                <XStack
                  position="absolute"
                  top={-overlayOffset[cardSize]}
                  shadowColor="#000"
                  shadowOpacity={0.35}
                  shadowRadius={10}
                  shadowOffset={{ width: 0, height: 4 }}
                >
                  <Button
                    size="$3"
                    bg={canPlaySelected ? '$accent' : 'rgba(255,255,255,0.08)'}
                    color={canPlaySelected ? '$background' : 'rgba(255,255,255,0.6)'}
                    icon={<Sword size={16} />}
                    disabled={!canPlaySelected}
                    opacity={canPlaySelected ? 1 : 0.6}
                    onPress={() => {
                      if (!canPlaySelected) return
                      onPlaySelected?.(card.id)
                    }}
                    pressStyle={{ scale: 0.94 }}
                  >
                    Play
                  </Button>
                </XStack>
              ) : null}
            </YStack>
          </Animated.View>
        )
      })}
    </XStack>
  )
}

export const PlayerHand = memo(Component)
