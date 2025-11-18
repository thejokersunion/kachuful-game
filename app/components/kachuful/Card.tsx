/**
 * Card Component for Kachuful Game
 * Displays a playing card with suit, rank, and various states
 */

import { Card as TCard, XStack, YStack, Text } from 'tamagui'
import type { Card as CardType } from '../../types/kachuful'
import { SUIT_SYMBOLS, SUIT_COLORS } from '../../utils/kachuful/constants'

interface CardProps {
  card: CardType
  onPress?: () => void
  selected?: boolean
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  faceDown?: boolean
}

const CARD_SIZES = {
  small: { width: 60, height: 84, fontSize: 16 },
  medium: { width: 80, height: 112, fontSize: 20 },
  large: { width: 100, height: 140, fontSize: 24 },
}

export function PlayingCard({ 
  card, 
  onPress, 
  selected = false, 
  disabled = false,
  size = 'medium',
  faceDown = false 
}: CardProps) {
  const cardSize = CARD_SIZES[size]
  const suitColor = SUIT_COLORS[card.suit]
  const color = suitColor === 'red' ? '$red10' : '$gray12'
  
  return (
    <TCard
      width={cardSize.width}
      height={cardSize.height}
      backgroundColor="$background"
      borderColor={selected ? '$primary' : '$borderColor'}
      borderWidth={selected ? 3 : 1}
      borderRadius="$3"
      elevate={!disabled}
      opacity={disabled ? 0.5 : 1}
      pressStyle={onPress && !disabled ? { scale: 0.95 } : undefined}
      animation="bouncy"
      onPress={!disabled ? onPress : undefined}
      cursor={!disabled && onPress ? 'pointer' : 'default'}
    >
      {faceDown ? (
        <XStack flex={1} items="center" justify="center" bg="$primary">
          <Text fontSize={cardSize.fontSize * 1.5}>⚜️</Text>
        </XStack>
      ) : (
        <YStack flex={1} p="$2">
          {/* Top-left corner */}
          <YStack items="flex-start">
            <Text
              col={color}
              fontSize={cardSize.fontSize}
              fontWeight="bold"
            >
              {card.rank}
            </Text>
            <Text
              col={color}
              fontSize={cardSize.fontSize}
            >
              {SUIT_SYMBOLS[card.suit]}
            </Text>
          </YStack>
          
          {/* Center suit symbol */}
          <YStack flex={1} items="center" justify="center">
            <Text
              col={color}
              fontSize={cardSize.fontSize * 2}
            >
              {SUIT_SYMBOLS[card.suit]}
            </Text>
          </YStack>
          
          {/* Bottom-right corner (rotated) */}
          <YStack items="flex-end">
            <Text
              col={color}
              fontSize={cardSize.fontSize}
            >
              {SUIT_SYMBOLS[card.suit]}
            </Text>
            <Text
              col={color}
              fontSize={cardSize.fontSize}
              fontWeight="bold"
            >
              {card.rank}
            </Text>
          </YStack>
        </YStack>
      )}
    </TCard>
  )
}

/**
 * Card Back component (for face-down cards)
 */
export function CardBack({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const cardSize = CARD_SIZES[size]
  
  return (
    <TCard
      width={cardSize.width}
      height={cardSize.height}
      bg="$primary"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$3"
      elevate
    >
      <XStack flex={1} items="center" justify="center">
        <Text fontSize={cardSize.fontSize * 1.5}>⚜️</Text>
      </XStack>
    </TCard>
  )
}
