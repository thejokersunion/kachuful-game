import { memo } from 'react'
import { XStack, YStack } from 'tamagui'
import type { PlayingCard } from './types'
import type { GameCardSize } from './GameCard'
import { GameCard } from './GameCard'

interface CenterPileProps {
  cards: PlayingCard[]
  cardSize: GameCardSize
  maxWidth?: number
}

function Component({ cards, cardSize, maxWidth = 300 }: CenterPileProps) {
  return (
    // @ts-ignore - Tamagui props
    <YStack gap="$3" ai="center">
      {/* @ts-ignore - Tamagui props */}
      <XStack gap={cardSize === 'small' ? '$1' : '$2'} flexWrap="wrap" jc="center" maxWidth={maxWidth}>
        {cards.map((card) => (
          <GameCard key={card.id} card={card} size={cardSize} />
        ))}
      </XStack>
    </YStack>
  )
}

export const CenterPile = memo(Component)
