import { memo, useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import type { PlayingCard } from './types'
import type { GameCardSize } from './GameCard'
import { GameCard, GAME_CARD_DIMENSIONS } from './GameCard'
import type { Point2D } from './animationTargets'

interface CardSlideProps {
  card: PlayingCard
  origin: Point2D
  target: Point2D
  size: GameCardSize
  duration?: number
  delay?: number
  onComplete?: () => void
}

function Component({ card, origin, target, size, duration = 520, delay = 0, onComplete }: CardSlideProps) {
  const progress = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const dimensions = GAME_CARD_DIMENSIONS[size]

  useEffect(() => {
    progress.setValue(0)
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    })
    animationRef.current = animation
    animation.start(({ finished }) => {
      if (finished) {
        onComplete?.()
      }
    })

    return () => {
      animationRef.current?.stop()
    }
  }, [card.id, delay, duration, onComplete, origin.x, origin.y, progress, target.x, target.y])

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.x - dimensions.width / 2, target.x - dimensions.width / 2],
  })

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.y - dimensions.height / 2, target.y - dimensions.height / 2],
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        transform: [{ translateX }, { translateY }],
        zIndex: 15,
      }}
    >
      <GameCard card={card} size={size} />
    </Animated.View>
  )
}

export const CardSlide = memo(Component)
