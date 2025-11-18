import { afterEach, vi } from 'vitest'

// Mock react-native modules
vi.mock('react-native', () => ({
  useColorScheme: () => 'light',
  Platform: { OS: 'web', select: (obj: Record<string, unknown>) => obj.web || obj.default },
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
}))

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})
