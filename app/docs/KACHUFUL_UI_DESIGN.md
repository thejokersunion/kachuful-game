# Kachuful Card Game - UI/UX Design Specifications

## Screen Architecture

This document outlines all screens, UI components, and user flows for the Kachuful card game implementation.

---

## 1. Navigation Structure

```
Main Menu (Home)
├── Create Lobby → Lobby Screen
├── Join Lobby → Lobby Screen
└── Settings → Settings Screen

Lobby Screen
├── Start Game → Game Flow
└── Leave → Main Menu

Game Flow (Linear Progression)
├── Round Start Screen
├── Trump Reveal Screen
├── Bidding Screen
├── Trick Playing Screen (repeats per trick)
├── Round Scoring Screen
└── Final Scores Screen → Main Menu
```

---

## 2. Screen Details & Mockups

### 2.1 Main Menu / Home Screen

**Purpose**: Entry point, game selection, player setup

**Layout**:
```
┌─────────────────────────────────────┐
│          [Crown Icon]               │
│         KACHUFUL                    │
│     Judgement Card Game             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   [Play Icon] CREATE LOBBY   │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   [Users Icon] JOIN LOBBY    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   [Book Icon] HOW TO PLAY    │  │
│  └──────────────────────────────┘  │
│                                     │
│         [Settings Icon]             │
└─────────────────────────────────────┘
```

**Components**:
- Title with crown icon (gaming purple)
- Create Lobby button (primary color, large)
- Join Lobby button (secondary color, large)
- How to Play button (info color)
- Settings icon (bottom)

**Interactions**:
- Tap Create → Navigate to Create Lobby
- Tap Join → Navigate to Join Lobby
- Tap How to Play → Show rules modal
- Tap Settings → Show settings modal

---

### 2.2 Lobby Screen (Waiting Room)

**Purpose**: Players gather, see participants, host starts game

**Layout**:
```
┌─────────────────────────────────────┐
│  [Back] LOBBY: ABC-123    [Copy]    │
├─────────────────────────────────────┤
│  ┌─ Lobby Info ──────────────────┐  │
│  │ Code: ABC-123  [Copy]         │  │
│  │ Link: app://...  [Share]      │  │
│  │ Players: 4/7                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ Players ────────────────────┐  │
│  │ 👑 Alice (Host) [YOU]        │  │
│  │ 👤 Bob                        │  │
│  │ 👤 Charlie                    │  │
│  │ 👤 David                      │  │
│  │ [+] Waiting for players...   │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [▶] START GAME              │  │  (Host only)
│  └──────────────────────────────┘  │
│                                     │
│  [LEAVE LOBBY]                     │
└─────────────────────────────────────┘
```

**Components**:
- Header with lobby code and copy button
- Lobby info card (code, link, player count)
- Player list with avatars
  - Crown icon for host
  - "YOU" indicator for current player
  - Kick button for host (on other players)
- Start Game button (host only, enabled at 3+ players)
- Leave Lobby button (bottom, error color)

**States**:
- Waiting (< 3 players): Start button disabled
- Ready (3+ players): Start button enabled
- Starting: Loading spinner on button

**Real-time Updates**:
- Player joins: Add to list with animation
- Player leaves: Remove from list
- Kicked: Return to main menu with message

---

### 2.3 Round Start Screen

**Purpose**: Announce round number, cards to be dealt, prepare players

**Layout**:
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          ┌─────────────┐            │
│          │   ROUND 3   │            │
│          └─────────────┘            │
│                                     │
│         3 Cards per Player          │
│                                     │
│           [Cards Icon]              │
│                                     │
│         Dealing cards...            │
│           ⏳ (animation)            │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Components**:
- Large round number display
- Cards count text
- Dealing animation (cards flying to positions)
- Loading indicator

**Animation**:
- Fade in round number
- Deal cards one-by-one with sound
- Auto-transition to Trump Reveal (2 seconds)

**Duration**: ~3 seconds

---

### 2.4 Trump Reveal Screen

**Purpose**: Dramatically reveal trump suit

**Layout**:
```
┌─────────────────────────────────────┐
│                                     │
│         TRUMP SUIT IS...            │
│                                     │
│        ┌─────────────┐              │
│        │             │              │
│        │     ♠️      │              │
│        │   SPADES    │              │
│        │             │              │
│        └─────────────┘              │
│                                     │
│      All Spades are Trump!          │
│                                     │
│         [Sparkles Icon]             │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Special Case - No Trump**:
```
┌─────────────────────────────────────┐
│                                     │
│         NO TRUMP ROUND!             │
│                                     │
│        ┌─────────────┐              │
│        │             │              │
│        │     ✖️      │              │
│        │  NO TRUMP   │              │
│        │             │              │
│        └─────────────┘              │
│                                     │
│     Highest Card of Led Suit Wins   │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Components**:
- "Trump Suit Is..." header
- Large card showing trump card
- Suit symbol (♠️♥️♣️♦️) with color
- Suit name
- Explanatory text
- Sparkle/glow effects

**Animation**:
- Card flip from back to front
- Glow/pulse effect on reveal
- Sound effect
- Auto-transition to Bidding (2 seconds)

**Duration**: ~3 seconds

---

### 2.5 Bidding Screen

**Purpose**: Players sequentially bid on tricks they'll win

**Layout**:
```
┌─────────────────────────────────────┐
│  Round 3 | Trump: ♠️ | Dealer: Bob  │
├─────────────────────────────────────┤
│  ┌─ Your Hand ──────────────────┐   │
│  │  [A♥] [7♠] [Q♣]             │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─ Bids ──────────────────────┐   │
│  │ Alice: ?  (bidding...)      │   │
│  │ Bob: -   (waiting)          │   │
│  │ Charlie: - (waiting)        │   │
│  │ David: -  (waiting)         │   │
│  └──────────────────────────────┘   │
│                                     │
│     HOW MANY TRICKS WILL YOU WIN?   │
│                                     │
│         ┌──────────────┐            │
│         │  [-]  2  [+] │            │
│         └──────────────┘            │
│                                     │
│  ┌──────────────────────────────┐   │
│  │       CONFIRM BID            │   │
│  └──────────────────────────────┘   │
│                                     │
│  ⚠️ Dealer cannot bid 1 (total=3)   │ (Dealer only, if applicable)
└─────────────────────────────────────┘
```

**Components**:
- Info bar (round, trump, dealer)
- Your hand display (cards visible)
- Bids table showing all players
  - Current bidder highlighted
  - Completed bids shown as numbers
  - Pending bids shown as "-"
- Bid selector (number picker with +/- buttons)
- Confirm bid button
- Dealer restriction warning (if applicable)

**States**:
- **Waiting**: Other player bidding, your controls disabled
- **Your Turn**: Bid selector enabled, confirm button active
- **Bid Placed**: Waiting for others, your bid shown

**Validation**:
- Min bid: 0
- Max bid: Cards in round
- Dealer restriction: Last bidder cannot make total = available tricks

**Animation**:
- Highlight current bidder
- Bid number pops in when placed
- Progress to next player

---

### 2.6 Trick Playing Screen (Main Game)

**Purpose**: Core gameplay - play cards, win tricks

**Layout**:
```
┌─────────────────────────────────────┐
│ Round 3/10 | Trick 2/3 | Trump: ♠️   │
├─────────────────────────────────────┤
│         [Opponent Area]             │
│   Alice(1/2)  Bob(0/1)  Charlie(1/1)│
│     [?]        [?]        [?]       │
│                                     │
│      ┌─ Center Table ───────┐      │
│      │                      │      │
│      │    [7♥]  [K♥]  [?]   │      │
│      │                      │      │
│      │   Your turn!         │      │
│      └──────────────────────┘      │
│                                     │
│         [Your Hand Area]            │
│   [A♥] [7♠] [Q♣]                   │
│                                     │
│  David (You) | Bid: 2 | Won: 1     │
└─────────────────────────────────────┘
```

**Detailed Components**:

#### Top Info Bar
- Round number / Total rounds
- Current trick number / Total tricks
- Trump suit indicator (always visible)

#### Opponents Area (Top)
- Player names with bid/won count (e.g., "Alice 1/2" = won 1, bid 2)
- Placeholder cards (back facing) or played cards
- Current turn indicator (highlight/arrow)

#### Center Table
- Played cards for current trick
- Led suit indicator
- Turn announcement ("Alice's turn", "Your turn!")
- Trick winner animation when complete

#### Your Hand (Bottom)
- Your cards displayed
- Playable cards: Normal brightness
- Unplayable cards: Dimmed/greyed (can't follow suit)
- Selected card: Highlighted with border

#### Your Info Bar (Bottom)
- Your name and "YOU" tag
- Bid and tricks won (e.g., "Bid: 2 | Won: 1")

**Interactions**:
- **Your Turn**: Tap card to select → Tap again or "Play" button to confirm
- **Others' Turn**: View only, wait for their play
- **Card Played**: Animates to center table

**Visual Feedback**:
- **Following Suit**: Only cards of led suit are playable (highlighted)
- **No Cards of Led Suit**: All cards playable
- **Trump Available**: Trump cards highlighted differently
- **Trick Won**: Cards fly to winner, score updates

**States**:
1. **Waiting for Turn**: Disabled, watch others
2. **Your Turn**: Select and play card
3. **Card Played**: Waiting for trick to complete
4. **Trick Complete**: Brief pause, show winner, collect cards

---

### 2.7 Trick Result Screen (Mini Animation)

**Purpose**: Show who won the trick

**Layout**:
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│       ┌───────────────────┐         │
│       │                   │         │
│       │  🏆 BOB WINS!     │         │
│       │                   │         │
│       │  [7♥][K♥][A♥]     │         │
│       │                   │         │
│       └───────────────────┘         │
│                                     │
│         with Ace of Hearts          │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Components**:
- Winner name with trophy icon
- Winning cards displayed
- Explanation text ("with King of Spades")
- Glow effect around winner

**Animation**:
- Cards slide to winner
- Trophy and name pop up
- Brief pause (1.5 seconds)
- Auto-transition to next trick or scoring

**Duration**: ~2 seconds

---

### 2.8 Round Scoring Screen

**Purpose**: Show bid vs actual, calculate points

**Layout**:
```
┌─────────────────────────────────────┐
│         ROUND 3 RESULTS             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Player  | Bid | Won | Points│   │
│  ├─────────────────────────────┤   │
│  │ Alice   │  2  │  2  │ +20 ✓ │   │
│  │ Bob     │  1  │  0  │ -5  ✗ │   │
│  │ Charlie │  1  │  1  │ +15 ✓ │   │
│  │ David   │  2  │  3  │ -5  ✗ │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─ Scoring Breakdown ─────────┐   │
│  │ Made Bid: 10 + (Bid × 5)    │   │
│  │ Broke Bid: -(Diff × 5)      │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │   CONTINUE TO NEXT ROUND     │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Components**:
- Round title
- Scoring table:
  - Player names
  - Bids
  - Actual tricks won
  - Points earned (with + or -)
  - Success indicator (✓ or ✗)
- Scoring formula explanation
- Continue button (host only, or auto-advance after 5 seconds)

**Visual Feedback**:
- Positive points: Green with +
- Negative points: Red with -
- Made bid: Checkmark ✓
- Broke bid: X ✗

**Animation**:
- Points count up/down with animation
- Highlight your row

---

### 2.9 Cumulative Scoreboard Screen

**Purpose**: Show total scores across all rounds

**Layout**:
```
┌─────────────────────────────────────┐
│         SCOREBOARD                  │
│      After Round 3 of 10            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Rank | Player   | Score     │   │
│  ├─────────────────────────────┤   │
│  │  🥇  │ Alice    │  45       │   │
│  │  🥈  │ Charlie  │  30       │   │
│  │  🥉  │ David    │  10       │   │
│  │  4   │ Bob      │  -5       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─ Round History ────────────┐    │
│  │ R1: +15  R2: +20  R3: +10  │    │  (Your scores)
│  └────────────────────────────┘    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │   CONTINUE TO ROUND 4        │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Components**:
- Scoreboard title with round progress
- Leaderboard table with ranks (🥇🥈🥉)
- Player scores (cumulative)
- Round history for current player
- Continue button

**Visual Feedback**:
- First place: Gold highlight
- Your row: Highlighted differently
- Negative scores: Red color

---

### 2.10 Game End / Final Results Screen

**Purpose**: Declare winner, show final standings

**Layout**:
```
┌─────────────────────────────────────┐
│                                     │
│           🏆 GAME OVER! 🏆          │
│                                     │
│         ┌───────────────┐           │
│         │               │           │
│         │  👑 ALICE     │           │
│         │    WINS!      │           │
│         │               │           │
│         │   Score: 125  │           │
│         │               │           │
│         └───────────────┘           │
│                                     │
│  ┌─ Final Standings ────────────┐  │
│  │ 🥇 Alice     125 pts        │  │
│  │ 🥈 Charlie   95 pts         │  │
│  │ 🥉 David     60 pts         │  │
│  │ 4  Bob       40 pts         │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐   │
│  │     PLAY AGAIN               │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │     BACK TO MENU             │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Components**:
- "Game Over" title with celebration
- Winner spotlight (name, crown, confetti)
- Final score of winner
- Full leaderboard with all players
- Play Again button (creates new game with same lobby)
- Back to Menu button

**Animation**:
- Confetti/fireworks effect
- Winner name zooms in
- Trophy bounce animation
- Celebration sound

---

## 3. Component Library

### 3.1 Card Component

**Visual Design**:
```
┌──────────┐
│ A    ♠️  │  Front (Spades)
│         │
│    ♠️    │
│         │
│  ♠️    A │
└──────────┘

┌──────────┐
│ ╔══════╗ │  Back
│ ║ 🃏   ║ │
│ ║      ║ │
│ ╚══════╝ │
└──────────┘
```

**Props**:
- `suit`: 'hearts' | 'diamonds' | 'clubs' | 'spades'
- `rank`: 'A' | '2'-'10' | 'J' | 'Q' | 'K'
- `faceUp`: boolean
- `playable`: boolean (dims if false)
- `selected`: boolean (highlight border)
- `size`: 'small' | 'medium' | 'large'

**Colors**:
- Hearts/Diamonds: Red (#DC2626)
- Spades/Clubs: Black (#0F172A)
- Card background: White (#FFFFFF)
- Card back: Royal Purple pattern

---

### 3.2 Player Avatar Component

```
┌────────┐
│   👤   │  Simple
│  Name  │
└────────┘

┌────────┐
│   👤   │  With Status
│  Name  │
│ ●online│
└────────┘

┌────────┐
│  👑👤  │  Host
│  Name  │
│  (YOU) │
└────────┘
```

**Props**:
- `name`: string
- `avatar`: string (emoji or image)
- `isHost`: boolean (show crown)
- `isYou`: boolean (show "YOU" tag)
- `status`: 'online' | 'offline' | 'thinking'
- `score`: number (optional)

---

### 3.3 Bid Display Component

```
┌──────────────┐
│ Alice        │  Active Bidding
│ Thinking...  │
│   ⏳  ?      │
└──────────────┘

┌──────────────┐
│ Bob          │  Bid Placed
│ Bid: 2       │
│   ✓  2       │
└──────────────┘
```

**States**:
- Waiting: "-"
- Thinking: "?" with timer
- Placed: Number with checkmark

---

### 3.4 Trump Indicator

```
┌────────────┐
│  TRUMP:    │
│    ♠️       │
│  SPADES    │
└────────────┘
```

**Always visible during gameplay**
- Positioned in top bar or corner
- Clear icon and text
- "NO TRUMP" displayed when applicable

---

### 3.5 Score Popup

```
┌────────────┐
│   +20 pts  │  Success
│     ✓      │
└────────────┘

┌────────────┐
│   -10 pts  │  Failure
│     ✗      │
└────────────┘
```

**Animation**: Flies up from player, fades out

---

## 4. Responsive Layouts

### Mobile (Portrait)

```
┌─────────────┐
│   Header    │
├─────────────┤
│             │
│  Opponents  │
│   (Stacked) │
│             │
├─────────────┤
│             │
│   Center    │
│   Table     │
│             │
├─────────────┤
│             │
│  Your Hand  │
│ (Horizontal)│
│             │
└─────────────┘
```

### Tablet (Landscape)

```
┌──────────────────────────────┐
│         Header               │
├─────────┬───────────┬────────┤
│Opponent │  Center   │Opponent│
│  Left   │  Table    │ Right  │
├─────────┴───────────┴────────┤
│      Your Hand (Wider)       │
└──────────────────────────────┘
```

### Desktop

```
┌─────────────────────────────────┐
│           Header                │
├──────┬─────────────────┬────────┤
│Opp 1 │    Opponent 2   │  Opp 3 │
│      │     (Top)       │        │
├──────┼─────────────────┼────────┤
│Opp 4 │  Center Table   │  Opp 5 │
│(Left)│                 │ (Right)│
├──────┼─────────────────┼────────┤
│      │  Your Hand      │        │
│      │    (Bottom)     │        │
└──────┴─────────────────┴────────┘
```

---

## 5. Color Scheme (Gaming Theme)

### Primary Colors
- **Primary (Purple)**: Buttons, highlights, headers
- **Secondary (Green)**: Success, positive scores
- **Accent (Gold)**: Winner, achievements, host badge
- **Error (Red)**: Negative scores, warnings, penalties

### Card Colors
- **Red Suits** (Hearts ♥️, Diamonds ♦️): #DC2626
- **Black Suits** (Spades ♠️, Clubs ♣️): #0F172A
- **Card Background**: White #FFFFFF
- **Card Border**: Light grey #E2E8F0

### UI Elements
- **Background**: Light grey #F1F5F9 (light) / Dark slate #0F172A (dark)
- **Cards Area**: White #FFFFFF
- **Borders**: Silver #94A3B8
- **Text**: Charcoal #111827 (light) / Pearl #F1F5F9 (dark)

---

## 6. Animations & Transitions

### Card Animations
1. **Deal**: Cards fly from deck to players (0.3s each)
2. **Play**: Card slides from hand to table (0.4s)
3. **Collect**: Cards fly to trick winner (0.5s)
4. **Flip**: Trump reveal flip animation (0.6s)

### UI Transitions
1. **Screen Changes**: Fade in/out (0.3s)
2. **Button Press**: Scale down to 0.97 (0.1s)
3. **Score Update**: Count up animation (1s)
4. **Player Join**: Slide in from right (0.4s)

### Feedback Animations
1. **Bid Placed**: Number popup with bounce
2. **Trick Won**: Glow effect + flying trophy
3. **Round End**: Confetti if you made bid
4. **Game Won**: Full-screen celebration

---

## 7. Sound Effects (Optional)

- **Card Deal**: Soft swoosh
- **Card Play**: Card snap
- **Bid Placed**: Ding
- **Trick Won**: Chime
- **Round Complete**: Fanfare (success) / Sad trombone (failure)
- **Game Won**: Victory music
- **Button Tap**: Click
- **Error**: Buzz

---

## 8. Accessibility Features

- **Large Touch Targets**: Minimum 44x44px
- **High Contrast Mode**: Optional increased contrast
- **Text Scaling**: Respect system font size
- **Color Blind Mode**: Patterns/symbols in addition to colors
- **Screen Reader Support**: Proper labels for all elements
- **Keyboard Navigation**: For web version

---

## 9. Performance Considerations

- **Lazy Loading**: Load screens as needed
- **Image Optimization**: Use vector graphics for cards
- **Smooth Animations**: 60 FPS target
- **Network Efficiency**: Minimal data transfer
- **Offline Support**: Show connection status

---

## 10. Implementation Priority

### Phase 1: Core Screens
1. Main Menu
2. Lobby Screen
3. Bidding Screen
4. Trick Playing Screen

### Phase 2: Game Flow
5. Round Start Screen
6. Trump Reveal Screen
7. Round Scoring Screen

### Phase 3: Polish
8. Cumulative Scoreboard
9. Game End Screen
10. Animations & Sound

### Phase 4: Enhancement
11. Settings Screen
12. Tutorial/Help
13. Statistics & History

---

This UI design specification provides a complete blueprint for implementing the Kachuful card game with a gaming-focused, elegant user experience.
