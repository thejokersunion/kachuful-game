import type { Point2D } from './animationTargets'

export type PlayerDirection = 'top' | 'left' | 'right' | 'bottom' | 'trump'

const getPadding = (isMobile: boolean) => (isMobile ? 16 : 28)
const getBadgeDimensions = (isMobile: boolean) => ({
  halfWidth: isMobile ? 70 : 90,
  halfHeight: isMobile ? 34 : 40,
})

export const getPlayerPosition = (
  index: number,
  total: number,
  containerWidth: number,
  containerHeight: number,
  isMobile: boolean
): Record<string, any> => {
  const padding = getPadding(isMobile)

  if (index === 0) {
    return { bottom: -1000 }
  }

  const otherPlayersCount = total - 1
  const otherIndex = index - 1

  if (total === 2) {
    return { top: padding, left: '50%', transform: 'translateX(-50%)' }
  }

  if (total === 3) {
    const positions = [
      { top: padding, left: '30%', transform: 'translateX(-50%)' },
      { top: padding, right: '30%', transform: 'translateX(50%)' },
    ]
    return positions[otherIndex]
  }

  if (total === 4) {
    const positions = [
      { top: padding, left: '50%', transform: 'translateX(-50%)' },
      { top: '50%', left: padding, transform: 'translateY(-50%)' },
      { top: '50%', right: padding, transform: 'translateY(-50%)' },
    ]
    return positions[otherIndex]
  }

  if (total === 5) {
    const positions = [
      { top: padding, left: '33%', transform: 'translateX(-50%)' },
      { top: padding, right: '33%', transform: 'translateX(50%)' },
      { top: '50%', left: padding, transform: 'translateY(-50%)' },
      { top: '50%', right: padding, transform: 'translateY(-50%)' },
    ]
    return positions[otherIndex]
  }

  const topCount = Math.ceil(otherPlayersCount / 3)
  const leftCount = Math.floor((otherPlayersCount - topCount) / 2)
  const rightCount = otherPlayersCount - topCount - leftCount

  if (otherIndex < topCount) {
    const spacing = containerWidth / (topCount + 1)
    return { top: padding, left: spacing * (otherIndex + 1), transform: 'translateX(-50%)' }
  } else if (otherIndex < topCount + leftCount) {
    const leftIndex = otherIndex - topCount
    const spacing = containerHeight / (leftCount + 1)
    return { left: padding, top: spacing * (leftIndex + 1), transform: 'translateY(-50%)' }
  }

  const rightIndex = otherIndex - topCount - leftCount
  const spacing = containerHeight / (rightCount + 1)
  return { right: padding, top: spacing * (rightIndex + 1), transform: 'translateY(-50%)' }
}

export const getPlayerDirection = (index: number, total: number): PlayerDirection => {
  if (index === 0) {
    return 'bottom'
  }

  if (total === 2) {
    return 'top'
  }

  const otherIndex = index - 1

  if (total === 3) {
    return 'top'
  }

  if (total === 4) {
    const mapping: PlayerDirection[] = ['top', 'left', 'right']
    return mapping[otherIndex]
  }

  if (total === 5) {
    const mapping: PlayerDirection[] = ['top', 'top', 'left', 'right']
    return mapping[otherIndex]
  }

  const otherPlayersCount = total - 1
  const topCount = Math.ceil(otherPlayersCount / 3)
  const leftCount = Math.floor((otherPlayersCount - topCount) / 2)

  if (otherIndex < topCount) {
    return 'top'
  }

  if (otherIndex < topCount + leftCount) {
    return 'left'
  }

  return 'right'
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const getPlayerTargetPoint = (
  index: number,
  total: number,
  width: number,
  height: number,
  isMobile: boolean
): Point2D => {
  const safeWidth = width || 1
  const safeHeight = height || 1
  const padding = getPadding(isMobile)
  const { halfWidth, halfHeight } = getBadgeDimensions(isMobile)

  if (index === 0) {
    return {
      x: safeWidth / 2,
      y: safeHeight - (isMobile ? 110 : 140),
    }
  }

  const otherIndex = index - 1

  const topY = padding + halfHeight
  const centerY = safeHeight / 2
  const leftX = padding + halfWidth
  const rightX = safeWidth - padding - halfWidth

  if (total === 2) {
    return { x: safeWidth / 2, y: topY }
  }

  if (total === 3) {
    const ratios = [0.35, 0.65]
    return { x: safeWidth * ratios[otherIndex], y: topY }
  }

  if (total === 4) {
    const mapping = [
      { x: safeWidth * 0.5, y: topY },
      { x: leftX, y: centerY },
      { x: rightX, y: centerY },
    ]
    return mapping[otherIndex]
  }

  if (total === 5) {
    const mapping = [
      { x: safeWidth * 0.33, y: topY },
      { x: safeWidth * 0.67, y: topY },
      { x: leftX, y: centerY },
      { x: rightX, y: centerY },
    ]
    return mapping[otherIndex]
  }

  const otherPlayersCount = total - 1
  const topCount = Math.ceil(otherPlayersCount / 3)
  const leftCount = Math.floor((otherPlayersCount - topCount) / 2)
  const rightCount = Math.max(otherPlayersCount - topCount - leftCount, 0)

  if (otherIndex < topCount) {
    const spacing = safeWidth / Math.max(topCount + 1, 2)
    const x = spacing * (otherIndex + 1)
    return { x: clamp(x, halfWidth, safeWidth - halfWidth), y: topY }
  }

  if (otherIndex < topCount + leftCount) {
    const leftIndex = otherIndex - topCount
    const spacing = safeHeight / Math.max(leftCount + 1, 2)
    const y = spacing * (leftIndex + 1)
    return { x: leftX, y: clamp(y, halfHeight, safeHeight - halfHeight) }
  }

  const rightIndex = otherIndex - topCount - leftCount
  const spacing = safeHeight / Math.max(rightCount + 1, 2)
  const y = spacing * (rightIndex + 1)
  return { x: rightX, y: clamp(y, halfHeight, safeHeight - halfHeight) }
}

export const getTrumpTargetPoint = (
  width: number,
  height: number,
  isMobile: boolean
): Point2D => {
  const safeWidth = width || 1
  const safeHeight = height || 1
  const cardWidth = isMobile ? 90 : 120
  const cardHeight = isMobile ? 126 : 168
  const halfCardWidth = cardWidth / 2
  const halfCardHeight = cardHeight / 2
  const margin = isMobile ? 6 : 10

  return {
    x: clamp(safeWidth - margin - halfCardWidth, halfCardWidth, safeWidth - halfCardWidth),
    y: clamp(safeHeight - margin - halfCardHeight, halfCardHeight, safeHeight - halfCardHeight),
  }
}
