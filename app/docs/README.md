# Kachuful Card Game - Developer Quick Start Guide

## 📚 Documentation Index

This project includes comprehensive documentation for the Kachuful (Judgement) card game. Start here to understand the complete system.

**IMPORTANT**: This project builds on existing multiplayer infrastructure. The lobby system, WebSocket client, responsive design, and gaming theme are already implemented and ready to use.

---

## ✅ What's Already Built (Phase 0 Complete)

### Existing Infrastructure You Can Use Immediately

**Lobby System** (`app/app/index.tsx`):
- ✅ Create/Join lobby UI
- ✅ Player list with kick functionality
- ✅ Lobby code generation and sharing
- ✅ Deep linking support
- ✅ Connection status indicators

**Network Layer** (`utils/gameClient.ts`):
- ✅ `GameClient` class for WebSocket management
- ✅ `useGameClient` React hook
- ✅ Event subscription system (on/off)
- ✅ Automatic reconnection handling
- ✅ Message serialization

**Type System** (`types/game.ts`):
- ✅ Base types: `Player`, `GameState`, `LobbyInfo`
- ✅ Message types: `ClientMessage`, `ServerMessage`
- ✅ Status enums: `GameStatus`, `PlayerStatus`

**UI Components**:
- ✅ `GameHeader` - Header with navigation
- ✅ `ResponsiveContainer` - Auto-adapts to viewport
- ✅ Responsive utilities (`useResponsive` hook)
- ✅ Gaming theme (royal purple, emerald, gold)

**Server** (`partykit/`):
- ✅ PartyKit server infrastructure
- ✅ Room management
- ✅ WebSocket broadcasting
- ✅ Lobby system handlers

**Testing**:
- ✅ Vitest configuration
- ✅ React Native Testing Library
- ✅ Example tests

---

## 📖 Documentation Files

### 1. **KACHUFUL_GAME_RULES.md**
**Purpose**: Complete game rules and mechanics

**Contents**:
- Game overview and objective
- Setup instructions (3-7 players)
- Detailed rules (trump, following suit, bidding)
- Complete scoring system
- Strategy tips
- Game variations

**Read this to**: Understand how the game works

---

### 2. **KACHUFUL_UI_DESIGN.md**
**Purpose**: UI/UX specifications and screen mockups

**Contents**:
- All screen layouts (10 screens)
- Component specifications
- Responsive design system
- Color scheme (gaming theme)
- Animations and transitions
- Accessibility features

**Read this to**: Design and implement the user interface

---

### 3. **KACHUFUL_VISUAL_SCREENS.md**
**Purpose**: ASCII mockups of all screens

**Contents**:
- Complete screen flow diagram
- Detailed ASCII art mockups for each screen
- Card design specifications
- Interaction patterns
- Visual feedback examples

**Read this to**: Visualize the complete user journey

---

### 4. **KACHUFUL_IMPLEMENTATION_ROADMAP.md**
**Purpose**: Technical architecture and development plan

**Contents**:
- System architecture
- Complete type definitions
- Game logic functions
- API/Message protocol
- File structure
- 8-phase implementation plan
- Testing strategy
- Deployment plan

**Read this to**: Build the game technically

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn 4.5.0
- Expo CLI
- React Native development environment
- Basic understanding of TypeScript and React

### Current Tech Stack

```
Frontend:
- React Native 0.81.5
- Expo SDK 54
- Tamagui 1.138.0 (UI components)
- Expo Router (file-based routing)

Backend:
- PartyKit (multiplayer server)
- WebSocket (real-time communication)

Testing:
- Vitest (unit tests)
- React Native Testing Library
```

---

## 📋 Implementation Checklist

### Phase 0: Infrastructure ✅ COMPLETE
- [x] Set up React Native + Expo
- [x] Configure Tamagui with gaming theme
- [x] Set up PartyKit server
- [x] Implement WebSocket client (`GameClient`)
- [x] Create base types (`Player`, `GameState`)
- [x] Build lobby system (create/join/leave)
- [x] Add responsive design utilities
- [x] Configure testing infrastructure

### Phase 1: Foundation ⬜ NEXT
- [ ] Create `types/kachuful.ts` (extend existing types)
- [ ] Implement `utils/kachuful/cardUtils.ts`
- [ ] Implement `utils/kachuful/constants.ts`
- [ ] Build `components/kachuful/Card.tsx`
- [ ] Build `components/kachuful/CardHand.tsx`
- [ ] Create `hooks/useKachufulClient.ts` (extend useGameClient)
- [ ] Write tests for card utilities

### Phase 2: Lobby Integration ⬜
- [ ] Modify `app/index.tsx` to add game mode selector
- [ ] Add Kachuful settings UI (rounds, scoring)
- [ ] Update `types/game.ts` with Kachuful messages
- [ ] Add routing to Kachuful screens
- [ ] Test lobby with Kachuful mode

### Phase 3: Game Screens ⬜
- [ ] `screens/kachuful/RoundStartScreen.tsx`
- [ ] `screens/kachuful/TrumpRevealScreen.tsx`
- [ ] `screens/kachuful/BiddingScreen.tsx`
- [ ] `screens/kachuful/TrickPlayingScreen.tsx`
- [ ] `screens/kachuful/TrickResultScreen.tsx`
- [ ] `screens/kachuful/RoundScoringScreen.tsx`
- [ ] `screens/kachuful/ScoreboardScreen.tsx`
- [ ] `screens/kachuful/GameEndScreen.tsx`

### Phase 4: Game Logic ⬜
- [ ] Deck management (create, shuffle, deal)
- [ ] Trump selection
- [ ] Bidding validation (including dealer restriction)
- [ ] Card playability (follow suit rules)
- [ ] Trick winner determination
- [ ] Scoring calculations
- [ ] Round progression
- [ ] Write comprehensive tests

### Phase 5: Server Integration ⬜
- [ ] Create `partykit/src/kachuful/KachufulRoom.ts`
- [ ] Implement Kachuful message handlers
- [ ] Game state broadcasting
- [ ] Turn management
- [ ] Error handling
- [ ] Test multiplayer sync

### Phase 6: Polish ⬜
- [ ] Card dealing animation
- [ ] Trump reveal flip
- [ ] Bid placement animation
- [ ] Card play animation
- [ ] Trick winner animation
- [ ] Score counting animation
- [ ] Sound effects (optional)

### Phase 7: Advanced Features ⬜
- [ ] Tutorial/help screen
- [ ] Game statistics
- [ ] Reconnection (leverage existing)
- [ ] Settings screen

### Phase 8: Testing ⬜
- [ ] Integration tests
- [ ] Multiplayer stress testing
- [ ] Performance optimization
- [ ] Cross-platform testing
- [ ] Bug fixes

---

## 🎮 Game Rules Quick Reference

### Basic Flow
1. Deal cards (1 to max based on player count)
2. Reveal trump suit (or no trump)
3. Players bid on tricks they'll win (dealer can't make total = available)
4. Play tricks (must follow suit if possible)
5. Score: Made bid = 10 + (bid × 5), Failed = -(difference × 5)
6. Repeat for all rounds

### Key Rules
- **Trump beats everything**: Even a low trump beats high non-trump
- **Follow suit**: Must play same suit as led if you have it
- **Dealer restriction**: Last bidder can't make total bids = tricks available
- **Exact bids**: Must win exactly what you bid, no more, no less

---

## 🎨 UI Theme (Gaming Colors)

```typescript
// Already configured in tamagui.config.ts
Primary: Royal Purple (#6B46C1)    // Luxury, premium feel
Secondary: Emerald Green (#10B981) // Success, winning
Accent: Gold (#F59E0B)             // Rewards, achievements
Error: Crimson (#DC2626)           // Excitement, penalties
Info: Electric Blue (#3B82F6)      // Trust, focus

// Card colors
Red Suits (♥️♦️): #DC2626
Black Suits (♠️♣️): #0F172A
```

---

## 🛠️ File Structure

### Where to Add Code

```
app/
├── components/
│   └── kachuful/              ← NEW: All Kachuful UI components
│       ├── Card.tsx
│       ├── CardHand.tsx
│       ├── TrickDisplay.tsx
│       ├── BiddingInterface.tsx
│       └── ...
│
├── screens/
│   └── kachuful/              ← NEW: All game screens
│       ├── BiddingScreen.tsx
│       ├── TrickPlayingScreen.tsx
│       └── ...
│
├── utils/
│   └── kachuful/              ← NEW: Game logic
│       ├── gameLogic.ts
│       ├── cardUtils.ts
│       ├── scoringUtils.ts
│       └── validationUtils.ts
│
├── types/
│   └── kachuful.ts            ← NEW: Type definitions
│
├── hooks/
│   └── useKachufulGame.ts     ← NEW: Game state hook
│
└── app/
    └── (tabs)/
        └── kachuful.tsx       ← NEW: Entry point
```

### Existing Infrastructure (Don't Recreate)

```
✅ Already Exists - Use These:
- Lobby system (app/app/index.tsx)
- Game client (utils/gameClient.ts)
- Responsive hooks (hooks/useResponsive.tsx)
- Gaming theme (tamagui.config.ts)
- PartyKit server (partykit/)
```

---

## 🧪 Testing Commands

```bash
# Run all tests
yarn test:run

# Run tests in watch mode
yarn test

# Run tests with UI
yarn test:ui

# Run with coverage
yarn test:coverage

# Start dev server
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android

# Run on Web
yarn web
```

---

## 📝 Code Style Guidelines

### Component Pattern

```typescript
import { Card, H3, Paragraph, XStack, YStack } from 'tamagui'
import { useResponsive, useResponsiveIconSize } from 'hooks/useResponsive'

export function MyKachufulComponent() {
  const { isMobile } = useResponsive()
  const iconSizes = useResponsiveIconSize()
  
  return (
    <Card elevate bordered p={isMobile ? '$3' : '$4'}>
      <YStack gap="$3">
        <H3 color="$primary">Title</H3>
        <Paragraph>Content</Paragraph>
      </YStack>
    </Card>
  )
}
```

### Game Logic Pattern

```typescript
export interface Card {
  suit: Suit
  rank: Rank
  id: string
}

export function determineTrickWinner(
  cardsPlayed: PlayedCard[],
  ledSuit: Suit,
  trumpSuit: Suit | null
): string {
  // 1. Check for trump cards
  // 2. If no trump, check led suit
  // 3. Return winner ID
}
```

### Test Pattern

```typescript
import { describe, it, expect } from 'vitest'

describe('Kachuful Game Logic', () => {
  describe('determineTrickWinner', () => {
    it('trump card beats non-trump', () => {
      const winner = determineTrickWinner(...)
      expect(winner).toBe('player2')
    })
  })
})
```

---

## 🎯 Development Workflow

### 1. Start with Documentation
Read all 4 docs to understand the complete system

### 2. Set Up Types
Define all TypeScript interfaces first

### 3. Build Components (UI)
Create visual components with mock data

### 4. Implement Logic (Pure Functions)
Write and test game rules separately

### 5. Connect to Server
Integrate client and server

### 6. Add Animations
Polish with transitions and effects

### 7. Test Everything
Unit, integration, and manual testing

---

## 🐛 Common Issues & Solutions

### Issue: Tests Failing
**Solution**: Some existing tests fail - ignore unrelated failures

### Issue: WebSocket Not Connecting
**Solution**: Ensure PartyKit server is running, check `EXPO_PUBLIC_PARTYKIT_HOST`

### Issue: Cards Not Displaying
**Solution**: Check that Card component handles all suits and ranks

### Issue: Bidding Validation Errors
**Solution**: Verify dealer restriction logic carefully

### Issue: Trick Winner Wrong
**Solution**: Review trump > led suit > other suits priority

---

## 📊 Progress Tracking

Mark your progress through the implementation:

```
Foundation:     ░░░░░░░░░░  0%
Lobby:          ░░░░░░░░░░  0%
Screens:        ░░░░░░░░░░  0%
Logic:          ░░░░░░░░░░  0%
Server:         ░░░░░░░░░░  0%
Polish:         ░░░░░░░░░░  0%
Advanced:       ░░░░░░░░░░  0%
Testing:        ░░░░░░░░░░  0%

Overall:        ░░░░░░░░░░  0%
```

Update as you complete each phase!

---

## 🤝 Contributing

### Commit Message Format
```
feat: Add Card component with suit and rank display
fix: Correct trick winner logic for trump cards
test: Add tests for scoring calculations
docs: Update game rules with examples
style: Improve card animation smoothness
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Testing

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Cross-platform verified

## Screenshots
(if UI changes)
```

---

## 📞 Support & Resources

### Documentation
- Read all 4 docs in `/app/docs/`
- Check inline code comments
- Review existing components as examples

### Code References
- Existing lobby: `app/app/index.tsx`
- Game types: `app/types/game.ts`
- Responsive components: `app/components/ResponsiveContainer.tsx`
- Theme config: `app/tamagui.config.ts`

### External Resources
- [Tamagui Docs](https://tamagui.dev)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [PartyKit Docs](https://docs.partykit.io)
- [React Native Docs](https://reactnative.dev)

---

## ✅ Definition of Done

A feature is complete when:

- [ ] Code is written and follows style guidelines
- [ ] Unit tests written and passing
- [ ] Manual testing completed
- [ ] Works on mobile, tablet, and desktop
- [ ] Animations smooth at 60 FPS
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No console errors or warnings
- [ ] Accessibility considered

---

## 🎉 Success Criteria

The Kachuful game is ready for release when:

- [ ] All 8 phases completed
- [ ] 3-7 players can play simultaneously
- [ ] All game rules correctly implemented
- [ ] All screens functional and polished
- [ ] Animations smooth and delightful
- [ ] No critical bugs
- [ ] Performance is acceptable (60 FPS)
- [ ] Works on iOS, Android, and Web
- [ ] Multiplayer sync is reliable
- [ ] User feedback is positive

---

## 🚢 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console warnings
- [ ] Performance profiled
- [ ] Cross-platform tested
- [ ] Documentation complete

### Deployment
- [ ] Build optimized bundle
- [ ] Deploy PartyKit server
- [ ] Configure environment variables
- [ ] Set up monitoring
- [ ] Deploy to app stores

### Post-Deployment
- [ ] Monitor error rates
- [ ] Track user engagement
- [ ] Gather feedback
- [ ] Plan improvements

---

## 📅 Estimated Timeline

- **Phase 1 (Foundation)**: 3-4 days
- **Phase 2 (Lobby)**: 2-3 days
- **Phase 3 (Screens)**: 5-7 days
- **Phase 4 (Logic)**: 7-10 days
- **Phase 5 (Server)**: 4-5 days
- **Phase 6 (Polish)**: 4-5 days
- **Phase 7 (Advanced)**: 5-7 days
- **Phase 8 (Testing)**: 5-7 days

**Total**: 5-8 weeks for complete implementation

---

## 🎮 Let's Build!

You now have everything needed to implement the Kachuful card game:

1. ✅ Complete game rules
2. ✅ Detailed UI specifications
3. ✅ Visual screen mockups
4. ✅ Technical architecture
5. ✅ Implementation roadmap
6. ✅ This quick start guide

**Next Steps**:
1. Read `KACHUFUL_GAME_RULES.md` thoroughly
2. Review `KACHUFUL_VISUAL_SCREENS.md` for UI vision
3. Study `KACHUFUL_IMPLEMENTATION_ROADMAP.md` for technical details
4. Start with Phase 1: Create type definitions

Good luck, and have fun building this engaging card game! 🃏🎉

---

**Questions or issues?** Refer back to the documentation or examine existing code patterns in the repository.
