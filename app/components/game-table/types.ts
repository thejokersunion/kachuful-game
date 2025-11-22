import type { Player as SharedPlayer, PlayerStatus } from '../../types/game'

export type CardSuit = '♠' | '♥' | '♦' | '♣'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface PlayingCard {
  id: string
  suit: CardSuit
  rank: CardRank
}

export interface TablePlayer extends Pick<SharedPlayer, 'id' | 'avatar' | 'score' | 'handCount' | 'isHost'> {
  displayName: string
  coins: number
  isCurrentTurn: boolean
  bid: number | null
  tricksWon: number
  status: PlayerStatus
  isSelf: boolean
}
