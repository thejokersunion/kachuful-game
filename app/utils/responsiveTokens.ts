import type { SpaceTokens, SizeTokens } from 'tamagui'

/**
 * Responsive token system for consistent sizing across devices
 * Use these utilities to make any component responsive
 */

/**
 * Get responsive spacing token based on size variant and screen type
 * @param size - xs, sm, md, lg variant
 * @param deviceType - mobile, tablet, desktop
 */
export function getResponsiveSpace(
  size: 'xs' | 'sm' | 'md' | 'lg',
  deviceType: 'mobile' | 'tablet' | 'desktop'
): SpaceTokens {
  const spacingMap: Record<string, Record<string, SpaceTokens>> = {
    xs: { mobile: '$1', tablet: '$2', desktop: '$3' },
    sm: { mobile: '$2', tablet: '$3', desktop: '$4' },
    md: { mobile: '$3', tablet: '$4', desktop: '$5' },
    lg: { mobile: '$4', tablet: '$5', desktop: '$6' },
  }
  return spacingMap[size][deviceType]
}

/**
 * Get responsive font size token based on variant and screen type
 */
export function getResponsiveFontSize(
  variant: 'caption' | 'body' | 'subtitle' | 'title' | 'heading' | 'hero',
  deviceType: 'mobile' | 'tablet' | 'desktop'
): SizeTokens {
  const fontSizeMap: Record<string, Record<string, SizeTokens>> = {
    caption: { mobile: '$2', tablet: '$3', desktop: '$4' },
    body: { mobile: '$3', tablet: '$4', desktop: '$5' },
    subtitle: { mobile: '$4', tablet: '$5', desktop: '$6' },
    title: { mobile: '$5', tablet: '$6', desktop: '$7' },
    heading: { mobile: '$6', tablet: '$7', desktop: '$8' },
    hero: { mobile: '$8', tablet: '$9', desktop: '$10' },
  }
  return fontSizeMap[variant][deviceType]
}

/**
 * Get responsive icon size based on variant and screen type
 */
export function getResponsiveIconSize(
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  deviceType: 'mobile' | 'tablet' | 'desktop'
): number {
  const iconSizeMap: Record<string, Record<string, number>> = {
    xs: { mobile: 16, tablet: 18, desktop: 20 },
    sm: { mobile: 18, tablet: 20, desktop: 24 },
    md: { mobile: 24, tablet: 28, desktop: 32 },
    lg: { mobile: 32, tablet: 36, desktop: 42 },
    xl: { mobile: 48, tablet: 56, desktop: 64 },
  }
  return iconSizeMap[size][deviceType]
}

/**
 * Responsive prop builder - creates a props object with responsive values
 */
export function responsiveProps<T extends Record<string, unknown>>(
  mobileProps: T,
  tabletProps?: Partial<T>,
  desktopProps?: Partial<T>
) {
  return {
    mobile: mobileProps,
    tablet: { ...mobileProps, ...tabletProps },
    desktop: { ...mobileProps, ...tabletProps, ...desktopProps },
  }
}

/**
 * Common responsive presets for quick usage
 */
export const ResponsivePresets = {
  // Card padding
  cardPadding: {
    mobile: '$3' as SpaceTokens,
    tablet: '$4' as SpaceTokens,
    desktop: '$5' as SpaceTokens,
  },
  // Section gap
  sectionGap: {
    mobile: '$2' as SpaceTokens,
    tablet: '$3' as SpaceTokens,
    desktop: '$4' as SpaceTokens,
  },
  // Container padding
  containerPadding: {
    mobile: '$3' as SpaceTokens,
    tablet: '$4' as SpaceTokens,
    desktop: '$6' as SpaceTokens,
  },
  // Gaming card action sizes
  iconSizes: {
    header: { mobile: 18, tablet: 20, desktop: 24 },
    card: { mobile: 24, tablet: 28, desktop: 32 },
    hero: { mobile: 32, tablet: 42, desktop: 56 },
  },
} as const
