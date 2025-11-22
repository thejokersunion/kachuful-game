import type { PlayerDirection } from './playerLayout'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export interface Point2D {
  x: number
  y: number
}

export const getDeckOrigin = (width: number, height: number): Point2D => {
  const safeWidth = width || 1
  const safeHeight = height || 1
  return {
    x: safeWidth / 2,
    y: safeHeight / 2,
  }
}

export const getDirectionTarget = (
  direction: PlayerDirection,
  width: number,
  height: number,
  isMobile: boolean
): Point2D => {
  const safeWidth = width || 1
  const safeHeight = height || 1
  const edgePadding = isMobile ? 64 : 96
  const verticalPadding = isMobile ? 90 : 140

  switch (direction) {
    case 'top':
      return {
        x: safeWidth / 2,
        y: clamp(safeHeight * 0.18, 80, safeHeight * 0.35),
      }
    case 'bottom':
      return {
        x: safeWidth / 2,
        y: safeHeight - verticalPadding,
      }
    case 'left':
      return {
        x: edgePadding,
        y: safeHeight / 2,
      }
    case 'right':
      return {
        x: safeWidth - edgePadding,
        y: safeHeight / 2,
      }
    default:
      return getDeckOrigin(safeWidth, safeHeight)
  }
}
