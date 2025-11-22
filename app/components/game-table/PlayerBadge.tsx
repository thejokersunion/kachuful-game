import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { Circle, Text, XStack, YStack } from 'tamagui'
import type { TablePlayer } from './types'
import { formatCoins } from './helpers'

interface PlayerBadgeProps {
  player: TablePlayer
  isMobile: boolean
  placementStyle?: Record<string, any>
  variant?: 'overlay' | 'inline'
  dealtCount?: number
  pulse?: boolean
}

const SAFE_BID_COLOR = '#34D399'
const BOLD_BID_COLOR = '#FBBF24'
const PARTICLE_GLYPHS = ['♠', '♦', '♥', '♣', '✦'] as const

function getBidGlowTheme(bid: number | null, totalCards: number) {
  if (bid === null || totalCards <= 0) {
    return {
      color: 'rgba(255,255,255,0.65)',
      background: 'rgba(255,255,255,0.04)',
    }
  }
  const ratio = Math.min(Math.max(bid / totalCards, 0), 1)
  if (ratio >= 0.7) {
    return {
      color: BOLD_BID_COLOR,
      background: 'rgba(251,191,36,0.18)',
    }
  }
  return {
    color: SAFE_BID_COLOR,
    background: 'rgba(52,211,153,0.2)',
  }
}

function Component({ player, isMobile, placementStyle, variant = 'overlay', dealtCount = 0, pulse = false }: PlayerBadgeProps) {
  const avatarSize = isMobile ? 36 : 48
  const cardsInHand = dealtCount || player.handCount || 0
  const bidTheme = useMemo(() => getBidGlowTheme(player.bid, cardsInHand), [player.bid, cardsInHand])
  const rippleAnim = useRef(new Animated.Value(0)).current
  const [bidPulseKey, setBidPulseKey] = useState(0)
  const prevBidRef = useRef<number | null>(player.bid)

  useEffect(() => {
    prevBidRef.current = player.bid
  }, [player.id])

  useEffect(() => {
    if (player.bid === null) {
      prevBidRef.current = player.bid
      return
    }
    if (prevBidRef.current === player.bid) {
      return
    }
    prevBidRef.current = player.bid
    setBidPulseKey(Date.now())
    rippleAnim.setValue(0)
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [player.bid, rippleAnim])

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
      borderWidth={pulse ? 2.4 : player.isCurrentTurn ? 2 : 1.5}
      borderColor={pulse ? '#FBBF24' : player.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}
      shadowColor={pulse ? '#FBBF24' : player.isCurrentTurn ? '#10B981' : '#000'}
      shadowRadius={pulse ? 18 : player.isCurrentTurn ? 12 : 6}
      shadowOpacity={pulse ? 0.95 : player.isCurrentTurn ? 0.9 : 0.5}
      shadowOffset={{ width: 0, height: 3 }}
      animation="bouncy"
      scale={pulse ? 1.04 : 1}
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
        {player.bid !== null && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -(avatarSize * 0.5),
              left: -(avatarSize * 0.5),
              width: avatarSize * 2,
              height: avatarSize * 2,
              borderRadius: (avatarSize * 2) / 2,
              borderWidth: 1.5,
              borderColor: bidTheme.color,
              opacity: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
              transform: [
                {
                  scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.4] }),
                },
              ],
            }}
          />
        )}
        {(player.isCurrentTurn || pulse) && (
          <Circle
            size={avatarSize + 6}
            position="absolute"
            top={-3}
            left={-3}
            bg={pulse ? '#FBBF24' : bidTheme.color === SAFE_BID_COLOR ? '#10B981' : '#FBBF24'}
            opacity={pulse ? 0.45 : 0.3}
            animation="bouncy"
          />
        )}
        <Circle
          size={avatarSize}
          overflow="hidden"
          bg="#F1F5F9"
          borderWidth={1.5}
          shadowColor="#000"
          shadowRadius={3}
          shadowOpacity={0.3}
          style={{
            backgroundImage: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            backgroundColor: '#F1F5F9',
            borderColor: player.isCurrentTurn ? bidTheme.color : 'rgba(255, 255, 255, 0.2)',
          }}
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
          <YStack
            gap="$0.5"
            position="relative"
            px="$1.5"
            py="$0.5"
            br="$2"
            style={{ backgroundColor: bidTheme.background }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.65)' }} fontSize={10}>
              Bid
            </Text>
            <Text
              style={{ color: player.bid !== null ? bidTheme.color : 'rgba(255,255,255,0.4)' }}
              fontSize={14}
              fontWeight="800"
            >
              {bidLabel}
            </Text>
            {player.bid !== null ? <ParticleBurst triggerKey={bidPulseKey} color={bidTheme.color} /> : null}
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

interface ParticleConfig {
  id: string
  progress: Animated.Value
  driftX: number
  driftY: number
  scale: number
  glyph: (typeof PARTICLE_GLYPHS)[number]
  fontSize: number
  delay: number
}

interface ParticleBurstProps {
  triggerKey: number
  color: string
}

function ParticleBurst({ triggerKey, color }: ParticleBurstProps) {
  const [particles, setParticles] = useState<ParticleConfig[]>([])

  useEffect(() => {
    if (!triggerKey) return
    const created: ParticleConfig[] = Array.from({ length: 6 }, (_, idx) => ({
      id: `${triggerKey}-${idx}`,
      progress: new Animated.Value(0),
      driftX: (Math.random() - 0.5) * 26,
      driftY: -20 - Math.random() * 16,
      scale: 0.8 + Math.random() * 0.4,
      glyph: PARTICLE_GLYPHS[idx % PARTICLE_GLYPHS.length],
      fontSize: 10 + Math.random() * 4,
      delay: idx * 35,
    }))
    setParticles(created)

    created.forEach((particle) => {
      Animated.timing(particle.progress, {
        toValue: 1,
        duration: 500,
        delay: particle.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start()
    })

    const timeout = setTimeout(() => setParticles([]), 520 + created.length * 35)
    return () => clearTimeout(timeout)
  }, [triggerKey])

  if (!particles.length) return null

  return (
    <YStack position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none" ai="center" jc="center">
      {particles.map((particle) => (
        <Animated.Text
          key={particle.id}
          style={{
            position: 'absolute',
            color,
            fontSize: particle.fontSize,
            opacity: particle.progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [
              {
                translateX: particle.progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.driftX] }),
              },
              {
                translateY: particle.progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.driftY] }),
              },
              {
                scale: particle.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [particle.scale * 0.5, particle.scale],
                }),
              },
            ],
          }}
        >
          {particle.glyph}
        </Animated.Text>
      ))}
    </YStack>
  )
}

export const PlayerBadge = memo(Component)
