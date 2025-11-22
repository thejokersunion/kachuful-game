import { memo } from 'react'
import { Text, YStack } from 'tamagui'
import type { PlayingCard } from './types'
import { getSuitColor } from './helpers'

export interface FloatingCardDecoration extends PlayingCard {
  top?: string
  left?: string
  right?: string
  rotation?: number
}

interface FloatingCardsProps {
  cards: FloatingCardDecoration[]
  isMobile: boolean
}

function Component({ cards, isMobile }: FloatingCardsProps) {
  return (
    <>
      {cards.map((card) => {
        const cardColor = getSuitColor(card.suit)
        return (
          // @ts-ignore - Tamagui props
          <YStack
            key={card.id}
            width={isMobile ? 40 : 60}
            height={isMobile ? 56 : 84}
            bg="white"
            br="$2"
            jc="center"
            ai="center"
            opacity={0.3}
            animation="lazy"
            style={{
              position: 'absolute',
              top: card.top,
              left: card.left,
              right: card.right,
              transform: `rotate(${card.rotation ?? 0}deg)`
            }}
          >
            <Text fontSize={isMobile ? 16 : 24} fontWeight="bold" style={{ color: cardColor }}>
              {card.rank}
            </Text>
            <Text fontSize={isMobile ? 14 : 20} style={{ color: cardColor }}>
              {card.suit}
            </Text>
          </YStack>
        )
      })}
    </>
  )
}

export const FloatingCards = memo(Component)
