import { memo } from 'react'
import { XStack } from 'tamagui'
import type { PlayingCard } from './types'
import type { GameCardSize } from './GameCard'
import { GameCard } from './GameCard'

interface PlayerHandProps {
  cards: PlayingCard[]
  selectedCards: Set<string>
  onToggle: (cardId: string) => void
  cardSize: GameCardSize
  bottomOffset?: number
}

function Component({ cards, selectedCards, onToggle, cardSize, bottomOffset = 10 }: PlayerHandProps) {
  return (
    // @ts-ignore - Tamagui props
    <XStack
      gap={cardSize === 'large' ? -20 : -15}
      ai="flex-end"
      jc="center"
      position="absolute"
      style={{
        bottom: bottomOffset,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      {cards.map((card) => (
        <GameCard
          key={card.id}
          card={card}
          selected={selectedCards.has(card.id)}
          onPress={() => onToggle(card.id)}
          size={cardSize}
        />
      ))}
    </XStack>
  )
}

export const PlayerHand = memo(Component)
