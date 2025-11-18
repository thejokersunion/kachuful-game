import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { CurrentToast } from './CurrentToast'
import { config } from '../tamagui.config'
import { ThemeProvider, useAppTheme } from './ThemeContext'

function TamaguiWrapper({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>) {
  const { theme } = useAppTheme()

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={theme}
      {...rest}
    >
      <ToastProvider
        swipeDirection="horizontal"
        duration={6000}
        native={
          [
            // uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go
            // 'mobile'
          ]
        }
      >
        {children}
        <CurrentToast />
        <ToastViewport top="$8" left={0} right={0} />
      </ToastProvider>
    </TamaguiProvider>
  )
}

export function Provider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>) {
  return (
    <ThemeProvider>
      <TamaguiWrapper {...rest}>{children}</TamaguiWrapper>
    </ThemeProvider>
  )
}
