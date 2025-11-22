import { memo } from 'react'
import { Text, YStack } from 'tamagui'

interface CenterDeckProps {
  remainingCards: number
  isAnimating: boolean
}

function Component({ remainingCards, isAnimating }: CenterDeckProps) {
  const visibleLayers = Math.min(5, Math.max(remainingCards, 1))

  return (
    <YStack ai="center" gap="$2">
      <YStack position="relative" width={72} height={96}>
        {Array.from({ length: visibleLayers }).map((_, idx) => (
          <YStack
            key={idx}
            position="absolute"
            top={-idx * 2}
            left={idx * 1.5}
            width={72}
            height={96}
            bg="#1F2937"
            style={{
              backgroundImage: 'linear-gradient(135deg, #1F2937 0%, #0F172A 100%)',
            }}
            br="$3"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.1)"
            shadowColor="#000"
            shadowOpacity={0.4}
            shadowRadius={6}
            shadowOffset={{ width: 0, height: 4 }}
            animation="bouncy"
            scale={isAnimating ? 1.02 : 1}
          />
        ))}
      </YStack>
      <Text color="white" fontWeight="700" fontSize={12} letterSpacing={0.5}>
        Deck · {remainingCards} cards
      </Text>
    </YStack>
  )
}

export const CenterDeck = memo(Component)
