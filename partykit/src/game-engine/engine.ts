import { scoreRound } from './scoring'
import { createRandomSource, type RandomSource } from './rng'
import { createStandardDeck, dealHands, shuffleDeck, sortHand } from './deck'
import {
  type Card,
  type EngineEvent,
  type EnginePlayerView,
  type EngineSnapshot,
  type GameConfig,
  type InternalPlayerState,
  IllegalBidError,
  IllegalPlayError,
  type PendingAction,
  type Phase,
  type PlayCardResult,
  type ScoreModel,
  SUIT_SYMBOLS,
  type Suit,
  type TrickCard,
  type VisibleCard,
} from './types'

interface InternalState {
  players: InternalPlayerState[]
  roundIndex: number
  dealerIndex: number
  leadIndex: number | null
  pendingIndex: number | null
  phase: Phase
  handSize: number
  trump: Suit | null
  deck: Card[]
  currentTrick: TrickCard[]
  lastTrickWinner: string | null
  history: EngineSnapshot['history']
  stateVersion: number
}

const MIN_PLAYERS = 3
const MAX_PLAYERS = 7
const MAX_HISTORY = 30

const RANK_LABEL: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
}

export class KachufulEngine {
  private rng: RandomSource
  private readonly config: GameConfig
  private state: InternalState

  constructor(config: GameConfig) {
    if (!config.players || config.players.length < MIN_PLAYERS || config.players.length > MAX_PLAYERS) {
      throw new Error(`Kachuful requires between ${MIN_PLAYERS} and ${MAX_PLAYERS} players`)
    }

    if (!config.handSequence || config.handSequence.length === 0) {
      throw new Error('Hand sequence cannot be empty')
    }

    this.config = {
      lastBidRestriction: true,
      trumpRotation: 'rotate',
      ...config,
    }

    this.rng = createRandomSource(this.config.rngSeed)
    this.state = {
      players: this.config.players.map((player, index) => ({
        ...player,
        seatIndex: index,
        hand: [],
        handCount: 0,
        bid: null,
        tricksWon: 0,
        score: 0,
      })),
      roundIndex: -1,
      dealerIndex: this.config.initialDealerIndex ?? 0,
      leadIndex: null,
      pendingIndex: null,
      phase: 'idle',
      handSize: 0,
      trump: null,
      deck: [],
      currentTrick: [],
      lastTrickWinner: null,
      history: [],
      stateVersion: 0,
    }
  }

  start(): EngineSnapshot {
    if (this.state.phase !== 'idle') {
      throw new Error('Game already started')
    }
    return this.startRound(this.state.roundIndex + 1)
  }

  startNextRound(): EngineSnapshot {
    if (this.state.phase !== 'round_end') {
      throw new Error('Cannot start next round until the current round is acknowledged')
    }
    if (this.state.roundIndex + 1 >= this.config.handSequence.length) {
      throw new Error('All rounds already completed')
    }
    return this.startRound(this.state.roundIndex + 1)
  }

  submitBid(playerId: string, amount: number): EngineSnapshot {
    if (this.state.phase !== 'bidding') {
      throw new IllegalBidError('Bids are only allowed during the bidding phase')
    }

    const playerIndex = this.findPlayerIndex(playerId)
    if (this.state.pendingIndex !== playerIndex) {
      throw new IllegalBidError('It is not your turn to bid')
    }

    if (amount < 0 || amount > this.state.handSize) {
      throw new IllegalBidError('Bid must be between 0 and hand size')
    }

    const player = this.state.players[playerIndex]
    if (player.bid !== null) {
      throw new IllegalBidError('Bid already submitted')
    }

    if (this.config.lastBidRestriction) {
      const remainingToBid = this.state.players.filter(p => p.bid === null)
      if (remainingToBid.length === 1 && remainingToBid[0].id === playerId) {
        const currentSum = this.state.players.reduce((sum, p) => sum + (p.bid ?? 0), 0)
        if (currentSum + amount === this.state.handSize) {
          throw new IllegalBidError('Last bidder cannot make total bids equal total tricks')
        }
      }
    }

    player.bid = amount
    this.logEvent('bid_submitted', { playerId, amount })
    this.advancePendingIndex()

    if (this.state.players.every(p => p.bid !== null)) {
      this.state.phase = 'playing'
      this.state.pendingIndex = this.state.leadIndex
      this.state.currentTrick = []
    }

    return this.snapshot()
  }

  playCard(playerId: string, cardId: string): PlayCardResult {
    if (this.state.phase !== 'playing') {
      throw new IllegalPlayError('Cards can only be played during the playing phase')
    }

    const playerIndex = this.findPlayerIndex(playerId)
    if (this.state.pendingIndex !== playerIndex) {
      throw new IllegalPlayError('It is not your turn')
    }

    const player = this.state.players[playerIndex]
    const cardIndex = player.hand.findIndex(card => card.id === cardId)
    if (cardIndex === -1) {
      throw new IllegalPlayError('Card not found in hand')
    }

    const card = player.hand[cardIndex]
    if (this.state.currentTrick.length > 0) {
      const leadSuit = this.state.currentTrick[0].card.suit
      const hasLeadSuit = player.hand.some(c => c.suit === leadSuit)
      if (card.suit !== leadSuit && hasLeadSuit) {
        throw new IllegalPlayError('Must follow suit when possible')
      }
    }

    player.hand.splice(cardIndex, 1)
    player.handCount = player.hand.length
    this.state.currentTrick.push({ playerId, card })
    this.logEvent('card_played', { playerId, cardId })

    let trickResolved = false
    let winnerId: string | null = null

    if (this.state.currentTrick.length === this.state.players.length) {
      winnerId = this.resolveTrick()
      trickResolved = true
    } else {
      this.advancePendingIndex()
    }

    return {
      snapshot: this.snapshot(),
      trickResolved,
      winnerId,
    }
  }

  getSnapshot(viewerId?: string): EngineSnapshot {
    return this.snapshot(viewerId)
  }

  getPlayerView(playerId: string): EnginePlayerView | undefined {
    return this.snapshot(playerId).players.find(p => p.id === playerId)
  }

  private startRound(roundIndex: number): EngineSnapshot {
    this.state.roundIndex = roundIndex
    this.state.handSize = this.config.handSequence[roundIndex]
    const initialDealer = this.config.initialDealerIndex ?? 0
    this.state.dealerIndex = (initialDealer + roundIndex) % this.state.players.length
    this.state.leadIndex = (this.state.dealerIndex + 1) % this.state.players.length
    this.state.pendingIndex = this.state.leadIndex
    this.state.trump = this.determineTrump(roundIndex)

    const baseDeck = this.config.presetDeck ? [...this.config.presetDeck] : createStandardDeck()
    const workingDeck = this.config.presetDeck ? baseDeck : shuffleDeck(baseDeck, this.rng)

    const requiredCards = this.state.handSize * this.state.players.length
    if (requiredCards > workingDeck.length) {
      throw new Error('Hand size is too large for the current deck configuration')
    }

    const { hands, remainingDeck } = dealHands(workingDeck, this.state.players.length, this.state.handSize)
    this.state.players = this.state.players.map((player, index) => ({
      ...player,
      hand: sortHand(hands[index]),
      handCount: hands[index].length,
      bid: null,
      tricksWon: 0,
    }))

    this.state.deck = remainingDeck
    this.state.currentTrick = []
    this.state.lastTrickWinner = null
    this.state.phase = 'bidding'
    this.logEvent('round_started', {
      roundIndex,
      handSize: this.state.handSize,
      trump: this.state.trump,
    })

    return this.snapshot()
  }

  private resolveTrick(): string {
    const leadSuit = this.state.currentTrick[0]?.card.suit
    let winningPlay = this.state.currentTrick[0]
    for (let i = 1; i < this.state.currentTrick.length; i += 1) {
      const contender = this.state.currentTrick[i]
      if (!winningPlay) {
        winningPlay = contender
        continue
      }

      if (this.state.trump && contender.card.suit === this.state.trump) {
        if (winningPlay.card.suit !== this.state.trump || contender.card.rank > winningPlay.card.rank) {
          winningPlay = contender
        }
        continue
      }

      if (winningPlay.card.suit === this.state.trump) {
        continue
      }

      if (contender.card.suit === leadSuit && contender.card.rank > winningPlay.card.rank && winningPlay.card.suit === leadSuit) {
        winningPlay = contender
      }
    }

    if (!winningPlay) {
      throw new Error('Unable to resolve trick winner')
    }

    const winnerIndex = this.findPlayerIndex(winningPlay.playerId)
    const winner = this.state.players[winnerIndex]
    winner.tricksWon += 1
    this.state.lastTrickWinner = winner.id
    this.state.leadIndex = winnerIndex
    this.state.pendingIndex = winnerIndex
    this.state.currentTrick = []
    this.logEvent('trick_resolved', { winnerId: winner.id })

    const roundOver = this.state.players.every(p => p.hand.length === 0)
    if (roundOver) {
      this.completeRound()
    }

    return winner.id
  }

  private completeRound() {
    this.state.phase = 'scoring'
    const bids: Record<string, number> = {}
    const tricks: Record<string, number> = {}
    this.state.players.forEach(player => {
      bids[player.id] = player.bid ?? 0
      tricks[player.id] = player.tricksWon
    })

    const delta = scoreRound(this.config.scoring, bids, tricks)
    this.state.players = this.state.players.map(player => ({
      ...player,
      score: player.score + delta[player.id],
    }))

    this.logEvent('round_scored', { delta })

    if (this.state.roundIndex + 1 >= this.config.handSequence.length) {
      this.state.phase = 'completed'
      this.state.pendingIndex = null
      return
    }

    this.state.phase = 'round_end'
    this.state.pendingIndex = null
  }

  private determineTrump(roundIndex: number): Suit | null {
    switch (this.config.trumpRotation) {
      case 'fixed':
        return this.config.fixedTrump ?? null
      case 'none':
        return null
      case 'random': {
        const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades']
        const index = Math.floor(this.rng.next() * suits.length)
        return suits[index]
      }
      case 'rotate':
      default: {
        const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades']
        return suits[(roundIndex + (this.config.initialDealerIndex ?? 0)) % suits.length]
      }
    }
  }

  private advancePendingIndex() {
    if (this.state.pendingIndex === null) {
      return
    }
    this.state.pendingIndex = (this.state.pendingIndex + 1) % this.state.players.length
  }

  private snapshot(viewerId?: string): EngineSnapshot {
    this.state.stateVersion += 1

    const players: EnginePlayerView[] = this.state.players.map(player => ({
      id: player.id,
      name: player.name,
      seatIndex: player.seatIndex,
      score: player.score,
      bid: player.bid,
      tricksWon: player.tricksWon,
      handCount: player.hand.length,
      cards: viewerId === player.id ? player.hand.map(toVisibleCard) : [],
    }))

    const bids = this.state.players.reduce<Record<string, number | null>>((acc, player) => {
      acc[player.id] = player.bid
      return acc
    }, {})

    const tricksWon = this.state.players.reduce<Record<string, number>>((acc, player) => {
      acc[player.id] = player.tricksWon
      return acc
    }, {})

    const scores = this.state.players.reduce<Record<string, number>>((acc, player) => {
      acc[player.id] = player.score
      return acc
    }, {})

    const currentTrick = this.state.currentTrick.map(play => ({
      playerId: play.playerId,
      card: toVisibleCard(play.card),
    }))

    const pendingAction: PendingAction = this.state.phase === 'bidding'
      ? 'bid'
      : this.state.phase === 'playing'
        ? 'play'
        : 'none'

    return {
      phase: this.state.phase,
      roundIndex: this.state.roundIndex,
      handSize: this.state.handSize,
      dealerId: this.state.players[this.state.dealerIndex]?.id ?? null,
      leadPlayerId: this.state.leadIndex !== null ? this.state.players[this.state.leadIndex]?.id ?? null : null,
      trump: this.state.trump,
      pendingPlayerId: this.state.pendingIndex !== null ? this.state.players[this.state.pendingIndex]?.id ?? null : null,
      pendingAction,
      bids,
      tricksWon,
      scores,
      players,
      currentTrick,
      lastTrickWinner: this.state.lastTrickWinner,
      deckCount: this.state.deck.length,
      history: [...this.state.history],
      stateVersion: this.state.stateVersion,
    }
  }

  private logEvent(type: EngineEvent['type'], payload: Record<string, unknown>) {
    const entry: EngineEvent = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      timestamp: Date.now(),
      payload,
    }
    this.state.history = [...this.state.history, entry].slice(-MAX_HISTORY)
  }

  private findPlayerIndex(playerId: string): number {
    const index = this.state.players.findIndex(player => player.id === playerId)
    if (index === -1) {
      throw new Error('Player not found in engine state')
    }
    return index
  }
}

function toVisibleCard(card: Card): VisibleCard {
  return {
    ...card,
    label: `${rankToLabel(card.rank)}${SUIT_SYMBOLS[card.suit]}`,
    symbol: SUIT_SYMBOLS[card.suit],
  }
}

function rankToLabel(rank: number): string {
  return RANK_LABEL[rank] ?? `${rank}`
}
