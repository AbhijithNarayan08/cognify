# Cognify — Complete Project Knowledge Graph
> **For any LLM or developer joining this project.** Read this top to bottom once and you will have full context to make changes anywhere in the codebase.

---

## 1. What This App Is

**Cognify** is a React Native (Expo) mobile app for **cognitive fitness** — think Headspace but for your brain. Users:
1. Complete a brief **onboarding** (intent → profile → 6-exercise cognitive assessment)
2. Receive a **cognitive score** (400–1000 range) broken across 6 **domains**
3. Do a **daily workout** (4 exercises, ~15 min) to improve their score
4. Log **lifestyle check-ins** (sleep, activity, mood)
5. View **Insights** — score history chart, domain radar, weekly brief

**Design Language:** Headspace-inspired. Playful, warm, lowercase everything, rounded shapes, vibrant domain colours. A blue whale mascot (`usemascot.png`) features on the splash screen.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | Expo ~51.0 / RN 0.74.1 |
| Navigation | React Navigation (Stack + Bottom Tabs) | v6 |
| State | React Context + useReducer (sliced) | — |
| Animations | React Native Animated API (native driver) | — |
| UI Icons | lucide-react-native | ^1.16.0 |
| SVG | react-native-svg | 15.2.0 |
| Blur | expo-blur (BlurView) | ~13.0.3 |
| Haptics | expo-haptics | ~13.0.1 |
| Fonts | @expo-google-fonts/plus-jakarta-sans | ^0.2.3 |
| Gradients | expo-linear-gradient | ~13.0.2 |
| Safe Area | react-native-safe-area-context | 4.10.1 |
| Gestures | react-native-gesture-handler | ~2.16.1 |
| Web | react-native-web | ~0.19.10 |
| Linting | ESLint (config in .eslintrc.json) | — |

**No TypeScript** — all files are `.js`. No Zustand, Redux, or React Query — state is pure Context+useReducer.

---

## 3. Complete Folder Structure

```
cognify/
├── App.js                          # Root entry point — fonts, providers, RootNavigator
├── app.json                        # Expo config (name, slug, icons)
├── package.json
├── babel.config.js
├── scripts/
├── assets/
│   ├── characters/
│   │   ├── cat_half_page.png       # Used in TrainScreen banner & Insights weekly brief
│   │   ├── cat_full_page.png       # Unused (was old WelcomeScreen)
│   │   └── usemascot.png           # Blue whale mascot on WelcomeScreen (user-provided)
│   ├── icon.png
│   └── splash.png
└── src/
      ├── constants/
      │   ├── translations/
      │   │   └── en.json             # Flat translation dictionary for i18n
      │   └── useStrings.js           # Runtime translation lookup module exposing t() and useStrings()
      ├── i18n.js                     # Global i18n translation system configuration
    ├── context/
    │   └── AppContext.js           # Root context: composes 3 slices, exports useApp()
    ├── store/
    │   ├── slices/
    │   │   ├── onboardingSlice.js  # State: onboardingComplete, intent, profile
    │   │   ├── scoresSlice.js      # State: cognitiveScore, domainScores, brainAge, scoreHistory
    │   │   └── sessionSlice.js     # State: workoutComplete, workoutInProgress, checkins, streakDays
    │   └── actions/
    │       └── index.js            # Typed action creators (use these, not raw dispatch)
    ├── services/
    │   ├── exerciseService.js      # Data access for exercises (swap for real API)
    │   ├── scoreService.js         # Score calculation logic
    │   └── insightService.js       # Resolves insight templates with theme colours
    ├── data/
    │   └── exercises.js            # Pure static data — NO UI/theme imports
    ├── theme.js                    # Design tokens: colours, typography, spacing, radius, shadow, motion
    ├── navigation/
    │   └── index.js                # RootNavigator, OnboardingNavigator, MainApp (tabs), HomeStack, TrainStack
    ├── components/                 # Legacy barrel exports (backward-compat)
    │   ├── UIComponents.js         # Re-exports from shared/components/ — DO NOT add code here
    │   ├── Motion.js               # TouchableScale + FadeInUp — also copied to shared/motion/
    │   ├── ScoreRing.js            # Circular score display with arc
    │   ├── DomainRadar.js          # SVG hexagonal radar chart for 6 domains
    │   └── MoodShapes.js           # Custom SVG mood character shapes
    ├── shared/                     # Feature-agnostic shared code
    │   ├── components/
    │   │   ├── DomainTile.js       # Domain score + trend tile (used in HomeScreen grid)
    │   │   ├── InsightCard.js      # Insight card (resolves domain colours internally)
    │   │   ├── WorkoutCard.js      # Today's workout summary card
    │   │   ├── CheckinCard.js      # Sleep/activity/mood check-in card
    │   │   ├── ExerciseCard.js     # Individual exercise card in train grid
    │   │   ├── SectionHeader.js    # Row label with optional "see all" action
    │   │   ├── PillButton.js       # Branded rounded CTA button
    │   │   ├── ScoreRing.js        # Copy of ScoreRing (canonical location)
    │   │   ├── DomainRadar.js      # Copy of DomainRadar (canonical location)
    │   │   └── MoodShapes.js       # Copy of MoodShapes (canonical location)
    │   ├── motion/
    │   │   └── Motion.js           # TouchableScale + FadeInUp animation primitives
    │   └── error/
    │       └── ErrorBoundary.js    # Class-based error boundary with retry UI
    ├── features/                   # Feature modules (plug-and-play)
    │   ├── onboarding/
    │   │   ├── screens/            # (barrel — actual screens in screens/onboarding/)
    │   │   └── hooks/              # (empty — to be filled as onboarding grows)
    │   ├── home/
    │   │   ├── hooks/
    │   │   │   ├── useGreeting.js  # Returns time-of-day greeting string
    │   │   │   └── useCheckins.js  # Manages pending check-ins + dispatch
    │   │   └── components/         # Home-specific components (empty, ready to use)
    │   ├── train/
    │   │   ├── screens/
    │   │   │   ├── TrainScreen.js         # Browse exercises (uses FlatList + useExerciseFilter)
    │   │   │   └── ActiveSessionScreen.js # Session runner (uses useSessionEngine)
    │   │   └── hooks/
    │   │       ├── useSessionEngine.js    # Full session state machine (timer, phases, scores)
    │   │       └── useExerciseFilter.js   # Domain filter state + filtered exercise list
    │   ├── insights/
    │   │   └── hooks/
    │   │       └── useInsights.js  # Derives insights data from app state
    │   └── profile/
    │       └── hooks/
    │           └── useProfileStats.js # Derives totalSessions, avgScore, streakDays
    └── screens/                    # Legacy screen locations (barrel re-exports or originals)
        ├── main/
        │   ├── HomeScreen.js       # Main home screen (uses useGreeting, useCheckins)
        │   ├── TrainScreen.js      # Barrel → features/train/screens/
        │   ├── InsightsScreen.js   # Score chart + domain radar + weekly brief
        │   └── ProfileScreen.js    # Settings + stats (zero prop drilling)
        └── onboarding/
            ├── WelcomeScreen.js    # Splash: mascot + cloud SVGs + terms checkbox
            ├── IntentScreen.js     # "What brings you here?" — 4 intent cards
            ├── QuickProfileScreen.js  # Age, sleep, activity profile questions
            └── AssessmentScreens.js   # 4 exported screens: Intro, Assessment, Processing, Results
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
│   └── scoreHistory: [{ date, score }]  (30-day mock array)
└── sessionReducer  (store/slices/sessionSlice.js)
    ├── workoutComplete: boolean
    ├── workoutInProgress: boolean
    ├── checkins: { sleep, activity, mood }  (null until user logs)
    └── streakDays: number
```

### How to Dispatch
**Always use typed action creators from `store/actions/index.js`:**
```js
import { setIntent, completeWorkout, setCheckin, resetApp } from '../../store/actions';
const { dispatch } = useApp();
dispatch(setIntent('sharpen'));
dispatch(completeWorkout());
dispatch(setCheckin('sleep', 4));
```

**Never use raw dispatch** (`dispatch({ type: 'RAW_STRING' })`) — it's error-prone and breaks refactoring.

### Reading State
```js
const { state } = useApp();
// state.cognitiveScore, state.domainScores, state.checkins, etc.
```

### Key Routing Logic
In `navigation/index.js`, the root navigator checks `state.onboardingComplete`:
- `false` → `OnboardingNavigator` (Welcome → Intent → QuickProfile → AssessmentIntro → Assessment → Processing → Results → MainApp)
- `true` → `MainApp` (Bottom Tab Navigator)

---

## 5. Navigation Structure

```
RootNavigator (context-driven)
├── OnboardingNavigator (Stack)
│   ├── Welcome          → WelcomeScreen.js
│   ├── Intent           → IntentScreen.js
│   ├── QuickProfile     → QuickProfileScreen.js
│   ├── AssessmentIntro  → AssessmentIntroScreen
│   ├── Assessment       → AssessmentScreen
│   ├── Processing       → ProcessingScreen
│   ├── Results          → ResultsScreen
│   └── MainApp          → (switches to tab navigator)
└── MainApp (Bottom Tab Navigator — iOS glass BlurView background)
    ├── Home    (HomeStack → HomeScreen)
    ├── Train   (TrainStack → TrainScreen → ActiveSession modal)
    ├── Insights (InsightsScreen)
    └── Profile  (ProfileScreen)
```

**Bottom tab bar** uses `expo-blur` `BlurView` with `tint=light|dark` for iOS glass navigation. Position is `absolute` so content scrolls under it — screens must add `paddingBottom` or use `height: 100` spacer at the bottom.

---

## 6. Design System (theme.js)

### Colour Palette
| Token | Light | Dark | Usage |
|---|---|---|---|
| `brandPrimary` | `#FF7A00` (orange) | same | CTAs, active states |
| `coral` | `#FF5E5B` | same | Score delta, emphasis |
| `appBg` | `#F9F4F2` (warm grey) | `#141313` | Screen backgrounds |
| `surface` | `#FFFFFF` | `#222120` | Cards |
| `textPrimary` | `#141313` | `#FFFFFF` | Main text |

### Domain Colours
| Domain ID | Light Main | Usage |
|---|---|---|
| `memory` | `#0073E6` (deep blue) | Memory exercises |
| `speed` | `#FFC000` (yellow) | Processing speed |
| `attention` | `#3DAB7F` (green) | Attention tasks |
| `executive` | `#A662C6` (purple) | Executive function |
| `verbal` | `#FF7A00` (orange) | Verbal/language |
| `spatial` | `#FF7DB4` (pink) | Spatial cognition |

### Typography (Plus Jakarta Sans)
```js
Typography.fontFamily.regular    // PlusJakartaSans_400Regular
Typography.fontFamily.medium     // PlusJakartaSans_500Medium
Typography.fontFamily.semiBold   // PlusJakartaSans_600SemiBold
Typography.fontFamily.bold       // PlusJakartaSans_700Bold
Typography.fontFamily.extraBold  // PlusJakartaSans_800ExtraBold

Typography.size.h1      // 32pt — screen titles
Typography.size.h2      // 28pt — card titles
Typography.size.h3      // 20pt — sub-headings
Typography.size.body    // 16pt — body copy
Typography.size.label   // 15pt — labels, chips
Typography.size.caption // 13pt — meta, muted text
```

### Spacing Scale
`Spacing[1]=4, [2]=8, [3]=12, [4]=16, [5]=20, [6]=24, [8]=32, [10]=40, [12]=48, [16]=64`

### Radius
`Radius.sm=12, .md=16, .lg=24, .xl=32, .full=999`

### Using the Theme in Components
```js
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';

const Colors = useThemeColors();          // reactive to dark/light mode
const DOMAINS = getDomains(Colors);       // array of 6 domain objects with colour + icon
const styles = useMemo(() => StyleSheet.create({...}), [Colors]);
```

**`Colors` is reactive** — always call `useThemeColors()` inside the component, never import `LightColors` directly in UI code.

---

## 7. Animation System (shared/motion/Motion.js)

### `TouchableScale`
Spring-based press animation. Use instead of `TouchableOpacity` for premium feel.
```jsx
<TouchableScale onPress={fn} scaleTo={0.95}>
  <View>...</View>
</TouchableScale>
```

### `FadeInUp`
Entrance animation: fades in + slides up from `distance` pixels.
```jsx
<FadeInUp delay={200} duration={500} distance={20} style={...}>
  <Card />
</FadeInUp>
```

**Stagger pattern** — use incrementing delays for cascade effect:
```jsx
{items.map((item, i) => (
  <FadeInUp key={item.id} delay={100 + i * 50}>
    <Item />
  </FadeInUp>
))}
```

---

## 8. Data Layer

### `src/data/exercises.js` — Pure Static Data
**RULE: No imports from UI or theme.** This file exports only plain JS objects.

- `EXERCISES` — array of 6 exercise objects: `{ id, name, domain, duration, difficulty, description, instruction, type }`
- `DAILY_WORKOUT` — 4-item subset of EXERCISES (indices 0, 1, 4, 5)
- `FLASH_SORT_STIMULI` — array of `{ shape: 'circle'|'square', correct: 'left'|'right' }` for the Flash Sort game
- `INSIGHT_TEMPLATES` — array of `{ id, headline, body, domain }` — **no colours** (resolved at render time)
- `WEEKLY_BRIEF` — `{ scoreRecap, topMoment, lifestyleHighlight, weekFocus }` strings

### Cognitive Domains
The 6 domains and their IDs (used everywhere as keys):
`memory | speed | attention | executive | verbal | spatial`

### Score Range
- Min: 400, Max: 980 (from `generateMockHistory` clamp)
- After assessment: score generated from assessment answers
- After daily workout: `cognitiveScore += random(5–25)`

---

## 9. Screen-by-Screen Reference

### WelcomeScreen (`screens/onboarding/WelcomeScreen.js`)
- Yellow curved top section (SVG circle hack for curve)
- Floating `Cloud` and `StarElement` SVG decorations
- Blue whale mascot (`assets/characters/usemascot.png`) with `FadeInUp`
- Taglines from `STRINGS.onboarding.welcome`
- Terms checkbox (must be checked to enable "Create an account")
- Navigates to `Intent` on CTA press

### IntentScreen (`screens/onboarding/IntentScreen.js`)
- 4 intent cards in 2×2 grid
- Intent IDs: `sharpen, focus, protect, curious`
- On select: dispatches `setIntent(id)` → auto-navigates to `QuickProfile` after 350ms
- Labels/descriptions come from `STRINGS.onboarding.intent`

### QuickProfileScreen (`screens/onboarding/QuickProfileScreen.js`)
- Multi-step (age range → sleep → activity level)
- Dispatches `SET_PROFILE`

### AssessmentScreens (`screens/onboarding/AssessmentScreens.js`)
- **4 exported components**: `AssessmentIntroScreen`, `AssessmentScreen`, `ProcessingScreen`, `ResultsScreen`
- `AssessmentIntroScreen`: floating domain orbs, FAQ accordion, "begin" CTA
- `AssessmentScreen`: 6 exercises in sequence — each exercise is a different cognitive puzzle
- `ProcessingScreen`: animated "calculating" screen (fake loading)
- `ResultsScreen`: reveals cognitiveScore with animation, dispatches `COMPLETE_ASSESSMENT` + `COMPLETE_ONBOARDING`, navigates to `MainApp`

### HomeScreen (`screens/main/HomeScreen.js`)
- Sticky header (fades in on scroll via `Animated.event`)
- Greeting: `useGreeting()` hook (time-based string)
- Score ring: `ScoreRing` component (score + delta)
- Cohort text: "stronger than X% of people your age"
- `WorkoutCard` → navigates to `Train > ActiveSession`
- Check-in cards: `useCheckins()` hook → horizontal `ScrollView` of `CheckinCard`s
- Insight card (first template from `INSIGHT_TEMPLATES`)
- Domain grid: 3 columns, `DomainTile` per domain
- Weekly brief teaser card → navigates to `Insights`

### TrainScreen (`features/train/screens/TrainScreen.js`)
- Domain filter pills (horizontal `ScrollView`)
- `useExerciseFilter()` → `filteredExercises` + `activeFilter`
- `FlatList` with `numColumns={2}` (replaced ScrollView+map)
- Workout banner (when filter = 'all'): `cat_half_page.png` + start button
- Each exercise card → `ExerciseCard` → navigates to `ActiveSession`

### ActiveSessionScreen (`features/train/screens/ActiveSessionScreen.js`)
- **Pure presentation** — all logic in `useSessionEngine(exercises)`
- Phases: `intro` → `playing` → `transition` → `intro`... → `complete`
- **Intro**: exercise name, description, instruction box, start button
- **Playing**: timer bar, stimulus (Circle or Square SVG), two response buttons
- **Transition**: score reveal, "next up" preview
- **Complete**: total delta score, breakdown list, "done" button
- Game: Flash Sort — user taps LEFT for circle, RIGHT for square

### InsightsScreen (`screens/main/InsightsScreen.js`)
- Two tabs: `overview` and `weekly brief`
- **Overview**: `ScoreGraph` (SVG polyline chart, 30-day history), `DomainRadar`, domain bar list, `InsightCard`s, quarterly report teaser
- **Weekly Brief**: date, headline, cat illustration, 4 coloured sections from `WEEKLY_BRIEF`
- Uses `useInsights()` hook

### ProfileScreen (`screens/main/ProfileScreen.js`)
- Stats card (streak, sessions, avg score) from `useProfileStats()`
- Domain highlights row (top 3 domains)
- Settings sections: Your Plan, Notifications, Account, About
- `SettingRow` and `Section` components — **self-contained**, no prop drilling
- Reset button → dispatches `resetApp()`

---

## 10. Key Custom Hooks Reference

| Hook | File | Returns |
|---|---|---|
| `useApp()` | `context/AppContext.js` | `{ state, dispatch }` |
| `useThemeColors()` | `theme.js` | `Colors` object (light/dark reactive) |
| `useGreeting()` | `features/home/hooks/useGreeting.js` | greeting string |
| `useCheckins()` | `features/home/hooks/useCheckins.js` | `{ pendingCheckins, handleComplete, handleDismiss }` |
| `useExerciseFilter()` | `features/train/hooks/useExerciseFilter.js` | `{ filters, filteredExercises, activeFilter, setActiveFilter, DOMAINS }` |
| `useSessionEngine(exercises)` | `features/train/hooks/useSessionEngine.js` | session state + animation values + actions |
| `useInsights()` | `features/insights/hooks/useInsights.js` | `{ cognitiveScore, domainScores, scoreHistory, insightTemplates, weeklyBrief, last7Avg }` |
| `useProfileStats()` | `features/profile/hooks/useProfileStats.js` | `{ totalSessions, avgScore, streakDays }` |

---

## 11. Services Layer (stub — ready for real API)

All three services currently return static mock data. **To connect a real backend**, swap the implementation inside the service — screens and hooks never need to change.

```
services/exerciseService.js   → getAll(), getDailyWorkout(), getById(id), getFlashSortStimuli()
services/scoreService.js      → generateHistory(base), calculateExerciseScore(correct, total), getRecentAverage(history, n)
services/insightService.js    → getTemplates(Colors), getWeeklyBrief()
```

---

## 12. String Constants (Localization)

All UI text lives in `src/constants/translations/en.json` as a flat JSON dictionary.

At runtime, strings are resolved dynamically using `i18next` and `react-i18next`. To maintain full backward compatibility, the `t(key, vars)` utility and `useStrings()` hook from `src/constants/useStrings.js` are used:

```js
import { t, useStrings } from '../../constants/useStrings';

// Static translation (non-reactive to language switch at runtime)
t('onboarding.welcome.title');                              // "welcome to cognify"
t('home.cohortText', { percentile: 68 });                  // "stronger than 68% of people your age"

// Hook-based translation (reactive to language switch)
const { t } = useStrings();
t('train.domainExercises', { domain: 'attention' });       // "attention exercises"
```

**Editing Translations**:
- When adding or modifying user-facing text, edit `src/constants/translations/en.json` directly.
- Ensure interpolation variables are in double curly braces `{{var}}`.
- No build or compilation step is required. The translations are loaded dynamically.

**Text UX Rules**:
- Every visible UI text string must be written in **lowercase** for UI chrome (tab labels, headers, button labels).
- Sentence case should be used for prose.
- Exclamation marks are completely banned.
- Never hardcode visible user-facing text inside JSX components. Always add it to `en.json` first.

---

## 13. Assets

| File | Where Used |
|---|---|
| `assets/characters/usemascot.png` | WelcomeScreen splash (user's custom blue whale) |
| `assets/characters/cat_half_page.png` | TrainScreen workout banner + InsightsScreen weekly brief illustration |
| `assets/characters/cat_full_page.png` | Unused (was previous WelcomeScreen character) |
| Fonts (via expo-google-fonts) | Loaded in `App.js` via `useFonts()`, shown after splash screen hides |

---

## 14. Shared Component API Reference

### `DomainTile`
```jsx
<DomainTile domain="memory" score={712} trend={1} onPress={fn} />
// trend: 1=up, -1=down, 0=flat
```

### `InsightCard`
```jsx
<InsightCard headline="..." body="..." domain="attention" onPress={fn} />
// domain key resolves colours automatically — no need to pass accent/bg
```

### `WorkoutCard`
```jsx
<WorkoutCard exercises={DAILY_WORKOUT} onStart={fn} isComplete={false} inProgress={false} />
```

### `CheckinCard`
```jsx
<CheckinCard type="sleep" onComplete={(value) => {}} onSkip={() => {}} />
// type: 'sleep' | 'activity' | 'mood'
// onComplete receives index (0-4) of selected option
```

### `ExerciseCard`
```jsx
<ExerciseCard exercise={exerciseObject} onPress={fn} locked={false} />
```

### `PillButton`
```jsx
<PillButton label="Start" onPress={fn} variant="primary" disabled={false} />
// variant: 'primary' | 'secondary' | 'ghost'
```

### `SectionHeader`
```jsx
<SectionHeader title="your domains" action="see all" onAction={fn} />
```

### `TouchableScale`
```jsx
<TouchableScale onPress={fn} scaleTo={0.95}><View /></TouchableScale>
```

### `FadeInUp`
```jsx
<FadeInUp delay={200} distance={20} duration={500} style={...}><View /></FadeInUp>
```

### `ScoreRing`
Circular progress ring. Accepts `score` (400–1000) and `delta` (+N points).

### `DomainRadar`
Hexagonal SVG radar chart. Accepts `scores` (domain score object) and `size`.

### `ErrorBoundary`
```jsx
<ErrorBoundary fallback={<Text>Oops</Text>}><Screen /></ErrorBoundary>
```

---

## 15. Architectural Rules (Do Not Break)

1. **Data never imports UI.** `src/data/*.js` must have zero imports from `theme.js` or any component.
2. **Use action creators.** Never call `dispatch({ type: 'RAW' })` — import from `store/actions/index.js`.
3. **Use STRINGS.** Never hardcode visible text in JSX — add to `src/constants/translations/en.json`. Always use `t()` utility or the `useStrings()` hook for UI labels.
4. **Screens are thin.** Logic goes in hooks (`features/*/hooks/`). Screens just render.
5. **Services are the API boundary.** Data fetching logic goes in `services/` — not in hooks or screens.
6. **Theme is reactive.** Always `useThemeColors()` inside components — never import `LightColors` directly in UI.
7. **`UIComponents.js` is a barrel only.** Never add new code to it — create in `shared/components/` instead.
8. **Bottom tab safe area.** Every main screen must add `paddingTop: insets.top` and a `height: 100` bottom spacer (tab bar is `position: absolute`).

---

## 16. Known Patterns & Gotchas

- **`getDomains(Colors)` is called per-render.** It's cheap but could be memoized at module level for further optimization.
- **`expo-blur` BlurView** doesn't work on all Android versions — the tab bar degrades gracefully to `backgroundColor`.
- **Assessment screen** (`AssessmentScreens.js`) is 800 lines — the next big file to split into feature modules.
- **Mock data**: Everything is static. `scoreHistory` is generated in `scoresSlice.js → generateMockHistory()` when onboarding completes. No persistence — state resets on app restart.
- **Font loading**: `App.js` calls `useFonts()`. If fonts fail, `fontError` is truthy and the app proceeds anyway (graceful degradation). `SplashScreen.hideAsync()` is called from `onLayout` callback once fonts are ready.
- **Web support**: The app compiles for web via `npx expo export -p web`. Not all features look identical but it builds cleanly.

---

## 17. Quick-Start Commands

```bash
# Install dependencies
npm install

# Start dev server (Expo Go compatible)
npm start

# Run on iOS simulator
npm run ios

# Run on Android
npm run android

# Build and verify web export (use this to check for compile errors)
npx expo export -p web

# Run web dev server
npm run web
```

---

## 18. Dependency Graph (Simplified)

```
App.js
 └── AppProvider (context/AppContext.js)
      └── RootNavigator (navigation/index.js)
           ├── OnboardingNavigator
           │    └── WelcomeScreen → IntentScreen → QuickProfileScreen
           │         → AssessmentIntroScreen → AssessmentScreen
           │         → ProcessingScreen → ResultsScreen
           └── MainApp (Bottom Tabs)
                ├── HomeScreen
                │    ├── useGreeting
                │    ├── useCheckins → useApp → sessionSlice
                │    ├── ScoreRing
                │    ├── WorkoutCard → DAILY_WORKOUT (data)
                │    ├── CheckinCard
                │    ├── InsightCard → INSIGHT_TEMPLATES (data)
                │    └── DomainTile → getDomains(Colors)
                ├── TrainScreen (features/train)
                │    ├── useExerciseFilter → EXERCISES (data)
                │    └── ExerciseCard
                │         └── ActiveSessionScreen (modal)
                │              └── useSessionEngine → dispatch(completeWorkout())
                ├── InsightsScreen
                │    ├── useInsights → useApp → scoresSlice
                │    ├── ScoreGraph (SVG)
                │    ├── DomainRadar (SVG)
                │    └── InsightCard
                └── ProfileScreen
                     ├── useProfileStats → useApp → scoresSlice + sessionSlice
                     ├── SettingRow (self-contained)
                     └── Section (self-contained)
```
