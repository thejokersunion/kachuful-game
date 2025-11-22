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

  const statusColor = player.status === 'connected' || player.status === 'playing' ? '#34D399' : '#FBBF24'
  const bidLabel = player.bid ?? '—'

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
        <XStack ai="center" gap="$1">
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
          {player.isSelf && (
            <Text color="#FBBF24" fontSize={10} fontWeight="700">
              (You)
            </Text>
          )}
          {player.isHost && (
            <Text color="#FDE68A" fontSize={10} fontWeight="700">
              HOST
            </Text>
          )}
        </XStack>
        {/* @ts-ignore */}
        <XStack gap="$2" ai="center">
          <XStack ai="center" gap="$1" bg="rgba(16,185,129,0.15)" px="$1.5" py="$0.5" br="$2">
            <Circle size={8} bg={statusColor} />
            <Text color="#34D399" fontSize={10} fontWeight="700">
              {player.status === 'disconnected' ? 'Away' : 'Ready'}
            </Text>
          </XStack>
          <XStack ai="center" gap="$1" bg="rgba(245,158,11,0.15)" px="$1.5" py="$0.5" br="$2">
            <Text color="#FBBF24" fontSize={10} fontWeight="700">
              Score {player.score}
            </Text>
          </XStack>
        </XStack>
        {/* @ts-ignore */}
        <XStack gap="$2" ai="center" mt="$1">
          <YStack gap="$0.5">
            <Text color="rgba(255,255,255,0.65)" fontSize={10}>
              Bid
            </Text>
            <Text color={player.bid !== null ? '#FBBF24' : 'rgba(255,255,255,0.4)'} fontSize={14} fontWeight="800">
              {bidLabel}
            </Text>
          </YStack>
          <YStack gap="$0.5">
            <Text color="rgba(255,255,255,0.65)" fontSize={10}>
              Tricks
            </Text>
            <Text color="#34D399" fontSize={14} fontWeight="800">
              {player.tricksWon}
            </Text>
          </YStack>
          {typeof dealtCount === 'number' && dealtCount >= 0 && (
            <YStack gap="$0.5">
              <Text color="rgba(255,255,255,0.65)" fontSize={10}>
                Cards
              </Text>
              <Text color="rgba(255,255,255,0.85)" fontSize={14} fontWeight="800">
                {dealtCount}
              </Text>
            </YStack>
          )}
        </XStack>
        {/* Coins */}
        {/* @ts-ignore */}
        <XStack
          gap="$1"
          ai="center"
          justifyContent="flex-start"
          bg="rgba(15,118,110,0.35)"
          py="$0.5"
          px="$1.5"
          br="$2"
        >
          <Circle
            size={isMobile ? 10 : 12}
            bg="#0D9488"
            shadowColor="#14B8A6"
            shadowRadius={3}
            shadowOpacity={0.6}
          />
          <Text
            style={{
              color: '#5EEAD4',
              textShadowColor: 'rgba(14,165,233,0.5)',
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
      </YStack>
    </XStack>
  )
}

export const PlayerBadge = memo(Component)
