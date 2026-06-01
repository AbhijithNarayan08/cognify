# Cognify — Complete Project Knowledge Graph
> **For any LLM or developer joining this project.** Read this top to bottom once and you will have full context to make changes anywhere in the codebase.
> Last updated: 2026-05-31

---

## 1. What This App Is

**Cognify** is a React Native (Expo) mobile app for **cognitive fitness** — think Headspace but for your brain. Users:
1. Complete a brief **onboarding** (intent → profile → 6-exercise cognitive assessment)
2. Receive a **cognitive score** (400–1000 range) broken across 6 **domains**
3. Do a **daily workout** (4 exercises, ~15 min) to improve their score
4. Log **lifestyle check-ins** (sleep, activity, mood)
5. View **Insights** — score history chart, domain radar, weekly brief

**Design Language:** Headspace-inspired. Playful, warm, **lowercase everything**, rounded shapes, vibrant domain colours, Plus Jakarta Sans font. A blue whale mascot (`usemascot.png`) features on the splash screen.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | Expo ~54.0 / RN 0.81.5 |
| Navigation | React Navigation (Stack + Bottom Tabs) | v6 |
| State | React Context + useReducer (sliced) | — |
| Persistence | AsyncStorage | 2.2.0 |
| Animations | React Native Animated API (native driver) | — |
| UI Icons | lucide-react-native | ^1.16.0 |
| SVG | react-native-svg | 15.12.1 |
| Blur | expo-blur (BlurView) | ~15.0.8 |
| Haptics | expo-haptics | ~15.0.8 |
| Fonts | @expo-google-fonts/plus-jakarta-sans | ^0.2.3 |
| Gradients | expo-linear-gradient | ~15.0.8 |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Gestures | react-native-gesture-handler | ~2.28.0 |
| Web | react-native-web | ^0.21.0 |
| Linting | ESLint (config in .eslintrc.json) | — |

**No TypeScript** — all files are `.js`. No Zustand, Redux, or React Query — state is pure Context+useReducer with AsyncStorage persistence.

---

## 3. Complete Folder Structure

```
cognify/
├── App.js                             # Root entry — fonts, providers, RootNavigator
├── app.json                           # Expo config (name, slug, icons)
├── package.json
├── babel.config.js
├── KNOWLEDGE_GRAPH.md                 # ← This file. The authoritative project reference.
├── GAME_DESIGN_DOCUMENT.md            # Game rules, scoring formulas, difficulty specs
├── README.md                          # Developer setup guide
├── instructions.md                    # LLM build instructions archive
├── scripts/
│   ├── buildStrings.js            # Compiles strings.csv → stringsData.js (npm run strings)
│   └── verifyInsights.js          # Validates dummyData.json → Weekly Brief insights pipeline
├── assets/
│   ├── characters/
│   │   ├── cat_half_page.png      # TrainScreen banner & InsightsScreen weekly brief
│   │   ├── cat_full_page.png      # Unused (old WelcomeScreen)
│   │   └── usemascot.png          # Blue whale mascot on WelcomeScreen
│   ├── icon.png
│   └── splash.png
└── src/
    ├── constants/
    │   ├── strings.csv            # Source-of-truth text database (~404 keys)
    │   ├── stringsData.js         # Compiled output of buildStrings.js — DO NOT EDIT DIRECTLY
    │   ├── useStrings.js          # Runtime t(key, vars) lookup module
    │   └── gameConfig.js          # All game tuning constants (SESSION_DURATION_MS, ADAPTIVE_LADDER,
    │                              #   STREAK_MULTIPLIERS, DOMAIN_SCORE_WEIGHTS, SIGNAL_CHAIN,
    │                              #   FLASH_SORT, LIGHTHOUSE_WATCH, CONTEXT_SWITCH,
    │                              #   WORD_WEAVE, PATTERN_FOLD, SESSION_RESULT)
    ├── context/
    │   └── AppContext.js          # Root context: rehydrates slices, persists state, exports useApp()
    ├── store/
    │   ├── slices/
    │   │   ├── onboardingSlice.js # onboardingComplete, intent, profile + REHYDRATE_ONBOARDING
    │   │   ├── scoresSlice.js     # cognitiveScore, domainScores, brainAge, scoreHistory + REHYDRATE_SCORES
    │   │   └── sessionSlice.js    # workoutComplete, workoutInProgress, checkins, streakDays, etc.
    │   └── actions/
    │       └── index.js           # Typed action creators — ALWAYS use these, never raw dispatch
    ├── services/
    │   ├── storage.js             # AsyncStorage load/save per slice
    │   ├── analyticsService.js    # Console logger stub (swap for real analytics here)
    │   ├── exerciseService.js     # getAll(), getDailyWorkout() (LCG deterministic daily seed)
    │   ├── scoreService.js        # generateHistory(base), calculateExerciseScore()
    │   └── insightService.js      # getTemplates(Colors), getWeeklyBrief()
    ├── data/
    │   ├── dummyData.json         # 30-day score history: dayOffset, score, sleep, trained, mood, domains
    │   ├── dummyData.js           # Runtime adapter: applies scoreOffset, generates live dates
    │   ├── exercises.js           # Pure static data — NO UI/theme imports ever
    │   └── wordWeaveAnalogies.js  # Analogy pairs for WordWeave verbal game
    ├── theme.js                   # Design tokens: LightColors, DarkColors, Typography, Spacing,
    │                              #   Radius, Shadow, Motion, getDomains(), useThemeColors()
    ├── utils/
    │   └── haptics.js             # GameHaptics: correct(), incorrect(), streakMilestone()
    ├── navigation/
    │   └── index.js               # RootNavigator, OnboardingNavigator, AppStackNavigator (MainTabs),
    │                              #   HomeStack, TrainStack. ActiveSession + SessionResult are modals
    │                              #   on the root AppStackNavigator (above tab bar).
    ├── components/                # Legacy barrel re-exports — DO NOT add new code here
    │   ├── UIComponents.js        # Re-exports from shared/components/
    │   ├── Motion.js              # Re-export of shared/motion/Motion.js
    │   ├── ScoreRing.js
    │   ├── DomainRadar.js
    │   └── MoodShapes.js
    ├── shared/                    # Feature-agnostic reusable code
    │   ├── components/
    │   │   ├── ConfirmModal.js        # Safety confirm dialog with cancel/confirm + custom text
    │   │   ├── DomainTile.js          # Domain score + trend tile (HomeScreen grid)
    │   │   ├── InsightCard.js         # Insight card (resolves domain colours internally)
    │   │   ├── WorkoutCard.js         # Today's workout summary card
    │   │   ├── CheckinCard.js         # Sleep/activity/mood check-in card
    │   │   ├── ExerciseCard.js        # Exercise card (4-row grid: pill+dots, name, desc, duration)
    │   │   ├── SectionHeader.js       # Row label with optional "see all" action
    │   │   ├── PillButton.js          # Branded rounded CTA button (primary/secondary/ghost)
    │   │   ├── ProjectionGraph.js     # 30-day score projection SVG graph
    │   │   ├── ScoreRing.js
    │   │   ├── DomainRadar.js
    │   │   └── MoodShapes.js
    │   ├── motion/
    │   │   └── Motion.js              # TouchableScale + FadeInUp animation primitives
    │   └── error/
    │       └── ErrorBoundary.js       # Class-based error boundary with retry UI
    ├── features/
    │   ├── home/
    │   │   └── hooks/
    │   │       ├── useGreeting.js     # Time-of-day greeting string
    │   │       └── useCheckins.js     # Pending check-ins + 6h persisted dismiss cooldowns
    │   ├── insights/
    │   │   └── hooks/
    │   │       └── useInsights.js     # Derives insights data from app state
    │   ├── profile/
    │   │   └── hooks/
    │   │       └── useProfileStats.js # totalSessions, avgScore, streakDays
    │   └── train/
    │       ├── components/            # Train-specific shared UI components
    │       │   ├── ScoreDisplay.js    # Running score + float-up +X deltas + "pts" label
    │       │   ├── SessionTimerBar.js # Draining amber timer bar (full→empty, right→left)
    │       │   └── StreakBadge.js     # ×N multiplier badge (animated scale-in)
    │       ├── engine/                # Stateless/pure game engine hooks
    │       │   ├── useSessionTimer.js  # Drift-free 60s active-stimulus timer, 2-pause limit
    │       │   ├── useAdaptiveLadder.js# Difficulty staircase: 3 correct→up, 2 miss→down
    │       │   ├── useStreakMultiplier.js# Streak multipliers: ×1.1/×1.25/×1.5
    │       │   └── scoring.js         # calculateRoundScore, calculateSessionScore,
    │       │                          #   updateDomainScore, normaliseSessionScore,
    │       │                          #   normaliseFlashSortSessionScore
    │       ├── hooks/
    │       │   ├── useExerciseFilter.js # Domain filter state + filtered exercise list
    │       │   └── useSessionEngine.js  # Legacy session engine (unused by new games)
    │       ├── games/
    │       │   ├── SignalChain.js      # Barrel → ./SignalChain/index.js
    │       │   ├── FlashSort.js        # Barrel → ./FlashSort/index.js
    │       │   ├── LighthouseWatch.js  # Monolithic (sustained attention — self-contained)
    │       │   ├── ContextSwitch.js    # Monolithic (executive function — self-contained)
    │       │   ├── WordWeave.js        # Monolithic (verbal reasoning — self-contained)
    │       │   ├── PatternFold.js      # Monolithic (spatial cognition — self-contained)
    │       │   ├── SignalChain/        # Modular working memory game
    │       │   │   ├── index.js              # Main orchestrator (watching/recall/feedback phases)
    │       │   │   ├── useSignalChainEngine.js# Sequence generation, tap tracking, round scoring
    │       │   │   ├── SignalChainGrid.js     # 3x3/4x4/5x5 node grid renderer
    │       │   │   ├── SignalChainNode.js     # Tactile node: pulse, glow, score delta float-up
    │       │   │   ├── SignalChainFeedback.js # End-of-round score +pts float animation
    │       │   │   ├── RoundIndicator.js      # "round N · N nodes" label
    │       │   │   └── ResponseWindowBar.js   # Per-round deadline bar (drains right→left)
    │       │   └── FlashSort/          # Modular processing speed game
    │       │       ├── index.js              # Main orchestrator: split-screen layout, all phases
    │       │       ├── useFlashSortEngine.js  # Shape selection, distractor config, round scoring
    │       │       ├── FlashSortShape.js      # SVG shape: circle/ellipse/square/rect + stripes
    │       │       ├── FlashSortFixation.js   # 24×24pt crosshair fixation point
    │       │       ├── FlashSortFeedback.js   # Feedback phase: colored shape + caption labels
    │       │       └── FlashSortTapZones.js   # Full-screen invisible tap+swipe capture
    │       └── screens/
    │           ├── TrainScreen.js         # Exercise browser: filter pills, workout banner, card grid
    │           ├── ActiveSessionScreen.js # Session orchestrator: intro/countdown/playing/paused/complete
    │           ├── SessionResultScreen.js # Post-session results dashboard
    │           ├── FlashSortGame.js       # LEGACY — unused, superseded by FlashSort/ module
    │           ├── SequenceRecallGame.js  # LEGACY — unused, superseded by SignalChain/ module
    │           └── WordMatchGame.js       # LEGACY — unused
    └── screens/                   # Legacy screen locations
        ├── main/
        │   ├── HomeScreen.js
        │   ├── TrainScreen.js     # Barrel → features/train/screens/TrainScreen
        │   ├── InsightsScreen.js
        │   └── ProfileScreen.js
        └── onboarding/
            ├── WelcomeScreen.js
            ├── IntentScreen.js
            ├── QuickProfileScreen.js
            ├── AssessmentScreens.js   # 4 screens in one file
            └── ProjectionScreen.js    # Post-results projection / brain age screen
```

---

## 4. State Management Deep Dive

### Architecture
```
AppContext (context/AppContext.js)
├── onboardingReducer  (store/slices/onboardingSlice.js)
│   ├── onboardingComplete: boolean
│   ├── intent: 'sharpen'|'focus'|'protect'|'curious'|null
│   └── profile: { firstName, ageRange, avgSleepBucket, activityLevel }
├── scoresReducer  (store/slices/scoresSlice.js)
│   ├── cognitiveScore: number|null  (400–1000)
│   ├── domainScores: { memory, speed, attention, executive, verbal, spatial }
│   ├── brainAge: number|null
│   ├── cohortPercentile: number|null
│   └── scoreHistory: [{ date, score, sleep, trained, mood, domains }]
└── sessionReducer  (store/slices/sessionSlice.js)
    ├── workoutComplete: boolean
    ├── workoutInProgress: boolean
    ├── checkins: { sleep, activity, mood }
    ├── checkinDismissedAt: { sleep, activity, mood } (6h cooldown timestamps)
    ├── streakDays: number
    └── lastWorkoutDate: string|null (ISO YYYY-MM-DD)
```

### Root Reducer Composition — CRITICAL
The `rootReducer` in `AppContext.js` **chains** reducers sequentially — NOT parallel object spread:
```js
let next = onboardingReducer(state, action);
next = scoresReducer(next, action);
next = sessionReducer(next, action);
return next;
```
**Why this matters:** Parallel spread (`{...onboardingReducer(state), ...scoresReducer(state), ...}`) would cause later reducers' `...state` to silently overwrite earlier reducers' changes. Chaining ensures each reducer sees accumulated state.

### AsyncStorage Keys
| Key | Contents |
|---|---|
| `cognify:onboarding` | onboarding slice |
| `cognify:scores` | scores slice |
| `cognify:session` | session slice |
| `cognify:difficulty:{exerciseId}` | Adaptive ladder level per game |
| `cognify:previousScore:{exerciseId}` | Last session score per game |
| `cognify:tutorial:flashSort:tapZones` | First-visit tap zone tutorial flag |
| `cognify:tutorial:flashSort:introTip` | First-visit speed tip flag |
| `cognify:tutorial:difficultyDots` | Difficulty dots tooltip flag |

### Dispatching Actions
```js
import { setIntent, completeWorkout, setCheckin, resetApp } from '../../store/actions';
const { dispatch } = useApp();
dispatch(completeWorkout({ domain: 'speed', sessionScore: 740 }));
```
**Never use raw dispatch strings** — always import from `store/actions/index.js`.

---

## 5. Navigation Structure

```
RootNavigator (context-driven)
├── OnboardingNavigator (Stack) — shown when onboardingComplete === false
│   ├── Welcome         → WelcomeScreen.js
│   ├── Intent          → IntentScreen.js
│   ├── QuickProfile    → QuickProfileScreen.js
│   ├── AssessmentIntro → AssessmentIntroScreen (inside AssessmentScreens.js)
│   ├── Assessment      → AssessmentScreen
│   ├── Processing      → ProcessingScreen
│   ├── Results         → ResultsScreen
│   ├── Projection      → ProjectionScreen.js
│   └── MainApp         → switches to AppStackNavigator
└── AppStackNavigator (Stack, gestureEnabled: false) — shown when onboarding complete
    ├── MainTabs (Bottom Tab Navigator — iOS glass BlurView)
    │   ├── Home     → HomeStack → HomeScreen
    │   ├── Train    → TrainStack → TrainScreen
    │   ├── Insights → InsightsScreen
    │   └── Profile  → ProfileScreen
    ├── ActiveSession (modal, no tab bar) → ActiveSessionScreen
    └── SessionResult (modal, no tab bar) → SessionResultScreen
```

**Important:** `ActiveSession` and `SessionResult` are on the **root AppStackNavigator** above the tab bar — they render full-screen without tabs. Navigating to them uses `navigation.navigate('ActiveSession', { ... })`.

**Bottom tab bar** uses `expo-blur BlurView` (`position: absolute`) on iOS. Every main screen must add `paddingTop: insets.top` and a `height: 100` bottom spacer.

---

## 6. Design System (theme.js)

### Colour Palette
| Token | Light | Dark | Usage |
|---|---|---|---|
| `brandPrimary` | `#FF7A00` (orange) | same | CTAs, active states |
| `coral` | `#FF5E5B` | same | Score delta, emphasis |
| `appBg` | `#F9F4F2` (warm cream) | `#141313` | Screen backgrounds |
| `surface` | `#FFFFFF` | `#222120` | Cards |
| `surfaceAlt` | `#F5EBE6` | `#2D2C2B` | Chips, snapshot cards |
| `textPrimary` | `#141313` | `#FFFFFF` | Main text |
| `textSecondary` | ~`#5C5855` | ~`#B0ABA7` | Secondary labels |
| `textTertiary` | ~`#8E8A86` | ~`#6E6A66` | Muted/hint text |
| `border` | ~`#E2DED9` | ~`#3A3836` | Dividers, tracks |
| `positive` | `#3DAB7F` | same | Success, correct |

### Domain Colours
| Domain ID | Main | Light Tint | Label | Icon |
|---|---|---|---|---|
| `memory` | `#0073E6` | `#E6F0FF` | memory | Brain |
| `speed` | `#FFC000` | `#FFF9E6` | speed | Zap |
| `attention` | `#3DAB7F` | `#E6F5EE` | attention | Target |
| `executive` | `#A662C6` | `#F3E8FB` | thinking | Activity |
| `verbal` | `#FF7A00` | `#FFF0E6` | language | MessageSquare |
| `spatial` | `#FF7DB4` | `#FFF0F6` | spatial | Box |

### Typography (Plus Jakarta Sans)
```js
Typography.fontFamily.regular    // PlusJakartaSans_400Regular
Typography.fontFamily.medium     // PlusJakartaSans_500Medium
Typography.fontFamily.semiBold   // PlusJakartaSans_600SemiBold
Typography.fontFamily.bold       // PlusJakartaSans_700Bold
Typography.fontFamily.extraBold  // PlusJakartaSans_800ExtraBold

Typography.size.display  // 48pt — hero headings
Typography.size.h1       // 32pt — screen titles
Typography.size.h2       // 28pt — card titles
Typography.size.h3       // 20pt — sub-headings
Typography.size.body     // 16pt — body copy
Typography.size.label    // 15pt — labels, chips
Typography.size.caption  // 13pt — meta, muted text
Typography.size.micro    // 11pt — tiny labels (e.g. "pts")
```

### Spacing Scale
`Spacing[1]=4, [2]=8, [3]=12, [4]=16, [5]=20, [6]=24, [8]=32, [10]=40, [12]=48, [16]=64`

### Radius & Shadow
```js
Radius.sm=12,  Radius.md=16,  Radius.lg=24,  Radius.xl=32,  Radius.full=999
Shadow.sm  // elevation 2, small drop shadow
Shadow.md  // elevation 4, medium drop shadow
```

### Using the Theme
```js
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';

const Colors = useThemeColors();       // reactive to dark/light mode
const DOMAINS = getDomains(Colors);    // array of 6 domain objects { id, label, color, icon }
const styles = useMemo(() => StyleSheet.create({...}), [Colors]);
```
**`Colors` is reactive** — always call `useThemeColors()` inside the component.

---

## 7. Game Config Constants (gameConfig.js)

All game tuning lives here. Never hardcode game parameters in component files.

```js
SESSION_DURATION_MS = 60000          // 60s active stimulus time per session

ADAPTIVE_LADDER = {
  correctToAdvance: 3,               // consecutive correct → level +1
  missesToRetreat: 2,                // consecutive misses → level -1
  min: 1, max: 5,
  dailyWarmUpCap: 3,                 // max level at start of new calendar day
}

STREAK_MULTIPLIERS = { 3: 1.1, 6: 1.25, 10: 1.5 }

DOMAIN_SCORE_WEIGHTS = { previous: 0.7, session: 0.3 }

FLASH_SORT = {
  SHAPE_SIZE_PT: 80,                 // shape container + SVG size in points
  SQUARE_BORDER_RADIUS: 8,           // square rx/ry (circle uses SHAPE_SIZE_PT/2)
  FIXATION_DURATION_MS: 200,
  FEEDBACK_DURATION_MS: 300,
  ANTICIPATORY_THRESHOLD_MS: 100,    // taps under 100ms = false start (no penalty)
  DISTRACTOR_COLOURS: ['#FFC000','#0073E6','#3DAB7F','#D85A30'],
  levels: { 1: {stimulusDuration:1000, ISI:600, distractorType:'none'},
            2: {stimulusDuration:800,  ISI:500, distractorType:'colour'},
            3: {stimulusDuration:600,  ISI:400, distractorType:'pattern_stripes'},
            4: {stimulusDuration:400,  ISI:300, distractorType:'pattern_colour'},
            5: {stimulusDuration:250,  ISI:200, distractorType:'high_similarity'} }
}

SESSION_RESULT = {
  TRANSITION_DURATION_MS: 800,
  SCORE_COUNT_UP_MS: 500,
  MAX_PAUSES: 2,
}
```

---

## 8. Shared Training Engine

All game sessions share these hooks/components wired together by `ActiveSessionScreen.js`:

### Engine Hooks (`src/features/train/engine/`)
| Hook | What it does |
|---|---|
| `useSessionTimer()` | Drift-free 60s timer using `Date.now()` deltas in a 50ms interval. Returns `activeTimeElapsed`, `isActive`, `isComplete`, `pauseCount`, `pause()`, `resume()`, `setIsActive()`. Enforces 2-pause limit. |
| `useAdaptiveLadder(exerciseId)` | Loads level from AsyncStorage, tracks consecutive correct/miss, exposes `currentLevel`, `recordCorrect()`, `recordMiss()`, `saveLevel()`. Daily warm-up cap at level 3. |
| `useStreakMultiplier()` | Tracks streak count, resolves multiplier from `STREAK_MULTIPLIERS`. Returns `streakCount`, `multiplier`, `recordCorrect()`, `recordMiss()`, `reset()`. |

### Advanced Analytics Engine (`src/features/insights/hooks/useInsights.js` & `src/utils/analytics.js`)
* **Pearson Correlation Coefficient ($r$)**: Computes mathematical correlations between lifestyle habits (sleep, mood, activity) and cognitive domains (Memory, Speed, Attention, Executive, Verbal, Spatial).
  - Calculated dynamically using covariance divided by the product of standard deviations:
    $$r = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum (x_i - \bar{x})^2 \sum (y_i - \bar{y})^2}}$$
  - Bounded by a strict standard deviation guard: if standard deviation is zero (e.g. flat user inputs), standard deviation is standardized to $0.0001$ to block division-by-zero (`NaN`) runtime crashes.
* **Linear Regression Progress Trajectory**:
  - Calculates the trend slope of historical scores over sequential days $t$:
    $$slope = \frac{\sum (t_i - \bar{t})(Score_i - \bar{Score})}{\sum (t_i - \bar{t})^2}$$
  - Models future score projections 7 days out: $Score_{\text{projected}} = Score_{\text{current}} + 7 \times slope$ (bounded securely between `300` and `1000`).
  - Supports an **"Optimize My Habits"** toggle plotting a compound slope booster ($slope + 0.82$) to demonstrate potential daily gains if consistent sleep and training are maintained.

### Scoring (`src/features/train/engine/scoring.js`)
```js
calculateRoundScore({ baseScore, speedBonus, multiplier, maxScore })
// → Math.round(Math.min(maxScore, baseScore + speedBonus) * multiplier)

normaliseSessionScore(rawScore, averageLevel)
// → Signal Chain: scales to 0–100 based on level-weighted max possible score

normaliseFlashSortSessionScore(rawScore, averageLevel)
// → Flash Sort: scales to 0–100 based on reaction-speed scoring ceiling

updateDomainScore(previousDomainScore, sessionScore)
// → Math.round(prev * 0.7 + session * 0.3)
```

### Train UI Components (`src/features/train/components/`)
| Component | What it renders |
|---|---|
| `ScoreDisplay` | Running score in `semiBold` h2 + "pts" micro label + float-up `+X` deltas (600ms animate-out) |
| `SessionTimerBar` | 3pt amber bar (`#FFC000`) that drains from full→empty over 60s. `pulse` prop enables 15s opacity blink for attention games. |
| `StreakBadge` | `×N` multiplier badge with scale-in animation when multiplier > 1.0 |

### Haptics (`src/utils/haptics.js`)
```js
GameHaptics.correct()          // Light impact
GameHaptics.incorrect()        // Error notification
GameHaptics.streakMilestone()  // Heavy impact (streak 3, 6, 10)
```

---

## 9. Active Session Screen (`ActiveSessionScreen.js`)

The outer session shell — manages all phases and dispatches to the correct game component.

### Phase Machine
```
'intro' → 'countdown' → 'playing' ↔ 'paused' → 'complete'
```

### Game Dispatcher
```js
const GAME_COMPONENTS = {
  'signal-chain':    SignalChain,      // memory domain
  'flash-sort':      FlashSort,        // speed domain
  'lighthouse-watch': LighthouseWatch, // attention domain
  'context-switch':  ContextSwitch,    // executive domain
  'word-weave':      WordWeave,        // verbal domain
  'pattern-fold':    PatternFold,      // spatial domain
};
```
Game components receive: `{ level, isActive, onRoundComplete, Colors, multiplier, streakCount }`.

### Intro Phase
Full-screen branded intro before gameplay:
- Close button (absolute top-right, circular, 40×40pt)
- Large domain icon (80pt, domain colour)
- Domain pill + game name (`display` 48pt) + description
- Numbered 3-step instruction card (domain light tint background, loaded from strings: `games.{gameKey}.instructions.{1-3}`)
- Flash Sort speed tip card (first-session only, AsyncStorage-gated)
- Metadata row: `Clock` icon + "60s session" · `BarChart2` icon + difficulty label
- Orange start button (pill, 56pt height, `brandPrimary`)
- Daily workout progress dots (if in daily workout flow)

### Paused Phase — 3-Zone Overlay
Full-screen `Colors.appBg` overlay with three zones:
- **Top:** Frozen timer bar snapshot + `PAUSED` micro-label + domain pill + game name
- **Middle:** "paused" display heading + 3-card snapshot grid (score / rounds / streak in `surfaceAlt` cards)
- **Bottom:** Pause count warning label (turns amber on last pause) + Resume pill button (`brandPrimary`, Play icon) + "exit session" ghost button → `ConfirmModal`

### Session Completion
When `isComplete` fires: fades play area → navigates to `SessionResult` with:
- `exercise`, `score`, `prevScore`, `roundsCompleted`, `accuracy`, `longestStreak`, `gameSpecificMetrics`, `remainingExercises`

---

## 10. The 6 Cognitive Games

### Game 1 — Signal Chain (Working Memory, `#0073E6`)
**File:** `src/features/train/games/SignalChain/`

**Mechanic:** Lights up nodes in a sequence → user recalls the sequence in order.

**Phases:** `watching` → `recall` → `feedback` → `between_rounds`

**Components:**
- `useSignalChainEngine.js` — sequence generation, active highlight timing, tap validation, round scoring
- `SignalChainGrid.js` — renders 3×3, 4×4, or 5×5 circular node grid (capped at 4×4 on narrow screens)
- `SignalChainNode.js` — tactile node with pulse/glow (1.08× scale), floating `+nodePoints` delta on correct tap
- `ResponseWindowBar.js` — thin recall-deadline bar, drains right→left under the grid
- `RoundIndicator.js` — "round N · N nodes" label
- `SignalChainFeedback.js` — round-end score float animation

**Scoring:**
- 10 pts per correct node × tier multiplier (Easy:1.0, Medium:1.5, Hard:2.0)
- Completion bonus: +1 node's worth of points
- Speed bonus: +1 node's worth if completed under 50% of response window
- Normalised via `normaliseSessionScore` → ×10 for domain score update

**Level config (from SIGNAL_CHAIN.levels):**
| Level | Seq Len | Grid | Display | Response Window | Tier |
|---|---|---|---|---|---|
| 1 | 3 | 3×3 | 800ms | 8000ms | easy |
| 2 | 4 | 3×3 | 650ms | 9000ms | easy |
| 3 | 5 | 4×4 | 500ms | 10000ms | medium |
| 4 | 6 | 4×4 | 400ms | 11000ms | medium |
| 5 | 7 | 5×5 | 300ms | 12000ms | hard |

---

### Game 2 — Flash Sort (Processing Speed, `#FFC000`)
**File:** `src/features/train/games/FlashSort/`

**Mechanic:** Shape flashes → tap left for circle, right for square. Scored on millisecond reaction time.

**Phases:** `fixation` (200ms) → `stimulus` → `feedback` (300ms) → `isi`

**Layout — Permanent Split-Screen:**
- `splitRow`: `absoluteFillObject`, `flexDirection: 'row'` — always visible
- Left zone (`flex: 1`): circle icon + "circle" label pinned bottom-left
- Hairline divider: 1pt wide, `rgba(0,0,0,0.06)`
- Right zone (`flex: 1`): "square" label + square icon pinned bottom-right
- `stimulusLayer`: `absoluteFillObject`, floats shape at optical centre (5% upward shift via `onLayout`)
- Hint colour: `Colors.textTertiary` at level 1, domain amber at level 2+

**Components:**
- `useFlashSortEngine.js` — shape selection, distractor colour pool, round scoring
- `FlashSortShape.js` — SVG renderer: circle / squashed ellipse (high_similarity) / rounded rect + stripe overlay. Uses `FLASH_SORT.SHAPE_SIZE_PT` (80pt) constant everywhere.
- `FlashSortFixation.js` — 24×24pt `+` crosshair, `Colors.textTertiary`
- `FlashSortFeedback.js` — correct/incorrect shape with colour overlay + "too slow"/"too fast" caption
- `FlashSortTapZones.js` — full-screen invisible tap+swipe capture (still used for actual input)

**Animations:**
- `entranceAnim` (0→1, 80ms): shape fades + scales in from 0.85 on each new stimulus
- `ghostOpacity`: reaction time `{n}ms` ghost appears below shape on correct tap, fades over 400ms during ISI
- `feedbackAnim`: both zone panels flash green (`rgba(61,171,127,0.07)`) or red (`rgba(226,75,74,0.07)`) on response

**Scoring:**
- `speedRatio = Math.max(0, 1 - reactionTimeMs / stimulusDuration)` → base = `speedRatio * 100`
- Elite speed bonus: +20 if reactionTimeMs < stimulusDuration * 0.20
- Consistency bonus: +10 if previous round also correct
- × tier multiplier (Easy:1.0, Medium:1.5, Hard:2.25)
- Anticipatory taps (<100ms): score 0, no ladder miss
- Normalised via `normaliseFlashSortSessionScore` → ×10 for domain score

**Distractor system by level:**
| Level | Stimulus Duration | ISI | Distractor Type |
|---|---|---|---|
| 1 | 1000ms | 600ms | none (domain yellow always) |
| 2 | 800ms | 500ms | colour (random pool) |
| 3 | 600ms | 400ms | pattern_stripes |
| 4 | 400ms | 300ms | pattern_colour |
| 5 | 250ms | 200ms | high_similarity (ellipse vs heavy-rounded rect) |

---

### Game 3 — Lighthouse Watch (Sustained Attention, `#3DAB7F`)
**File:** `src/features/train/games/LighthouseWatch.js` (monolithic)

**Mechanic:** Continuous, dynamic shape stream with fading overlap visual physics. Tap only on the rare target star. Ignore all distractor shapes.

**Vigilance Analysis & Clinical Metrics**:
* **Z-Score D-Prime Metric ($d'$)**: Implements a high-precision, zero-dependency rational approximation of the inverse normal cumulative distribution function (CDF) to solve:
  $$d' = Z(\text{Hit Rate}) - Z(\text{False Alarm Rate})$$
  Features a mathematical continuity correction ($\pm 0.5 / n$) to handle perfect boundary scores ($100\%$ hits or $0\%$ false alarms) without producing infinite values or runtime crashes.
* **15-Second Event Quartiles**: Partitions the 60s stimulus period into four distinct 15s quartiles (Q1, Q2, Q3, Q4) to track hits, misses, and false alarms per quartile.
* **Cognitive Pattern Classifiers**:
  - `PEAK_PERFORMANCE` (*Elite Vigilance*): $>90\%$ Hit Rate, $<10\%$ False Alarm Rate.
  - `LATE_FATIGUE` (*Late Session Fatigue*): Q4 False Alarm Rate is $>2\times$ Q1 (with at least 2 FAs in Q4), tracking classic vigilance decrements.
  - `EARLY_IMPULSIVITY` (*Early Impulsivity*): $\ge 3$ False Alarms in the first 15 seconds (Q1).
  - `CONSISTENT_MISS` (*High Speed Overload*): $>40\%$ Miss Rate.

**Scoring:** +100 per correct hit. False alarms: −50 direct penalty + full-screen red flash (30% opacity, 200ms). Silence on missed targets.

**Timer bar** uses `pulse` prop — triggers 0.85 opacity blink every 15 seconds as attention re-focus cue.

---

### Game 4 — Context Switch (Executive Function, `#A662C6`)
**File:** `src/features/train/games/ContextSwitch.js` (monolithic)

**Mechanic:** Classify stimuli by a rapidly-switching rule (shape/colour/size/count). Coloured border signals the active rule.

**Rules:** Blue=shape, Red=colour, Yellow=size, Purple=count. Shape fill color never matches active rule border color (Fill color guard).

**Set-Shifting Analytics & Calculations**:
* **Decomposed Switch Cost**: Calculates global switch cost ($AvgRT_{\text{switch}} - AvgRT_{\text{stay}}$) by isolating rounds where the rule changed vs stay rounds.
* **Rule-Specific Performance Breakdown**: Tallies attempts, correct, average RT, and local switch costs for each of the 4 individual rules.
* **Cognitive Transition Classifiers**:
  - `ELITE_FLEXIBILITY` (*Elite Flexibility*): Switch cost $<50$ms.
  - `WEAK_RULE` (*Asymmetric Set-Shifting*): Accuracy under $65\%$ on one rule while others exceed $80\%$.
  - `TIMEOUT_SPIKE` (*Cognitive Overload*): Timeout rate exceeds $20\%$ (too tight response window for selected level).
  - `STAY_DOMINANT` (*Rule-Switching Deficit*): Stay accuracy $>95\%$ but switch accuracy $<70\%$.

**Scoring:** +150 base on switch rounds. Measures `switchCost` = meanSwitchRT − meanStayRT (ms).

---

### Game 5 — Word Weave (Verbal Reasoning, `#FF7A00`)
**File:** `src/features/train/games/WordWeave.js` (monolithic)

**Mechanic:** Verbal analogy frame `[A] : [___] :: [___] : [D]`. Choose correct completion from 4 options. Distractors: same-category, thematic, plausible. Uses `wordWeaveAnalogies.js` dataset.

**Timing:** `thinkTime` delays fade-in of answer choices. Speed bonus if answered under 40% of window.

---

### Game 6 — Pattern Fold (Spatial Cognition, `#FF7DB4`)
**File:** `src/features/train/games/PatternFold.js` (monolithic)

**Mechanic:** Match a 3×3 block pattern to its correct rotated variant (ignore mirror distractors). Mirror errors tracked separately.

**Animation:** 300ms cubic-out rotation alignment animation on response.

---

## 11. Session Result Screen (`SessionResultScreen.js`)

Post-session results dashboard navigated to from `ActiveSessionScreen` upon completion.

**Standard metrics (all games):**
- Final score (+ green/red delta vs previous session from AsyncStorage)
- Rounds completed, accuracy %, longest streak

**Game-specific metrics panels:**
| Game | Extra metrics shown |
|---|---|
| Signal Chain | Best sequence length, avg pts/round, difficulty reached |
| Flash Sort | Mean reaction time, fastest RT, accuracy, rounds, difficulty, benchmark callout |
| Lighthouse Watch | Hit rate, false alarm rate, misses |
| Context Switch | Switch cost (ms) |
| Pattern Fold | Mirror errors |

**Workout flow integration:**
- Daily workout: primary CTA = "next exercise" (loads next in `remainingExercises` stack)
- Single game: primary CTA = "done" → back to TrainScreen
- Always: secondary "play again" CTA below

**Early exit handling:**
- Signal Chain: saves partial score if `roundsCompleted >= 5`, else discards
- Flash Sort: saves partial score if `roundsCompleted >= 10`, else discards

---

## 12. String Constants System

**Source of truth:** `src/constants/strings.csv` (~404 keys)

**Compile command:** `npm run strings` → writes `src/constants/stringsData.js`

**Usage:**
```js
import { t } from '../../constants/useStrings';
t('train.activeSession.start');                           // "begin"
t('train.activesession.pauseCount', { used: 1, max: 2 }); // "1 of 2 pauses used"
t('games.flashSort.instructions.1');                      // "a shape will flash on screen"
```

**Naming conventions:**
- `onboarding.*` — onboarding screens
- `home.*` — home screen
- `train.*` — training screens + active session
- `train.activesession.*` — pause/resume/exit strings
- `train.results.*` — session result screen
- `games.{camelCaseId}.instructions.{1|2|3}` — per-game 3-step instructions
- `insights.*` — insights screen

**Rules:**
- All visible UI text must be in `strings.csv`. Never hardcode in JSX.
- All values lowercase (sentence case for prose).
- No exclamation marks.
- After adding keys, always run `npm run strings`.

---

## 13. Data Layer

### `src/data/exercises.js` — Pure Static Data
**RULE: Zero UI/theme imports.** Exports plain JS objects only.

| Export | Contents |
|---|---|
| `EXERCISES` | Array of 6 exercises: `{ id, name, domain, duration, difficulty, description, type }` |
| `DAILY_WORKOUT` | 4-item subset (indices 0, 1, 4, 5) |
| `FLASH_SORT_STIMULI` | `[{ shape, correct }]` pairs (legacy, unused by new engine) |
| `INSIGHT_TEMPLATES` | `[{ id, headline, body, domain }]` — no colours |
| `WEEKLY_BRIEF` | `{ scoreRecap, topMoment, lifestyleHighlight, weekFocus }` strings |

**Exercise IDs (used as keys everywhere):**
`'signal-chain' | 'flash-sort' | 'lighthouse-watch' | 'context-switch' | 'word-weave' | 'pattern-fold'`

### `src/data/dummyData.json` — 30-Day Score History
Each entry: `{ dayOffset, score, sleep, trained, mood, domains: {memory, speed, attention, executive, verbal, spatial} }`
- dayOffset 0 = today, 29 = 29 days ago
- Score baseline anchored at 725 for dayOffset 0
- `dummyData.js` adapter applies `scoreOffset = baseScore - 725` and generates live dates

### `src/data/wordWeaveAnalogies.js`
Analogy pairs for WordWeave verbal game. Used by `WordWeave.js`.

### Cognitive Domain IDs
`memory | speed | attention | executive | verbal | spatial`

### Score Range
400 (minimum) → 980 (hard cap). After assessment: computed from answers. After daily workout: `cognitiveScore += random(5–25)`.

---

## 14. Screen-by-Screen Reference

### WelcomeScreen
Mascot splash. Single subtle cloud. Taglines: "stay sharp. think clearly. age well." Dev bypass button (red-accented) to skip onboarding.

### IntentScreen
4-intent 2×2 card grid. Border-only selection. Auto-navigates after 500ms delay (premium pacing). Haptic on select.

### QuickProfileScreen
Multi-step: age range → sleep → activity level.

### AssessmentScreens (4 screens in one file)
- `AssessmentIntroScreen` — FAQ accordion with clinical advisory text
- `AssessmentScreen` — 6 sequential exercises, animated progress bar, ConfirmModal back interceptor
- `ProcessingScreen` — animated calculating state
- `ResultsScreen` — animated baseline score reveal

### ProjectionScreen
Post-results projection / brain age screen. Navigates to MainApp on completion.

### HomeScreen
- Sticky header: snaps from 60→80px at scroll offset.
- Greeting hook: contextual milestone strings (streaks, post-workout, time-of-day).
- `ScoreRing` + cohort percentile.
- **Interactive Duolingo-style Streak system**:
  - Streak badge pill wrapped inside `TouchableScale` triggering correct haptics on press.
  - Transparent overlay `<Modal>` with an organic spring bounce animation (`Animated.spring` friction 7, tension 50).
  - **Dynamic Multi-Layered SVG Flame Mascot**: Centered dynamic cartoon character layered with three animated vector shapes: Outer Coral flame (`#FF5E5B`), Middle Amber flame (`#FFC000`), and Inner Cream core (`#FFF9E6`) with closed smiling eyes (`∪ ∪`), pink cheeks, and an open gasping mouth. Animated with dual-axis breathing and out-of-phase organic swaying loops.
  - Horizontal timezone-safe weekly activity calendar mapping days to score history logs (vibrant filled flames, dashed today, empty grey outlines).
  - Streak freeze placeholder slot with shield icon on light-blue layout.
- `WorkoutCard`: triggers daily workout (4-exercise stack).
- Insight/Weekly Brief teasers: suppressed until daily workout complete.
- Check-in cards: 1 visible at a time, 6h dismiss cooldown, launches the Check-in Bottom Sheet.
- Focus Areas: 3 weakest domains (SectionHeader toggle to show all).

### Quick Check-in Bottom Sheet Modal (`CheckinBottomSheet.js`)
Presents a premium full-width card entry point (`CheckinCard.js`) that slides up a customized, highly-tactile wellness tracker:
* **Custom gesture slider & floating tooltip**:
  - 100% custom gesture slider using `PanResponder` to capture drag/taps and snap to steps on release.
  - Floating speech bubble tooltip CARET (`▼`) that glides horizontally to track the sliding thumb knob.
* **Procedural SVGs & Face Morphing**:
  - **Mood & Sleep Face**: Vector face morphing dynamically drawn using quadratic Bezier curve coordinates:
    $$d = \text{"M 33 startY Q 50 controlY 67 startY"}$$
    Transitions eyes and mouth smoothly in real-time from terrible (frown, controlY=34) to neutral (straight line, controlY=52) to great (happy curve, controlY=70).
  - **Energy Pulse Wave (Activity)**: A physical activity wave procedurally plotted using a sine wave modulated by a smooth dome envelope function:
    $$Y = 40 + A \times \sin(\omega t) \times \sin(\text{pct} \times \pi)$$
    Automatically increases frequency (1.5 to 7.0 cycles) and amplitude ($A$) as user slider rating increases, from resting flatline to energy pulse, keeping ends flat (`Y=40`) to prevent visual edge clipping.
* **Emotional color spectrum transitions**:
  - Transitions background sheet container smoothly across emotional scales: blue scale (Memory-Blue `#BCDBFF`) for low ratings, appBg warm linen (`#F0EEE8`) for neutral, and coral/red scale (`#F4A69A`) for excellent logs.
* **Sleep Zzzs Animation**:
  - Looping sequential animation driving drifting sleeping letters (`Z`, `z`, `z`) floating upward and right of the Zzz sleeping face using staggered translate and opacity interpolations on native driver.

### TrainScreen
- Domain filter pills (horizontal scroll, 44pt touch targets, right fade mask via LinearGradient)
- Workout banner: dynamic 4-domain exercise selection
- 2-column card grid with consistent 4-row layout (pill+dots / name / desc / duration)
- Difficulty dot tooltip (first-visit, AsyncStorage-gated)
- `paddingBottom: 100` to clear tab bar

### InsightsScreen
- **Overview tab:** 30-day ScoreGraph, domain trend selector, parameter timeline, 30-day projection, DomainRadar, lifestyle correlations
- **Weekly Brief tab:** 4 zones — score summary + week-over-week delta, domain bar chart, sleep-score correlation, actionable focus recommendation
- `initialTab` param for deep-linking from HomeScreen teasers
- **Self-heal** on mount: if scoreHistory empty/stale → dispatches `COMPLETE_ONBOARDING` to refresh from dummyData
- Optional-chaining on all `h.domains?.[parameter]` accesses (crash-proofed)

### ProfileScreen
- Stats card: streak, sessions, avg score
- Focus Areas grid (weakest domains first, links to Train filter)
- Restart onboarding: `ConfirmModal` → `dispatch(resetApp())`

### ActiveSessionScreen *(see Section 9 for full detail)*

### SessionResultScreen *(see Section 11 for full detail)*

---

## 15. Key Custom Hooks Reference

| Hook | File | Returns |
|---|---|---|
| `useApp()` | `context/AppContext.js` | `{ state, dispatch }` |
| `useThemeColors()` | `theme.js` | `Colors` object (light/dark reactive) |
| `useGreeting()` | `features/home/hooks/useGreeting.js` | greeting string |
| `useCheckins()` | `features/home/hooks/useCheckins.js` | `{ pendingCheckins, handleComplete, handleDismiss }` |
| `useExerciseFilter()` | `features/train/hooks/useExerciseFilter.js` | `{ filteredExercises, activeFilter, setActiveFilter }` |
| `useSessionTimer()` | `features/train/engine/useSessionTimer.js` | timer state + pause/resume controls |
| `useAdaptiveLadder(id)` | `features/train/engine/useAdaptiveLadder.js` | `{ currentLevel, recordCorrect, recordMiss, saveLevel }` |
| `useStreakMultiplier()` | `features/train/engine/useStreakMultiplier.js` | `{ streakCount, multiplier, recordCorrect, recordMiss, reset }` |
| `useSignalChainEngine()` | `features/train/games/SignalChain/` | sequence state machine |
| `useFlashSortEngine()` | `features/train/games/FlashSort/` | shape/distractor state machine |
| `useInsights()` | `features/insights/hooks/useInsights.js` | `{ cognitiveScore, domainScores, scoreHistory, weeklyBrief }` |
| `useProfileStats()` | `features/profile/hooks/useProfileStats.js` | `{ totalSessions, avgScore, streakDays }` |

---

## 16. Shared Component API Reference

### `ConfirmModal`
```jsx
<ConfirmModal
  visible={bool}
  title="exit session?"
  body="your progress will be saved if you've completed enough rounds."
  cancelText="keep playing"
  confirmText="exit"
  onCancel={() => setVisible(false)}
  onConfirm={() => { setVisible(false); executeExit(); }}
  Colors={Colors}
/>
```

### `ScoreDisplay`
```jsx
<ScoreDisplay score={visualScore} />
// Renders score in semiBold h2 + "pts" micro label + animated float-up +X deltas
```

### `SessionTimerBar`
```jsx
<SessionTimerBar activeTimeElapsed={ms} totalDuration={60000} pulse={false} />
// pulse=true for LighthouseWatch 15s attention blink
```

### `DomainTile`
```jsx
<DomainTile domain="memory" score={712} trend={1} onPress={fn} />
// trend: 1=up, -1=down, 0=flat
```

### `ExerciseCard`
```jsx
<ExerciseCard exercise={exerciseObj} onPress={fn} locked={false} />
// 4-row card: domain pill + difficulty dots / name / description / duration
```

### `PillButton`
```jsx
<PillButton label="Start" onPress={fn} variant="primary" disabled={false} />
// variant: 'primary' | 'secondary' | 'ghost'
```

### `TouchableScale`
```jsx
<TouchableScale onPress={fn} scaleTo={0.95}><View /></TouchableScale>
```

### `FadeInUp`
```jsx
<FadeInUp delay={200} distance={20} duration={500} style={...}><View /></FadeInUp>
```

---

## 17. Architectural Rules (Do Not Break)

1. **Data never imports UI.** `src/data/*.js` must have zero imports from `theme.js` or any component.
2. **Use action creators.** Never `dispatch({ type: 'RAW' })` — import from `store/actions/index.js`.
3. **Use strings.** Never hardcode visible text in JSX — add to `strings.csv`, run `npm run strings`, use `t()`.
4. **Root reducer chains, never spreads in parallel.** See Section 4.
5. **Screens are thin.** Logic goes in engine hooks or game hooks. Screens just render.
6. **Services are the API boundary.** Data fetching logic stays in `services/` only.
7. **Theme is reactive.** Always `useThemeColors()` inside components. Never import `LightColors` directly in UI.
8. **`UIComponents.js` is a barrel only.** Create new shared components in `shared/components/`.
9. **Bottom tab safe area.** Every main screen: `paddingTop: insets.top` + `height: 100` bottom spacer.
10. **Game constants live in `gameConfig.js`.** Never hardcode timing, scoring, or level params in game files.
11. **Legacy files.** `FlashSortGame.js`, `SequenceRecallGame.js`, `WordMatchGame.js` in `features/train/screens/` are unused. The canonical game code is in `features/train/games/`.

---

## 18. Known Patterns & Gotchas

- **Root reducer MUST chain.** Parallel spread causes silent data loss on cross-slice actions.
- **InsightsScreen self-heal.** Checks for `mood` field on mount; add new schema field checks here for backwards compatibility.
- **Eager Evaluation & Modals in Stack ("Play Again" Crash)**: When navigating from a result dashboard back to the active session modal, React Navigation pops the stack and re-uses the active session screen. During re-rendering, `ContextSwitch` can render with `stimulus` initially reset to `null`. Simple short-circuiting (`stimulus && (...)`) can cause Babel-transpiled eager-evaluation crashes on `.shape` access. Using an explicit ternary condition `stimulus ? ( ... ) : false` combined with optional-chaining (`stimulus?.shape`) completely shields the logic.
- **Pearson Zero-Variance Guard**: If user scored logs or habits are completely flat (e.g., repeating the same rating), the standard deviation resolves to zero. During Pearson calculations, this standard deviation product in the denominator produces a division-by-zero (`NaN`) crash. A strict boundary standard deviation fallback of `0.0001` serves as an absolute safeguard.
- **Rational Inverse CDF Perfect-Score Bounds**: In Signal Detection Theory ($d'$ calculations), standard CDF inverse calculations produce infinite boundaries for perfect boundary cases ($100\%$ hit rate or $0\%$ false alarm rate). Applying continuous corrections ($\pm 0.5 / n$) prevents mathematical breakdown and runtime crashes.
- **`getDomains(Colors)` per-render.** Cheap but could be memoized at module level if needed.
- **`expo-blur BlurView`** degrades gracefully on Android to solid `backgroundColor`.
- **AssessmentScreens.js** is ~800 lines — candidate for splitting into feature modules.
- **FlashSort split-screen.** The old `showTapZoneTutorial` state is still present but no longer drives any UI — the permanent split-screen replaced it. The AsyncStorage key is still written on first 3 rounds.
- **Signal Chain `countdown` phase.** Uses 300ms intervals (vs 400ms for all other games) — faster countdown matches the memory game's pace.
- **`normaliseSessionScore` vs `normaliseFlashSortSessionScore`.** Signal Chain uses completion-based scoring; Flash Sort uses reaction-time-based scoring. Both scale to 0-100 then ×10 for domain update.
- **`exerciseService.getDailyWorkout()`** uses LCG deterministic daily seed — same 4 exercises every time the same calendar date is queried.
- **Web support.** App compiles for web via `npx expo export -p web`. Not all features identical but builds cleanly.
- **Dummy data verification.** Run `node scripts/verifyInsights.js` to validate dummyData produces meaningful insights across all 4 Weekly Brief zones.

---

## 19. Quick-Start Commands

```bash
# Install dependencies
npm install

# Compile string translations (always run after editing strings.csv)
npm run strings

# Start dev server (Expo Go compatible)
npm start

# Run on iOS simulator
npm run ios

# Run on Android
npm run android

# Build and verify web export (catches compile errors)
npx expo export -p web

# Validate insights pipeline against dummyData
node scripts/verifyInsights.js
```

---

## 20. Dependency Graph (Simplified)

```
App.js
 └── AppProvider (context/AppContext.js)
      └── RootNavigator (navigation/index.js)
           ├── OnboardingNavigator
           │    └── WelcomeScreen → IntentScreen → QuickProfileScreen
           │         → AssessmentScreens → ProjectionScreen → MainApp
           └── AppStackNavigator
                ├── MainTabs (Bottom Tabs)
                │    ├── HomeScreen
                │    │    ├── useGreeting, useCheckins → useApp → sessionSlice
                │    │    ├── ScoreRing, WorkoutCard, CheckinCard, InsightCard, DomainTile
                │    ├── TrainScreen
                │    │    ├── useExerciseFilter → exercises.js
                │    │    └── ExerciseCard
                │    ├── InsightsScreen
                │    │    ├── useInsights → useApp → scoresSlice
                │    │    ├── ScoreGraph, DomainRadar, ProjectionGraph
                │    └── ProfileScreen
                │         └── useProfileStats → useApp
                ├── ActiveSessionScreen (modal)
                │    ├── useSessionTimer, useAdaptiveLadder, useStreakMultiplier
                │    ├── scoring.js, GameHaptics
                │    ├── ScoreDisplay, SessionTimerBar, StreakBadge
                │    ├── ConfirmModal
                │    └── GAME_COMPONENTS dispatcher
                │         ├── SignalChain/ (useSignalChainEngine, Grid, Node, ...)
                │         ├── FlashSort/  (useFlashSortEngine, Shape, Zones, ...)
                │         ├── LighthouseWatch, ContextSwitch, WordWeave, PatternFold
                └── SessionResultScreen (modal)
                     └── navigation.navigate('TrainRoot' | 'ActiveSession')
```
