# Copilot Instructions for Expo + Tamagui Template

## Project Overview
React Native app using Expo Router for file-based navigation and Tamagui for cross-platform UI. React 19, React Native 0.81, Expo SDK 54. All code lives in `/app` directory.

**Full-Stack Game Project**: Card Masters multiplayer game with:
- **Frontend**: Expo + Tamagui app in `/app`
- **Backend**: PartyKit WebSocket server in `/partykit`
- **Real-time Communication**: WebSocket-based multiplayer with shared types

**Gaming Theme**: Custom psychological color palette designed for card game apps with elegant purples, emerald greens, and gold accents to create an addictive, premium experience.

## 📚 Specialized Agent Guides

For specific development tasks, refer to these specialized guides:

- **Backend/Server Development** → `.github/agents/partykit-server.md`
- **Client-Server Integration** → `.github/agents/game-integration.md`
- **Type Safety & Shared Types** → `.github/agents/type-safety.md`
- **End-to-End Testing** → `.github/agents/testing-e2e.md`
- **Deployment** → `.github/agents/deployment.md`
- **Quick Reference** → `.github/agents/quick-reference.md`
- **Agent Overview** → `.github/agents/README.md`

**When to use them:**
- Modifying server logic → Use `partykit-server.md`
- Adding WebSocket communication → Use `game-integration.md`
- Updating game types → Use `type-safety.md`
- Writing multiplayer tests → Use `testing-e2e.md`
- Deploying to production → Use `deployment.md`

## Development Philosophy - Game Frontend Developer Mindset

**Think like a game UI/UX developer**: Every component should feel responsive, rewarding, and visually engaging. Prioritize user experience, smooth animations, and psychological feedback.

### Component Development Workflow (MANDATORY)
Follow this cycle for EVERY requirement:

1. **Plan & Break Down** - Create tasks by breaking requirements into small, atomic changes
2. **Research Existing** - Check existing implementation, try to extend rather than replace
3. **Minimal Changes** - Make as few changes as required, preserve working code
4. **Compile Check** - Run TypeScript/Biome checks for errors
5. **Server Validation** - Check if dev server is running, restart if needed
6. **Test Validation** - Write and run test cases for new functionality
7. **Document** - Document changes for each requirement clearly

**Example workflow:**
```bash
# 1. Check existing implementation
grep -r "ComponentName" app/

# 2. Make minimal changes to code

# 3. Check for compile errors
yarn tsc --noEmit

# 4. Restart dev server
# Kill existing server, then:
yarn start

# 5. Write and run tests
# Create __tests__/feature.test.tsx
yarn test:run

# 6. Document in commit or PR
```

**Never skip these steps** - This ensures stability, maintainability, and prevents breaking changes.

## Architecture

### Key Files & Structure
- `app/app/` - File-based routing (Expo Router)
  - `(tabs)/` - Tab navigator group with `index.tsx` and `two.tsx`
  - `_layout.tsx` - Root layout with navigation setup, font loading, theme provider
  - `modal.tsx` - Modal screen example
  - `+not-found.tsx` - 404 handler
- `app/components/` - Shared components
  - `Provider.tsx` - Tamagui + Toast provider wrapper
  - `CurrentToast.tsx` - Toast notification component
- `app/tamagui.config.ts` - **Custom gaming theme configuration** with psychological color palette
- `app/metro.config.js` - Metro bundler with Tamagui plugin configured
- `app/types/game.ts` - Game type definitions (mirrored in `partykit/src/types.ts`)
- `app/utils/gameClient.ts` - WebSocket client for multiplayer

### Multiplayer Architecture

**PartyKit Server** (`/partykit`):
- Real-time WebSocket server for multiplayer game rooms
- Lobby system with 6-digit alphanumeric codes (ABC123)
- Host controls (start game, kick players)
- Auto-cleanup on empty rooms, host migration
- Game state management and turn-based gameplay

**Client Integration** (`/app`):
- `GameClient` class in `utils/gameClient.ts` wraps PartySocket
- `useGameClient()` hook for React components
- Event-driven architecture with typed messages
- Real-time state synchronization

**Communication Flow**:
```typescript
// Client sends message
client.createLobby('Alice', 4, '👑')
// → Server receives, processes, broadcasts
// → All clients receive game_state update
on('game_state', (state) => setGameState(state))
```

**Type Safety**: All messages are strongly typed. Types are duplicated in:
- `partykit/src/types.ts` (server)
- `app/types/game.ts` (client)

**Always sync these files when modifying types!**

### Navigation
- Uses Expo Router (file-based routing)
- Typed routes enabled (`experiments.typedRoutes: true` in `app.json`)
- Tab navigation configured in `app/(tabs)/_layout.tsx`
- React Navigation theming integrated with Tamagui themes

### Theme System - Gaming Colors
**Custom psychological palette designed for engagement:**
- **Primary (Royal Purple)**: `#6B46C1` light, `#8B5CF6` dark - Evokes luxury, mystery, premium feel
- **Secondary (Emerald Green)**: `#10B981` light, `#34D399` dark - Success, winning, growth
- **Accent (Gold)**: `#F59E0B` light, `#FBBF24` dark - Rewards, achievement, exclusivity
- **Error (Crimson)**: `#DC2626` light, `#F87171` dark - Excitement without aggression
- **Info (Electric Blue)**: `#3B82F6` light, `#60A5FA` dark - Trust, focus, calm confidence
- **Backgrounds**: Pearl (`#F1F5F9`) light, Deep Slate (`#0F172A`) dark - Elegant neutrals

**Theme Configuration**: `tamagui.config.ts` extends `defaultConfig` from `@tamagui/config/v4` with custom gaming themes
- Provider in `components/Provider.tsx` wraps entire app
- Auto-detects system color scheme (`useColorScheme()`)
- Access theme: `const theme = useTheme()` then `theme.primary.val`

## Development Workflow

### Commands (Yarn 4.5.0)
```bash
yarn start           # Start dev server with cache clear
yarn ios             # Run on iOS simulator
yarn android         # Run on Android emulator
yarn web             # Run in browser
yarn test            # Run Vitest in watch mode
yarn test:ui         # Run Vitest with UI interface
yarn test:run        # Run tests once (CI mode)
yarn test:coverage   # Run tests with coverage report
yarn upgrade:tamagui # Update all Tamagui packages
```

### Initial Setup
New architecture enabled for both iOS and Android (`expo-build-properties` plugin in `app.json`)

## Code Conventions

### Responsive Design System (EXTENSIBLE)

**Core Philosophy**: All components should adapt seamlessly across mobile, tablet, and desktop with consistent sizing and spacing.

#### Responsive Hooks (`hooks/useResponsive.tsx`)
```tsx
import { useResponsive, useResponsiveIconSize, useResponsiveFontSize, useResponsiveSpacing } from 'hooks/useResponsive'

const { isMobile, isTablet, isDesktop, width, height, breakpoint } = useResponsive()
const iconSizes = useResponsiveIconSize() // { xs, sm, md, lg, xl }
const fontSizes = useResponsiveFontSize() // { caption, body, subtitle, title, heading, hero }
const spacing = useResponsiveSpacing() // { gap, padding, margin }
```

**Breakpoints**: xs (0), sm (375), md (768), lg (1024), xl (1280), xxl (1536)

#### Responsive Layout Components (`components/ResponsiveContainer.tsx`)
```tsx
import { ResponsiveContainer, ResponsiveGrid, ResponsiveStack, ResponsiveCard } from 'components/ResponsiveContainer'

// Auto-adapts to viewport with 100vh height
<ResponsiveContainer bg="$background">
  {children}
</ResponsiveContainer>

// Switches between vertical/horizontal based on screen size
<ResponsiveStack stackOnMobile={true}>
  {children}
</ResponsiveStack>

// Card with adaptive padding
<ResponsiveCard>
  {children}
</ResponsiveCard>
```

#### Responsive Token System (`utils/responsiveTokens.ts`)
```tsx
import { getResponsiveSpace, getResponsiveFontSize, getResponsiveIconSize, ResponsivePresets } from 'utils/responsiveTokens'

// Get device-specific token
const padding = getResponsiveSpace('md', 'mobile') // Returns '$3'
const fontSize = getResponsiveFontSize('title', 'tablet') // Returns '$6'
const iconSize = getResponsiveIconSize('lg', 'desktop') // Returns 42

// Use presets for consistency
const cardPadding = ResponsivePresets.cardPadding[deviceType]
const iconSize = ResponsivePresets.iconSizes.hero[deviceType]
```

#### Implementation Pattern
```tsx
// ✅ Correct - Responsive component example
import { useResponsive, useResponsiveIconSize, useResponsiveFontSize } from 'hooks/useResponsive'

export function MyGameCard() {
  const { isMobile } = useResponsive()
  const iconSizes = useResponsiveIconSize()
  const fontSizes = useResponsiveFontSize()
  
  return (
    <Card 
      p={isMobile ? '$3' : '$4'}
      gap={isMobile ? '$2' : '$3'}
    >
      <Crown size={iconSizes.md} />
      <H3 fontSize={fontSizes.title}>Title</H3>
      <Paragraph fontSize={fontSizes.caption}>Description</Paragraph>
    </Card>
  )
}

// ❌ Avoid - Hard-coded sizes
<Card p="$3">
  <Crown size={24} />
  <H3 fontSize="$5">Title</H3>
</Card>
```

### Component Patterns
**Always use Tamagui components over React Native primitives:**
```tsx
// ✅ Correct - Gaming theme example
<Card elevate bordered bg="$primary" pressStyle={{ scale: 0.98 }}>
  <Card.Header padded>
    <H3 color="$pearl">Quick Match</H3>
    <Paragraph color="$pearl" opacity={0.9}>
      Jump into a game
    </Paragraph>
  </Card.Header>
</Card>

// ❌ Avoid
<View style={{ backgroundColor: '#6B46C1' }}>
  <Text style={{ color: 'white' }}>Quick Match</Text>
</View>
```

### Token-Based Styling with Gaming Theme
- **Spacing**: `$1`, `$2`, `$4`, `$8`, etc.
- **Gaming Colors**: `$primary`, `$secondary`, `$accent`, `$success`, `$warning`, `$error`, `$info`
- **Neutrals**: `$background`, `$color`, `$borderColor`, `$pearl`, `$charcoal`, `$silver`
- **Font sizes**: `$1` through `$10`
- **Interactions**: `pressStyle={{ scale: 0.98 }}`, `animation="bouncy"` for satisfying feedback
- See `app/app/(tabs)/index.tsx` for Card Masters gaming UI examples

### Layout Components
- `YStack` - Vertical flex container
- `XStack` - Horizontal flex container
- `Card` - Gaming-themed card component with `elevate`, `bordered` props
- Built-in props: `items` (alignItems), `justify` (justifyContent), `flex`, `gap`, `px`/`py` (padding)

### Navigation
Use `expo-router` APIs with themed navigation:
```tsx
import { Link, Stack, Tabs } from 'expo-router'
import { useTheme } from 'tamagui'

const theme = useTheme()
// Tab bar uses theme.primary.val for active tint color
```

### Theme Access
```tsx
import { useTheme } from 'tamagui'

const theme = useTheme()
// Gaming theme tokens:
// theme.primary.val, theme.secondary.val, theme.accent.val
// theme.background.val, theme.color.val, theme.borderColor.val
```

### Toast Notifications
Uses `@tamagui/toast` with `burnt` for native toasts (requires dev build for native):
```tsx
import { ToastControl } from 'components/CurrentToast'
// See implementation in app/components/CurrentToast.tsx
```

## TypeScript Setup
- Strict mode enabled in `tsconfig.json`
- Base config in `tsconfig.base.json`
- Type augmentation for Tamagui config in `tamagui.config.ts`
- Expo Router generates typed routes automatically

## Testing with Vitest
- **Test runner**: Vitest with jsdom environment
- **Testing library**: React Native Testing Library
- **Configuration**: `vitest.config.ts` with React Native web aliases
- **Setup**: `vitest.setup.ts` with global cleanup
- **Location**: Tests in `__tests__/` directory or co-located as `*.test.tsx`
- **Example**: See `__tests__/example.test.tsx` for Tamagui component testing

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { Provider } from 'components/Provider'

describe('Component', () => {
  it('renders with theme', () => {
    render(
      <Provider>
        <YourComponent />
      </Provider>
    )
    expect(screen.getByTestId('id')).toBeTruthy()
  })
})
```

## Tooling

### Biome (Linter)
- Configured in `biome.json`
- `noConsoleLog` is an error - remove before committing
- Many rules relaxed for rapid prototyping

### Metro + Tamagui Plugin
- CSS generation for web: `tamagui-web.css`
- Import optimization enabled
- `.mjs` extension supported

## Important Patterns

### Root Layout Pattern
Font loading with splash screen management in `app/_layout.tsx`:
```tsx
const [interLoaded, interError] = useFonts({ Inter: require('...') })
useEffect(() => {
  if (interLoaded || interError) SplashScreen.hideAsync()
}, [interLoaded, interError])
```

### Provider Setup
All providers in `components/Provider.tsx`:
- TamaguiProvider with custom gaming config and auto color scheme detection
- ToastProvider with viewport

### Gaming UI Patterns (see `app/(tabs)/index.tsx`)
```tsx
// Action cards with press feedback
<Card bg="$primary" pressStyle={{ scale: 0.98 }} animation="bouncy">
  <Card.Header padded>
    <XStack items="center" gap="$3">
      <Icon size={32} color="$pearl" />
      <YStack flex={1}>
        <H3 color="$pearl">Title</H3>
        <Paragraph color="$pearl" opacity={0.9}>Description</Paragraph>
      </YStack>
    </XStack>
  </Card.Header>
</Card>

// Stats display
<Card elevate bordered bg="$backgroundStrong">
  <Card.Header padded items="center">
    <H1 color="$primary" fontWeight="bold">1,247</H1>
    <Paragraph color="$colorHover">Wins</Paragraph>
  </Card.Header>
</Card>
```

### Multiplayer Patterns

**WebSocket Client Usage**:
```tsx
import { useGameClient } from 'utils/gameClient'
import type { GameState, Player } from 'types/game'

function MultiplayerLobby() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const { isConnected, createLobby, joinLobby, on, off } = useGameClient(
    process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999',
    'ABC123'
  )
  
  // Subscribe to game state updates
  useEffect(() => {
    const handleGameState = (state: GameState) => {
      setGameState(state)
    }
    
    const handleError = (error: { message: string }) => {
      toast.show({ title: 'Error', message: error.message, preset: 'error' })
    }
    
    on('game_state', handleGameState)
    on('error', handleError)
    
    return () => {
      off('game_state', handleGameState)
      off('error', handleError)
    }
  }, [on, off])
  
  const handleCreate = () => {
    createLobby('PlayerName', 4, '👑')
  }
  
  const handleJoin = (code: string) => {
    joinLobby(code, 'PlayerName', '🎮')
  }
  
  return (
    <YStack gap="$4">
      {/* Connection status */}
      <XStack gap="$2" items="center">
        <Circle size={8} bg={isConnected ? '$secondary' : '$error'} />
        <Paragraph>{isConnected ? 'Connected' : 'Disconnected'}</Paragraph>
      </XStack>
      
      {/* Lobby UI */}
      {gameState && (
        <YStack gap="$3">
          <H3>Lobby: {gameState.lobbyCode}</H3>
          {gameState.players.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </YStack>
      )}
    </YStack>
  )
}
```

**Event Handling Pattern**:
```tsx
// Always clean up subscriptions
useEffect(() => {
  const handler = (data) => { /* handle event */ }
  on('event_name', handler)
  return () => off('event_name', handler)
}, [on, off])
```

**Type Safety**:
```tsx
// Always import types from types/game.ts
import type { GameState, Player, LobbyInfo } from 'types/game'

// Use explicit types in handlers
on('game_state', (state: GameState) => {
  console.log(state.players.length) // TypeScript knows shape
})
```

### Icons
Use `@tamagui/lucide-icons`:
```tsx
import { Crown, Trophy, Sparkles, Zap } from '@tamagui/lucide-icons'
<Crown size={48} color="$accent" />
```

## Key Dependencies
- `expo@^54.0.23` + `expo-router@~6.0.14`
- `tamagui@^1.138.0` + `@tamagui/config@^1.138.0`
- `react@19.1.0` + `react-native@0.81.5`
- `react-native-reanimated@~4.1.1` (animations)
- `@tamagui/lucide-icons` (icons)
- `burnt@^0.12.2` (native toasts)
- `partysocket@^1.1.6` (WebSocket client for multiplayer)

**Backend** (PartyKit):
- `partykit@^0.0.111` (WebSocket server framework)

## Design Philosophy
- **Psychological engagement**: Colors chosen to trigger dopamine (purples for luxury, greens for wins, gold for rewards)
- **Dark mode optimization**: Brighter, more vibrant colors in dark mode for stronger visual impact
- **Press feedback**: All interactive elements have `pressStyle` with subtle scale transforms
- **Card-centric UI**: Gaming feel with elevated, bordered cards for all content
- **Achievement focus**: Stats, ranks, and progress displays prominent throughout
- **Real-time multiplayer**: WebSocket-based communication for instant feedback and synchronized gameplay
- **Type-safe networking**: Strongly typed messages between client and server for reliability

## Development Workflow for Multiplayer Features

### Starting Both Servers

```bash
# Terminal 1: Start PartyKit server
cd partykit
yarn dev  # Runs on http://localhost:1999

# Terminal 2: Start Expo app
cd app
yarn start
# Press 'w' for web, 'i' for iOS, 'a' for Android
```

### Modifying Game Types

When adding new message types or updating game state:

1. **Update server types**: `partykit/src/types.ts`
2. **Mirror to client**: `app/types/game.ts`
3. **Update server handlers**: `partykit/src/server.ts`
4. **Update client methods**: `app/utils/gameClient.ts`
5. **Type check both**: `npx tsc --noEmit` in both directories
6. **Test end-to-end**: Run both servers and test the feature

### Testing Multiplayer

```bash
# Run multiple clients
# Device 1: yarn start (press 'w')
# Device 2: yarn start --port 8082 (press 'w')
# Or test on iOS/Android simulators simultaneously
```

## Critical Rules for Multiplayer Development

1. **Always sync types**: When modifying `partykit/src/types.ts`, immediately update `app/types/game.ts`
2. **Validate on server**: Never trust client input, always validate server-side
3. **Broadcast state**: Always call `broadcastGameState()` after mutating server state
4. **Clean up subscriptions**: Always use cleanup functions in `useEffect` for event listeners
5. **Handle errors**: Always subscribe to 'error' events from GameClient
6. **Check connection**: Verify `isConnected` before sending messages
7. **Test with multiple clients**: Always test multiplayer features with at least 2 clients
