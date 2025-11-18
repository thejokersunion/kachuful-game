import { useWindowDimensions } from 'react-native'
import type { SizeTokens, SpaceTokens } from 'tamagui'

/**
 * Breakpoints for responsive design
 * Follows mobile-first approach
 */
export const BREAKPOINTS = {
  xs: 0, // Mobile portrait
  sm: 375, // Mobile landscape
  md: 768, // Tablet portrait
  lg: 1024, // Tablet landscape / Desktop
  xl: 1280, // Desktop
  xxl: 1536, // Large desktop
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Hook to get current screen dimensions and breakpoint
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions()

  const breakpoint: Breakpoint = (() => {
    if (width >= BREAKPOINTS.xxl) return 'xxl'
    if (width >= BREAKPOINTS.xl) return 'xl'
    if (width >= BREAKPOINTS.lg) return 'lg'
    if (width >= BREAKPOINTS.md) return 'md'
    if (width >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  })()

  const isXs = breakpoint === 'xs'
  const isSm = breakpoint === 'sm'
  const isMd = breakpoint === 'md'
  const isLg = breakpoint === 'lg'
  const isXl = breakpoint === 'xl'
  const isXxl = breakpoint === 'xxl'

  // Utility checks
  const isMobile = isXs || isSm
  const isTablet = isMd || isLg
  const isDesktop = isXl || isXxl
  const isPortrait = height > width
  const isLandscape = width > height

  return {
    width,
    height,
    breakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
  }
}

/**
 * Get responsive value based on breakpoint
 * Returns the appropriate value for current screen size
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const { breakpoint } = useResponsive()

  // Priority order: exact match > fallback to smaller breakpoint
  const breakpointOrder: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs']
  const currentIndex = breakpointOrder.indexOf(breakpoint)

  // Try exact match first, then fall back to smaller breakpoints
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i]
    if (values[bp] !== undefined) {
      return values[bp]
    }
  }

  return undefined
}

/**
 * Responsive spacing scale
 * Returns appropriate spacing token based on screen size
 */
export function useResponsiveSpacing(): {
  gap: { xs: SpaceTokens; sm: SpaceTokens; md: SpaceTokens; lg: SpaceTokens }
  padding: { xs: SpaceTokens; sm: SpaceTokens; md: SpaceTokens; lg: SpaceTokens }
  margin: { xs: SpaceTokens; sm: SpaceTokens; md: SpaceTokens; lg: SpaceTokens }
} {
  const { isMobile, isTablet } = useResponsive()

  return {
    gap: {
      xs: isMobile ? '$1' : isTablet ? '$2' : '$3',
      sm: isMobile ? '$2' : isTablet ? '$3' : '$4',
      md: isMobile ? '$3' : isTablet ? '$4' : '$5',
      lg: isMobile ? '$4' : isTablet ? '$5' : '$6',
    },
    padding: {
      xs: isMobile ? '$2' : isTablet ? '$3' : '$4',
      sm: isMobile ? '$3' : isTablet ? '$4' : '$5',
      md: isMobile ? '$4' : isTablet ? '$5' : '$6',
      lg: isMobile ? '$5' : isTablet ? '$6' : '$7',
    },
    margin: {
      xs: isMobile ? '$1' : isTablet ? '$2' : '$3',
      sm: isMobile ? '$2' : isTablet ? '$3' : '$4',
      md: isMobile ? '$3' : isTablet ? '$4' : '$5',
      lg: isMobile ? '$4' : isTablet ? '$5' : '$6',
    },
  }
}

/**
 * Responsive icon size
 */
export function useResponsiveIconSize(): {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
} {
  const { isMobile, isTablet } = useResponsive()

  if (isMobile) {
    return { xs: 16, sm: 18, md: 24, lg: 32, xl: 48 }
  }
  if (isTablet) {
    return { xs: 18, sm: 20, md: 28, lg: 36, xl: 56 }
  }
  return { xs: 20, sm: 24, md: 32, lg: 42, xl: 64 }
}

/**
 * Responsive font size tokens
 */
export function useResponsiveFontSize(): {
  caption: SizeTokens
  body: SizeTokens
  subtitle: SizeTokens
  title: SizeTokens
  heading: SizeTokens
  hero: SizeTokens
} {
  const { isMobile, isTablet } = useResponsive()

  if (isMobile) {
    return {
      caption: '$2',
      body: '$3',
      subtitle: '$4',
      title: '$5',
      heading: '$6',
      hero: '$8',
    }
  }
  if (isTablet) {
    return {
      caption: '$3',
      body: '$4',
      subtitle: '$5',
      title: '$6',
      heading: '$7',
      hero: '$9',
    }
  }
  return {
    caption: '$4',
    body: '$5',
    subtitle: '$6',
    title: '$7',
    heading: '$8',
    hero: '$10',
  }
}
