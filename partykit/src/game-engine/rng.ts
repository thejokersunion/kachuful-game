export interface RandomSource {
  next(): number
}

export class Mulberry32 implements RandomSource {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6D2B79F5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEFAULT_SEED = 0x12345678

function hashSeed(seed: string | number | undefined): number {
  if (seed === undefined) {
    return DEFAULT_SEED
  }

  if (typeof seed === 'number') {
    return seed >>> 0
  }

  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return h >>> 0
}

export function createRandomSource(seed?: string | number): RandomSource {
  return new Mulberry32(hashSeed(seed))
}
