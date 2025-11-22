import { RANKS, SUITS, type Card, type Rank, type Suit } from './types'
import type { RandomSource } from './rng'

const SUIT_ORDER: Record<Suit, number> = {
  clubs: 0,
  diamonds: 1,
  hearts: 2,
  spades: 3,
}

export function createCardId(suit: Suit, rank: Rank): string {
  return `${suit}-${rank}`
}

export function createStandardDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: createCardId(suit, rank), suit, rank })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[], rng: RandomSource): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (a.suit === b.suit) {
      return a.rank - b.rank
    }
    return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
  })
}

export function dealHands(deck: Card[], playerCount: number, handSize: number): { hands: Card[][]; remainingDeck: Card[] } {
  const hands: Card[][] = Array.from({ length: playerCount }, () => [])
  let deckIndex = 0
  for (let cardIndex = 0; cardIndex < handSize; cardIndex += 1) {
    for (let playerIndex = 0; playerIndex < playerCount; playerIndex += 1) {
      const card = deck[deckIndex]
      if (!card) {
        throw new Error('Insufficient cards to complete dealing')
      }
      hands[playerIndex].push(card)
      deckIndex += 1
    }
  }

  return {
    hands: hands.map(sortHand),
    remainingDeck: deck.slice(deckIndex),
  }
}
