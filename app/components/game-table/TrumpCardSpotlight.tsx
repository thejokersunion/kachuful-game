import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import { Text, YStack } from 'tamagui'
import type { PlayingCard } from './types'
import { getSuitColor } from './helpers'
import type { Point2D } from './animationTargets'

interface TrumpCardSpotlightProps {
  card: PlayingCard
  isMobile: boolean
  position: Point2D
  isVisible: boolean
}

function Component({ card, isMobile, position, isVisible }: TrumpCardSpotlightProps) {
  if (!isVisible) return null

  const cardWidth = isMobile ? 90 : 120
  const cardHeight = isMobile ? 126 : 168
  const flipAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!isVisible) return
    flipAnim.setValue(0)
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [flipAnim, isVisible, card.id])

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
      width={cardWidth}
      height={cardHeight}
      bg="white"
      br="$2"
      jc="center"
      ai="center"
      borderWidth={3}
      borderColor="#F59E0B"
      shadowColor="#F59E0B"
      shadowOffset={{ width: -4, height: -4 }}
      shadowOpacity={0.6}
      shadowRadius={12}
      animation="bouncy"
      position="absolute"
      top={position.y - cardHeight / 2}
      left={position.x - cardWidth / 2}
      style={{
        transform: 'rotate(-45deg)',
        zIndex: 100,
        perspective: 1200,
      }}
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
        <YStack
          bg="#F59E0B"
          paddingHorizontal="$2"
          paddingVertical="$1"
          position="absolute"
          top={0}
          right={0}
          br="$2"
        >
          <Text style={{ color: 'white' }} fontWeight="bold" fontSize={isMobile ? 10 : 11}>
            HUKAM
          </Text>
        </YStack>

        <Text
          fontSize={isMobile ? 36 : 48}
          fontWeight="bold"
          style={{ color: getSuitColor(card.suit) }}
          lineHeight={isMobile ? 36 : 48}
        >
          {card.rank}
        </Text>
        <Text
          fontSize={isMobile ? 30 : 40}
          style={{ color: getSuitColor(card.suit) }}
          lineHeight={isMobile ? 30 : 40}
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
        <Text color="white" opacity={0.8} fontSize={isMobile ? 18 : 22} letterSpacing={3}>
          CARD MASTERS
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
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
})

export const TrumpCardSpotlight = memo(Component)
