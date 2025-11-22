import type { CardSuit } from './types'

export const getSuitColor = (suit: CardSuit): string => {
  return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000'
}

export const formatCoins = (value: number): string => {
  if (value <= 0) {
    return '0 M'
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} K`
  }

  return `${value}`
}
