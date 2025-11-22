export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const
export type Suit = (typeof SUITS)[number]

export type SuitGlyph = '♣' | '♦' | '♥' | '♠'

export const SUIT_SYMBOLS: Record<Suit, SuitGlyph> = {
	clubs: '♣',
	diamonds: '♦',
	hearts: '♥',
	spades: '♠',
}

export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const
export type Rank = (typeof RANKS)[number]

export type Phase = 'idle' | 'bidding' | 'playing' | 'scoring' | 'round_end' | 'completed'
export type PendingAction = 'bid' | 'play' | 'none'

export interface Card {
	id: string
	suit: Suit
	rank: Rank
}

export interface VisibleCard extends Card {
	label: string
	symbol: SuitGlyph
}

export interface TrickCard {
	playerId: string
	card: Card
}

export interface PlayerConfig {
	id: string
	name: string
}

export interface InternalPlayerState extends PlayerConfig {
	seatIndex: number
	hand: Card[]
	handCount: number
	bid: number | null
	tricksWon: number
	score: number
}

export type ScoreModel =
	| { type: 'standard'; hitPoints?: number }
	| { type: 'penalty'; hitPoints?: number; penaltyPerTrick?: number }
	| { type: 'multiplier'; multiplier: number; hitFloor?: number }

export interface GameConfig {
	players: PlayerConfig[]
	handSequence: number[]
	scoring: ScoreModel
	lastBidRestriction?: boolean
	trumpRotation?: 'rotate' | 'fixed' | 'random' | 'none'
	fixedTrump?: Suit | null
	initialDealerIndex?: number
	rngSeed?: number | string
	presetDeck?: Card[]
}

export interface EnginePlayerView {
	id: string
	name: string
	seatIndex: number
	score: number
	bid: number | null
	tricksWon: number
	handCount: number
	cards: VisibleCard[]
}

export interface EngineEvent {
	id: string
	type: 'round_started' | 'bid_submitted' | 'card_played' | 'trick_resolved' | 'round_scored'
	timestamp: number
	payload: Record<string, unknown>
}

export interface EngineSnapshot {
	phase: Phase
	roundIndex: number
	handSize: number
	dealerId: string | null
	leadPlayerId: string | null
	trump: Suit | null
	pendingPlayerId: string | null
	pendingAction: PendingAction
	bids: Record<string, number | null>
	tricksWon: Record<string, number>
	scores: Record<string, number>
	players: EnginePlayerView[]
	currentTrick: Array<{ playerId: string; card: VisibleCard }>
	lastTrickWinner: string | null
	deckCount: number
	history: EngineEvent[]
	stateVersion: number
}

export interface SubmitBidResult {
	snapshot: EngineSnapshot
}

export interface PlayCardResult {
	snapshot: EngineSnapshot
	trickResolved: boolean
	winnerId: string | null
}

export class EngineError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'EngineError'
	}
}

export class IllegalBidError extends EngineError {
	constructor(message: string) {
		super(message)
		this.name = 'IllegalBidError'
	}
}

export class IllegalPlayError extends EngineError {
	constructor(message: string) {
		super(message)
		this.name = 'IllegalPlayError'
	}
}
