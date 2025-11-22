import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated } from 'react-native'
import { XStack } from 'tamagui'
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
}

function Component({ cards, selectedCards, onToggle, cardSize, bottomOffset = 10, isInteractive = true }: PlayerHandProps) {
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
      {cards.map((card, index) => (
        <Animated.View key={card.id} style={cardStyles[index]}>
          <GameCard
            card={card}
            selected={selectedCards.has(card.id)}
            onPress={() => onToggle(card.id)}
            size={cardSize}
          />
        </Animated.View>
      ))}
    </XStack>
  )
}

export const PlayerHand = memo(Component)
