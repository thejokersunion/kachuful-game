import { Link, Tabs } from 'expo-router'
import { Button, useTheme } from 'tamagui'
import { Atom, AudioWaveform } from '@tamagui/lucide-icons'

export default function TabLayout() {
  const theme = useTheme()
  const palette = {
    primary: theme?.primary?.val ?? '#6B46C1',
    background: theme?.background?.val ?? '#0F172A',
    border: theme?.borderColor?.val ?? '#1F2937',
    text: theme?.color?.val ?? '#F1F5F9',
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
        headerStyle: {
          backgroundColor: palette.background,
          borderBottomColor: palette.border,
        },
        headerTintColor: palette.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tab One',
          tabBarIcon: ({ color }) => <Atom color={color as any} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Button mr="$4" size="$2.5">
                Hello!
              </Button>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Tab Two',
          tabBarIcon: ({ color }) => <AudioWaveform color={color as any} />,
        }}
      />
    </Tabs>
  )
}
