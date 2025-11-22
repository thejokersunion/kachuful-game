import { Moon, Sun } from '@tamagui/lucide-icons'
import { Button, H2, XStack, type FontSizeTokens } from 'tamagui'
import { useAppTheme } from './ThemeContext'
import { useResponsive, useResponsiveIconSize, useResponsiveFontSize } from '../hooks/useResponsive'

export function GameHeader() {
  const { isDark, toggleTheme } = useAppTheme()
  const { isMobile } = useResponsive()
  const iconSizes = useResponsiveIconSize()
  const fontSizes = useResponsiveFontSize()

  return (
    <XStack
      bg="$background"
      px={isMobile ? '$3' : '$4'}
      py={isMobile ? '$2' : '$3'}
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <H2 color="$primary" fontWeight="bold" fontSize={fontSizes.subtitle as FontSizeTokens}>
        Card Masters
      </H2>
      
      <Button
        size={isMobile ? '$2.5' : '$3'}
        circular
        chromeless
        icon={isDark ? <Sun size={iconSizes.sm} color="$accent" /> : <Moon size={iconSizes.sm} color="$primary" />}
        onPress={toggleTheme}
        pressStyle={{ scale: 0.95, opacity: 0.8 }}
        animation="bouncy"
      />
    </XStack>
  )
}
