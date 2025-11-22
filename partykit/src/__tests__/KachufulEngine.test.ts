import { describe, it, expect } from 'vitest'
import {
  KachufulEngine,
  IllegalBidError,
  IllegalPlayError,
  type Card,
  type GameConfig,
  type Suit,
  type Rank,
} from '../game-engine'

const BASE_PLAYERS = [
  { id: 'p1', name: 'Player 1' },
  { id: 'p2', name: 'Player 2' },
  { id: 'p3', name: 'Player 3' },
]

const standardConfig = (overrides: Partial<GameConfig> = {}): GameConfig => ({
  players: BASE_PLAYERS,
  handSequence: [2],
  scoring: { type: 'standard', hitPoints: 10 },
  ...overrides,
})

const makeCard = (id: string, suit: Suit, rank: Rank): Card => ({ id, suit, rank })

describe('KachufulEngine', () => {
  it('deals deterministic hands on start()', () => {
    const engine = new KachufulEngine(standardConfig({ rngSeed: 42 }))
    const snapshot = engine.start()

    expect(snapshot.phase).toBe('bidding')
    snapshot.players.forEach(player => {
      expect(player.handCount).toBe(2)
    })
  })

  it('enforces the last-bid restriction', () => {
    const engine = new KachufulEngine(standardConfig({ handSequence: [2], rngSeed: 99 }))
    engine.start()

    // Order: p2, p3, p1 because dealer defaults to p1
    engine.submitBid('p2', 1)
    engine.submitBid('p3', 0)
    expect(() => engine.submitBid('p1', 1)).toThrow(IllegalBidError)
  })

  it('resolves tricks using the led suit when no trump is set', () => {
    const presetDeck: Card[] = [
      makeCard('p1-heart-10', 'hearts', 10 as Rank),
      makeCard('p2-heart-8', 'hearts', 8 as Rank),
      makeCard('p3-club-a', 'clubs', 14 as Rank),
    ]

    const engine = new KachufulEngine(standardConfig({ handSequence: [1], trumpRotation: 'none', presetDeck }))
    engine.start()
    engine.submitBid('p2', 1)
    engine.submitBid('p3', 1)
    engine.submitBid('p1', 0)

    engine.playCard('p2', 'p2-heart-8')
    engine.playCard('p3', 'p3-club-a')
    const result = engine.playCard('p1', 'p1-heart-10')

    expect(result.trickResolved).toBe(true)
    expect(result.winnerId).toBe('p1')
  })

  it('gives priority to trump cards when configured', () => {
    const presetDeck: Card[] = [
      makeCard('p1-heart-2', 'hearts', 2 as Rank),
      makeCard('p2-club-9', 'clubs', 9 as Rank),
      makeCard('p3-spade-3', 'spades', 3 as Rank),
    ]

    const engine = new KachufulEngine(standardConfig({
      handSequence: [1],
      trumpRotation: 'fixed',
      fixedTrump: 'spades',
      presetDeck,
    }))

    engine.start()
    engine.submitBid('p2', 1)
    engine.submitBid('p3', 1)
    engine.submitBid('p1', 0)

    engine.playCard('p2', 'p2-club-9')
    engine.playCard('p3', 'p3-spade-3')
    const result = engine.playCard('p1', 'p1-heart-2')

    expect(result.winnerId).toBe('p3')
  })

  it('awards 10 + bid points for standard scoring when bid matches tricks', () => {
    const presetDeck: Card[] = [
      makeCard('p1-heart-a', 'hearts', 14 as Rank),
      makeCard('p2-heart-k', 'hearts', 13 as Rank),
      makeCard('p3-club-q', 'clubs', 12 as Rank),
    ]

    const engine = new KachufulEngine(standardConfig({ handSequence: [1], trumpRotation: 'none', presetDeck }))
    engine.start()
    engine.submitBid('p2', 1)
    engine.submitBid('p3', 0)
    engine.submitBid('p1', 1)

    engine.playCard('p2', 'p2-heart-k')
    engine.playCard('p3', 'p3-club-q')
    const result = engine.playCard('p1', 'p1-heart-a')

    expect(result.snapshot.phase).toBe('completed')
    expect(result.snapshot.scores['p1']).toBe(11)
    expect(result.snapshot.scores['p2']).toBe(0)
    expect(result.snapshot.scores['p3']).toBe(10)
  })

  it('prevents playing off-suit when player still has the led suit', () => {
    const presetDeck: Card[] = [
      makeCard('p1-heart-a', 'hearts', 14 as Rank),
      makeCard('p2-heart-k', 'hearts', 13 as Rank),
      makeCard('p3-heart-q', 'hearts', 12 as Rank),
      makeCard('p1-club-2', 'clubs', 2 as Rank),
      makeCard('p2-diamond-4', 'diamonds', 4 as Rank),
      makeCard('p3-club-9', 'clubs', 9 as Rank),
    ]

    const engine = new KachufulEngine(standardConfig({ handSequence: [2], trumpRotation: 'none', presetDeck }))
    engine.start()
    engine.submitBid('p2', 0)
    engine.submitBid('p3', 0)
    engine.submitBid('p1', 0)

    engine.playCard('p2', 'p2-heart-k')
    expect(() => engine.playCard('p3', 'p3-club-9')).toThrow(IllegalPlayError)
  })
})
