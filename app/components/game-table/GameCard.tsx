import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import { Text, YStack } from 'tamagui'
import type { PlayingCard } from './types'
import { getSuitColor } from './helpers'

export type GameCardSize = 'small' | 'normal' | 'large'

interface GameCardProps {
  card: PlayingCard
  selected?: boolean
  size?: GameCardSize
  onPress?: () => void
}

export const GAME_CARD_DIMENSIONS: Record<GameCardSize, { width: number; height: number; fontSize: number }> = {
  small: { width: 40, height: 56, fontSize: 16 },
  normal: { width: 60, height: 84, fontSize: 24 },
  large: { width: 80, height: 112, fontSize: 32 },
}

function Component({ card, selected, onPress, size = 'normal' }: GameCardProps) {
  const dimensions = GAME_CARD_DIMENSIONS[size]
  const suitColor = getSuitColor(card.suit)
  const flipAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    flipAnim.setValue(0)
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [card.id, flipAnim])

  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg'],
  })

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  return (
    <YStack
      width={dimensions.width}
      height={dimensions.height}
      y={selected ? -10 : 0}
      bg="white"
      borderColor={selected ? '#F59E0B' : '#ccc'}
      borderWidth={selected ? 2 : 1}
      br="$2"
      jc="center"
      ai="center"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={4}
      animation="bouncy"
      pressStyle={{ scale: 1.05, y: selected ? -15 : -5 }}
      onPress={onPress}
      cursor={onPress ? 'pointer' : 'default'}
      overflow="hidden"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.face,
          {
            backfaceVisibility: 'hidden',
            transform: [{ rotateY: frontRotation }],
          },
        ]}
      >
        <Text
          fontSize={dimensions.fontSize}
          fontWeight="bold"
          style={{ color: suitColor }}
          lineHeight={dimensions.fontSize}
        >
          {card.rank}
        </Text>
        <Text
          fontSize={dimensions.fontSize * 0.8}
          style={{ color: suitColor }}
          lineHeight={dimensions.fontSize * 0.8}
        >
          {card.suit}
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.back,
          {
            backfaceVisibility: 'hidden',
            transform: [{ rotateY: backRotation }],
          },
        ]}
      >
        <Text color="white" opacity={0.7} fontSize={dimensions.fontSize * 0.6}
          letterSpacing={2}
        >
          ★ CARD ★
        </Text>
      </Animated.View>
    </YStack>
  )
}

const styles = StyleSheet.create({
  face: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  back: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
  },
})

export const GameCard = memo(Component)
