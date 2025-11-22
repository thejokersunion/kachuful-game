import { memo } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, YStack } from 'tamagui'
import type { PlayerDirection } from './playerLayout'
import type { Point2D } from './animationTargets'

interface CardFlightProps {
  direction: PlayerDirection
  origin: Point2D
  target: Point2D
  isMobile: boolean
}

const rotationByDirection: Record<PlayerDirection, string> = {
  top: '0deg',
  bottom: '0deg',
  left: '-5deg',
  right: '5deg',
  trump: '-45deg',
}

function Component({ direction, origin, target, isMobile }: CardFlightProps) {
  const cardWidth = isMobile ? 46 : 62
  const cardHeight = isMobile ? 64 : 88
  const deltaX = target.x - origin.x
  const deltaY = target.y - origin.y

  return (
    <YStack
      position="absolute"
      width={cardWidth}
      height={cardHeight}
      top={origin.y - cardHeight / 2}
      left={origin.x - cardWidth / 2}
      pointerEvents="none"
      br="$3"
      overflow="hidden"
      borderWidth={1.5}
      borderColor="rgba(255, 255, 255, 0.2)"
      animation="medium"
      enterStyle={{ opacity: 0, scale: 0.6, x: 0, y: 0, rotate: '-6deg' }}
      exitStyle={{ opacity: 0, scale: 0.5, rotate: '8deg' }}
      x={deltaX}
      y={deltaY}
      rotate={rotationByDirection[direction]}
      shadowColor="#0EA5E9"
      shadowOpacity={0.5}
      shadowRadius={14}
      shadowOffset={{ width: 0, height: 6 }}
    >
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        start={[0, 0]}
        end={[1, 1]}
        style={{ flex: 1 }}
      />
      <YStack
        position="absolute"
        top={isMobile ? '$1' : '$2'}
        bottom={isMobile ? '$1' : '$2'}
        left={isMobile ? '$1' : '$2'}
        right={isMobile ? '$1' : '$2'}
        borderColor="rgba(255, 255, 255, 0.25)"
        borderWidth={1}
        br="$2"
        overflow="hidden"
        opacity={0.4}
      >
        <YStack flex={1} jc="space-between" py="$2">
          <Text alignSelf="center" color="rgba(255, 255, 255, 0.3)" fontSize={isMobile ? 10 : 12}>
            ★
          </Text>
          <Text alignSelf="center" color="rgba(255, 255, 255, 0.4)" fontSize={isMobile ? 8 : 10}>
            FACE DOWN
          </Text>
          <Text alignSelf="center" color="rgba(255, 255, 255, 0.3)" fontSize={isMobile ? 10 : 12}>
            ★
          </Text>
        </YStack>
      </YStack>
    </YStack>
  )
}

export const CardFlight = memo(Component)
