import { YStack, type YStackProps } from 'tamagui'
import { useResponsive } from '../hooks/useResponsive'

/**
 * Responsive container that adapts to viewport
 * Automatically applies 100vh height and flex layout
 */
export function ResponsiveContainer({
  children,
  disableHeight,
  ...props
}: YStackProps & { disableHeight?: boolean }) {
  return (
    <YStack
      flex={1}
      height={disableHeight ? undefined : '100vh'}
      width="100%"
      overflow="hidden"
      {...props}
    >
      {children}
    </YStack>
  )
}

/**
 * Responsive grid layout that adapts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  ...props
}: YStackProps) {
  return (
    <YStack
      flexDirection="row"
      flexWrap="wrap"
      gap="$2"
      {...props}
    >
      {children}
    </YStack>
  )
}

/**
 * Responsive stack that switches between YStack (vertical) and XStack (horizontal)
 * based on screen size
 */
export function ResponsiveStack({
  children,
  stackOnMobile = true,
  ...props
}: YStackProps & { stackOnMobile?: boolean }) {
  const { isMobile } = useResponsive()
  const shouldStack = stackOnMobile ? isMobile : !isMobile

  return (
    <YStack
      flexDirection={shouldStack ? 'column' : 'row'}
      {...props}
    >
      {children}
    </YStack>
  )
}

/**
 * Responsive card wrapper with adaptive padding and sizing
 */
export function ResponsiveCard({
  children,
  ...props
}: YStackProps) {
  const { isMobile } = useResponsive()

  return (
    <YStack
      flex={1}
      p={isMobile ? '$3' : '$4'}
      {...props}
    >
      {children}
    </YStack>
  )
}
