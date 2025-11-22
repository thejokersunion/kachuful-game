import { describe, expect, it } from 'vitest'
import { formatCoins, getSuitColor } from '../components/game-table/helpers'

describe('game table helpers', () => {
  it('formats coin amounts using compact notation', () => {
    expect(formatCoins(0)).toBe('0 M')
    expect(formatCoins(950)).toBe('950')
    expect(formatCoins(12_300)).toBe('12.3 K')
    expect(formatCoins(4_500_000)).toBe('4.5 M')
  })

  it('returns correct suit colors', () => {
    expect(getSuitColor('♥')).toBe('#DC2626')
    expect(getSuitColor('♣')).toBe('#000000')
  })
})
