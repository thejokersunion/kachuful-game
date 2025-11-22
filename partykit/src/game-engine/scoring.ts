import type { ScoreModel } from './types'

export function calculateScore(model: ScoreModel, bid: number, won: number): number {
  const hit = bid === won
  if (model.type === 'standard') {
    const base = model.hitPoints ?? 10
    return hit ? base + bid : 0
  }

  if (model.type === 'penalty') {
    const base = model.hitPoints ?? 10
    const penalty = model.penaltyPerTrick ?? 1
    return hit ? base + bid : -Math.abs(won - bid) * penalty
  }

  const multiplier = model.multiplier
  const floor = model.hitFloor ?? 0
  return hit ? Math.max(floor, bid) * multiplier : 0
}

export function scoreRound(model: ScoreModel, bids: Record<string, number>, tricksWon: Record<string, number>): Record<string, number> {
  const delta: Record<string, number> = {}
  for (const playerId of Object.keys(bids)) {
    const bid = bids[playerId]
    const won = tricksWon[playerId] ?? 0
    delta[playerId] = calculateScore(model, bid, won)
  }
  return delta
}
