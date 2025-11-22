import { memo } from 'react'
import { Circle, Text, XStack, YStack } from 'tamagui'
import type { TablePlayer } from './types'
import { formatCoins } from './helpers'

interface PlayerBadgeProps {
  player: TablePlayer
  isMobile: boolean
  placementStyle?: Record<string, any>
  variant?: 'overlay' | 'inline'
  dealtCount?: number
}

function Component({ player, isMobile, placementStyle, variant = 'overlay', dealtCount = 0 }: PlayerBadgeProps) {
  const avatarSize = isMobile ? 36 : 48

  return (
    // @ts-ignore - Tamagui props
    <XStack
      bg="rgba(15, 20, 35, 0.92)"
      br="$4"
      py="$2"
      px="$2"
      gap="$2"
      ai="center"
      borderWidth={player.isCurrentTurn ? 2 : 1.5}
      borderColor={player.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}
      shadowColor={player.isCurrentTurn ? '#10B981' : '#000'}
      shadowRadius={player.isCurrentTurn ? 12 : 6}
      shadowOpacity={player.isCurrentTurn ? 0.9 : 0.5}
      shadowOffset={{ width: 0, height: 3 }}
      animation="bouncy"
      style={
        variant === 'overlay'
          ? {
              backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 50, 0.85) 100%)',
              position: 'absolute',
              backgroundColor: 'rgba(15, 20, 35, 0.92)',
              backdropFilter: 'blur(10px)',
              ...placementStyle,
            }
          : {
              backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 50, 0.85) 100%)',
            }
      }
    >
      {/* Avatar glow */}
      <YStack position="relative">
        {player.isCurrentTurn && (
          <Circle
            size={avatarSize + 6}
            position="absolute"
            top={-3}
            left={-3}
            bg="#10B981"
            opacity={0.3}
            animation="bouncy"
          />
        )}
        <Circle
          size={avatarSize}
          overflow="hidden"
          bg="#F1F5F9"
          borderWidth={1.5}
          borderColor={player.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.2)'}
          shadowColor="#000"
          shadowRadius={3}
          shadowOpacity={0.3}
          style={{ backgroundImage: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', backgroundColor: '#F1F5F9' }}
        >
          <Text fontSize={isMobile ? 18 : 24}>{player.avatar ?? '🎴'}</Text>
        </Circle>
      </YStack>

      <YStack gap="$1" flex={1}>
        <Text
          style={{
            color: 'white',
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
          fontSize={isMobile ? 11 : 13}
          fontWeight="700"
          letterSpacing={0.3}
        >
          {player.displayName}
        </Text>
        {/* @ts-ignore - Tamagui props */}
        <XStack
          gap="$1"
          ai="center"
          bg="rgba(245, 158, 11, 0.15)"
          py="$0.5"
          px="$1.5"
          br="$2"
        >
          <Circle
            size={isMobile ? 10 : 12}
            bg="#F59E0B"
            shadowColor="#F59E0B"
            shadowRadius={3}
            shadowOpacity={0.6}
            style={{ backgroundImage: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', backgroundColor: '#F59E0B' }}
          />
          <Text
            style={{
              color: '#FBBF24',
              textShadowColor: 'rgba(245, 158, 11, 0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
            fontSize={isMobile ? 10 : 12}
            fontWeight="700"
            letterSpacing={0.2}
          >
            {formatCoins(player.coins)}
          </Text>
        </XStack>
        {dealtCount > 0 && (
          // @ts-ignore - Tamagui props
          <XStack gap={isMobile ? '$0.5' : '$1'} mt="$1">
            {Array.from({ length: dealtCount }).map((_, idx) => (
              <YStack
                key={idx}
                width={isMobile ? 8 : 10}
                height={isMobile ? 14 : 18}
                bg="rgba(255, 255, 255, 0.25)"
                br="$1"
                shadowColor="#000"
                shadowOpacity={0.2}
                shadowRadius={2}
              />
            ))}
          </XStack>
        )}
      </YStack>
    </XStack>
  )
}

export const PlayerBadge = memo(Component)
