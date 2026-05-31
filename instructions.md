# Cognify — PM Analysis & Implementation Guide
> **For the LLM working on this codebase.** You have the full knowledge graph. This document answers 28 product questions and tells you exactly what to change, where, and why. Read each section, then act on the instructions.

---

## How to use this document

Each question includes:
- **The problem** — what's wrong or missing
- **What to do** — specific files, functions, and code changes
- **Priority** — `P0` (do now), `P1` (do soon), `P2` (do eventually)

Work top to bottom within each section. Don't skip the Architecture section — it unblocks everything else.

---

## Section 1 — Onboarding

---

### Q1: Drop-off risk during the 6-exercise assessment

**The problem:** The assessment is a linear sequence of 6 exercises with no save/resume and no visible progress. Users who get interrupted mid-assessment lose all progress on app restart because there is zero persistence. This is the highest-friction moment in the entire onboarding funnel.

**What to do:**

1. **Add a progress bar to `AssessmentScreen` in `screens/onboarding/AssessmentScreens.js`.** The screen already runs exercises in sequence — you know the current exercise index and the total count. Add a thin bar at the top:
   ```jsx
   // At the top of the AssessmentScreen render, above the exercise content:
   <View style={{ height: 4, backgroundColor: Colors.surface, borderRadius: Radius.full }}>
     <Animated.View style={{
       height: 4,
       width: `${((currentIndex + 1) / TOTAL_EXERCISES) * 100}%`,
       backgroundColor: Colors.brandPrimary,
       borderRadius: Radius.full,
     }} />
   </View>
   ```
   Track `currentIndex` in local state within `useSessionEngine` or directly in `AssessmentScreen`.

2. **Add a "save progress" escape hatch.** Because there is no backend yet, you cannot truly persist. Instead, if the user presses the system back button during assessment, show a confirmation modal:
   > "Your progress won't be saved. Are you sure you want to leave?"
   Use `useNavigation`'s `beforeRemove` listener in `AssessmentScreen` to intercept the back gesture.

3. **P1 — when persistence lands:** Persist `currentExerciseIndex` and the answers collected so far into AsyncStorage. On re-launch, if `onboardingComplete === false` and a partial assessment exists, route them to `AssessmentIntro` with a "continue where you left off" CTA instead of starting fresh.

**Priority: P1**

---

### Q2: Auto-navigation after 350ms on intent selection

**The problem:** In `IntentScreen`, selecting an intent dispatches `setIntent(id)` and then auto-navigates to `QuickProfile` after 350ms. If a user mis-taps or changes their mind, they get routed without any ability to correct. There is no visual confirmation that their selection was registered before the screen transitions away.

**What to do:**

1. **Show a selected state visually before navigating.** The 350ms gap already exists — use it. When a card is tapped, apply a "selected" style (border highlight using the domain colour, a checkmark icon) immediately on press, then let the 350ms timer navigate. This makes the delay feel intentional rather than laggy.
   ```jsx
   // In IntentScreen, add selectedIntent to local state
   const [selectedIntent, setSelectedIntent] = useState(null);

   const handleSelect = (id) => {
     setSelectedIntent(id);
     dispatch(setIntent(id));
     setTimeout(() => navigation.navigate('QuickProfile'), 350);
   };
   ```
   In the card styles, apply a highlighted border when `selectedIntent === card.id`.

2. **Do not add a confirmation dialog.** The 350ms is enough if the selected state is clear. A confirmation step adds friction on every single onboarding run — the cost is too high for the edge case it solves.

3. **Consider increasing to 500ms.** 350ms is on the edge of feeling abrupt on slower devices. 500ms gives the animation time to breathe and feels more premium consistent with the Headspace-inspired design language.

**Priority: P1**

---

### Q3: WelcomeScreen tone — does it build or erode trust?

**The problem:** The WelcomeScreen uses a yellow curved top, floating cloud and star SVG decorations, a blue whale mascot, and lowercase taglines. This aesthetic reads as playful/childlike. Cognitive fitness is health-adjacent — users may arrive with real concerns about memory, ageing, or focus. The tone needs to feel warm and approachable without signalling "toy app."

**What to do:**

1. **Keep the mascot — remove the decorative clouds and stars.** The whale mascot is brand-defining and warm. The clouds and stars (`StarElement`, `Cloud` SVG decorations) are the elements that tip the balance toward juvenile. Remove or significantly reduce them. A single subtle cloud is acceptable; a field of stars is not.

2. **Change at least one tagline to carry weight.** Open `src/constants/strings.js` and update `STRINGS.onboarding.welcome`. The current taglines should include at least one that speaks to outcomes ("Stay sharp. Think clearly. Age well.") rather than only playful brand voice. Put the playful line second, outcome line first.

3. **Do not change the colour palette or font.** Plus Jakarta Sans and the warm orange are correct for the target tone. The issue is decoration density, not the design system itself.

4. **Test with two user types:** someone who downloaded the app because of a family member with cognitive decline, and a 28-year-old professional wanting to be sharper. The WelcomeScreen should not alienate the first user while still delighting the second.

**Priority: P1**

---

### Q4: No backend — data resets on restart, retention risk

**The problem:** `onboardingComplete`, all scores, and all session data live purely in React Context. On app restart, everything resets. This means: a user who completes onboarding, does a workout, and then force-closes the app wakes up to the welcome screen again. This is a critical retention killer.

**What to do:**

1. **Immediate fix — persist `onboardingComplete` only.** This is the single highest-value persistence change because it stops forcing re-onboarding. Use `expo-secure-store` or plain `AsyncStorage`:
   ```js
   // In AppContext.js, after onboardingReducer runs COMPLETE_ONBOARDING:
   import AsyncStorage from '@react-native-async-storage/async-storage';

   // After dispatch resolves onboardingComplete = true:
   AsyncStorage.setItem('onboarding_complete', 'true');

   // In App.js or RootNavigator, on mount:
   const saved = await AsyncStorage.getItem('onboarding_complete');
   if (saved === 'true') dispatch(setOnboardingComplete());
   ```
   Add `@react-native-async-storage/async-storage` to `package.json` — it is Expo-compatible.

2. **Next — persist `cognitiveScore` and `scoreHistory`.** Scores are the core value proposition. Losing them destroys retention. After `COMPLETE_ASSESSMENT` and after `completeWorkout()`, write `cognitiveScore` and `scoreHistory` to AsyncStorage. Rehydrate in `scoresSlice.js`'s initial state using a async bootstrap in `AppContext.js`.

3. **Persist `streakDays` last.** Streaks require date-aware logic (checking if the user opened the app on consecutive days). Don't ship a broken streak counter. Wait until you have a reliable date-check utility before persisting this.

4. **Never show the streak counter if `streakDays === 0` and no persistence exists.** Hiding it until it has real data is better than showing "0 day streak" which actively discourages users.

**Priority: P0**

---

## Section 2 — Home Screen

---

### Q5: Home screen information density — is it too much?

**The problem:** The HomeScreen renders: sticky header, greeting, score ring with cohort text, workout card, horizontal check-in scroll, insight card, 6-domain grid (3 columns), and a weekly brief teaser. That is 8 distinct content zones on a single scroll. Most users will only care about 2–3 of these on any given day.

**What to do:**

1. **Establish a visual hierarchy with section spacing.** The components already exist — the problem is they have equal visual weight. Make the score ring + workout card the dominant hero section by increasing spacing above them (`Spacing[8]`) and reducing the size of lower sections. This alone will make the screen feel less overwhelming without removing any content.

2. **Collapse the domain grid by default.** Show 3 domains (the weakest ones, since those motivate training) and a "see all domains" expand control. The full 6-domain grid can live behind a single tap. In `HomeScreen.js`, add a `showAllDomains` local state boolean and conditionally slice the domains array:
   ```jsx
   const displayedDomains = showAllDomains ? DOMAINS : DOMAINS.slice(0, 3);
   ```

3. **Suppress the insight card and weekly brief teaser if the workout is incomplete.** These are reward/reflection content. Showing them before the user has done anything that day dilutes their purpose. Only render `InsightCard` and the weekly brief teaser after `workoutComplete === true`. When the workout is not yet done, the space below the check-ins can be clean whitespace — this is fine and premium.

4. **Do not remove the check-in scroll.** It serves daily engagement and lifestyle data. It stays.

**Priority: P1**

---

### Q6: Greeting is time-of-day only — make it contextual

**The problem:** `useGreeting.js` returns a time-based string ("good morning", "good afternoon", etc.) regardless of any other app state. This is the lowest-effort version of a greeting and wastes a high-visibility touchpoint.

**What to do:**

Open `src/features/home/hooks/useGreeting.js` and extend the logic. The hook already has access to app state via `useApp()`. Add these contextual overrides in priority order:

```js
// Priority 1 — first time user lands on home after onboarding
if (isFirstSession) return `welcome to cognify, ${firstName} 👋`;

// Priority 2 — day after a streak milestone (3, 7, 14, 30 days)
if (streakMilestone) return `${streakDays} days straight. you're building something real.`;

// Priority 3 — workout already complete today
if (workoutComplete) return `great work today, ${firstName}.`;

// Priority 4 — returning after a gap (streakDays === 0 but has prior history)
if (hadPreviousActivity && streakDays === 0) return `good to have you back.`;

// Priority 5 — default time-based
return timeBasedGreeting;
```

All strings go into `STRINGS.home.greetings` in `strings.js` — never hardcode in the hook.

**Priority: P2**

---

### Q7: What happens when all check-ins are skipped repeatedly?

**The problem:** If a user skips all check-ins every day, the `checkins` state stays `{ sleep: null, activity: null, mood: null }` indefinitely. The HomeScreen will keep showing 3 pending check-in cards forever. There is no dismissal memory, no "remind me later" logic, and no consequence to skipping.

**What to do:**

1. **Add a `checkinDismissedAt` timestamp to `sessionSlice.js`.** When the user skips a check-in, record the time. Don't re-show it for 6 hours. This prevents the cards from re-appearing every time the user opens the app within the same day.
   ```js
   // In sessionSlice.js initial state:
   checkinDismissedAt: { sleep: null, activity: null, mood: null }

   // In useCheckins.js, filter pending check-ins:
   const pendingCheckins = CHECKIN_TYPES.filter(type => {
     if (checkins[type] !== null) return false; // already completed
     const dismissedAt = checkinDismissedAt[type];
     if (dismissedAt && Date.now() - dismissedAt < 6 * 60 * 60 * 1000) return false; // dismissed recently
     return true;
   });
   ```

2. **If all 3 check-ins are null and none have been dismissed today, show only 1 check-in card at a time** — the highest-priority one (sleep first, then activity, then mood). Showing all 3 simultaneously is visually heavy and implies obligation. One card is a gentle nudge.

3. **After 7 consecutive days of skipping all check-ins,** stop showing them. Add an "enable check-ins" toggle in Profile settings so the user can re-enable if they change their mind.

**Priority: P1**

---

### Q8: Sticky header accessibility at mid-opacity

**The problem:** The sticky header fades in via `Animated.event` on scroll, which means there is a range of opacity values (e.g. 0.3–0.7) where header text exists in the DOM but is semi-transparent. At these intermediate values, the text may fail WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text) against the background.

**What to do:**

1. **Do not animate opacity on text — animate opacity on the header background only.** The header background fades in; the text inside it is either fully visible or fully hidden:
   ```jsx
   // Instead of fading the whole header container (which fades text too):
   <Animated.View style={{ opacity: headerOpacity, backgroundColor: Colors.surface }}>
     <Text style={{ opacity: 1 }}>Home</Text> {/* Text always at full opacity */}
   </Animated.View>
   ```
   This means text appears at full contrast the moment it appears at all.

2. **Alternative — snap the opacity.** Use `Animated.diffClamp` or a threshold check: the header is fully transparent until the scroll reaches a certain point, then immediately jumps to full opacity. No intermediate states.
   ```jsx
   const headerOpacity = scrollY.interpolate({
     inputRange: [60, 80],
     outputRange: [0, 1],
     extrapolate: 'clamp',
   });
   ```
   A 20px snap window is imperceptible to users but eliminates all intermediate opacity states.

3. **Test on both light and dark themes.** The `appBg` in light mode (`#F9F4F2`) and the surface colour (`#FFFFFF`) are close in value — ensure the header is visually distinct when fully opaque.

**Priority: P1**

---

## Section 3 — Train

---

### Q9: Content novelty — only 6 exercises, fixed daily workout

**The problem:** There are 6 total exercises and the daily workout is a hardcoded 4-item subset (indices 0, 1, 4, 5 of the `EXERCISES` array in `src/data/exercises.js`). Users will exhaust novelty within a week. The `DAILY_WORKOUT` constant never changes.

**What to do:**

1. **Make `getDailyWorkout()` in `services/exerciseService.js` rotate by day.** Use the current date as a seed to deterministically pick a different 4-exercise subset each day without requiring a backend:
   ```js
   export function getDailyWorkout() {
     const today = new Date();
     const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
     const shuffled = [...EXERCISES].sort((a, b) => {
       // Deterministic pseudo-shuffle using daySeed
       return ((daySeed * a.id) % 7) - ((daySeed * b.id) % 7);
     });
     return shuffled.slice(0, 4);
   }
   ```
   This gives the user a different workout every day with no backend. The same user on the same day always gets the same workout (deterministic), which matters for score consistency.

2. **Ensure every domain appears in the rotation.** Add a constraint: the daily 4 exercises must cover at least 4 different domains. Without this, a user could go days only training `memory` and `speed`.

3. **Add 5 more exercises per domain to `src/data/exercises.js` before launch.** You need a minimum of 36 exercises (6 domains × 6 exercises each) to sustain 30 days of varied content. The data structure already supports this — just populate it. Each exercise object is `{ id, name, domain, duration, difficulty, description, instruction, type }`.

**Priority: P0**

---

### Q10: Flash Sort is the only game mechanic — is it enough?

**The problem:** `ActiveSessionScreen` runs only one game type: Flash Sort, where the user taps LEFT for circle and RIGHT for square. All 4 exercises in a daily workout use this same binary-choice mechanic. There is no typing, dragging, sequencing, or memory recall interaction. Users will stop being challenged by the mechanic itself very quickly, even if the stimuli vary.

**What to do:**

The `exercise.type` field already exists on exercise objects. The `ActiveSessionScreen` currently ignores it and always renders Flash Sort. Use it to branch rendering:

1. **Define at least 3 exercise types in `src/data/exercises.js`:**
   - `flash_sort` — current left/right binary tap (circle/square)
   - `sequence_recall` — show a sequence of 4–6 coloured dots, hide them, ask user to reproduce the order
   - `word_match` — show a word, show 4 options, pick the correct category/synonym

2. **In `ActiveSessionScreen.js`, render the correct game component based on `exercise.type`:**
   ```jsx
   const GameComponent = {
     flash_sort: FlashSortGame,
     sequence_recall: SequenceRecallGame,
     word_match: WordMatchGame,
   }[exercise.type] ?? FlashSortGame;

   // In the 'playing' phase render:
   <GameComponent
     stimuli={stimuli}
     onAnswer={handleAnswer}
     timeRemaining={timeRemaining}
   />
   ```

3. **Extract the current Flash Sort rendering into its own `FlashSortGame.js` component** inside `features/train/screens/`. This unblocks adding new game types without touching the session runner. `useSessionEngine` stays unchanged — it only cares about `onAnswer(isCorrect)` callbacks.

**Priority: P0**

---

### Q11: Touch target sizes on small devices

**The problem:** Exercise cards in a 2-column FlatList grid and domain filter pills in a horizontal scroll are both interactive elements. On iPhone SE (320px wide), a 2-column grid leaves roughly 140px per card after padding. Filter pills with short labels (e.g. "all") may render as narrow as 40px wide. Apple HIG recommends 44×44pt minimum touch targets.

**What to do:**

1. **Set a minimum height on `ExerciseCard`** of 120pt regardless of content:
   ```js
   // In shared/components/ExerciseCard.js styles:
   card: {
     minHeight: 120,
     // ... existing styles
   }
   ```

2. **Add horizontal padding to filter pills** so even single-word labels have adequate tap area:
   ```js
   // In TrainScreen filter pill styles:
   pill: {
     paddingHorizontal: Spacing[4], // 16pt minimum each side
     paddingVertical: Spacing[3],   // 12pt minimum each side
     minWidth: 64,                  // prevents single-letter pills being tiny
   }
   ```

3. **Test on iPhone SE simulator specifically.** Run `npm run ios` and select the SE target. Anything below 44×44pt in the inspector should be fixed before ship.

**Priority: P1**

---

### Q12: Filter transitions and FlatList performance

**The problem:** When a user taps a domain filter pill, `useExerciseFilter` updates `activeFilter`, which triggers a re-render of the FlatList with a filtered `data` prop. With 6 exercises this is imperceptible. With 60+ exercises (the required content scale), rapid filter taps could cause jank because FlatList re-renders on every `data` change.

**What to do:**

1. **Memoize the filtered exercises array** in `useExerciseFilter.js`:
   ```js
   const filteredExercises = useMemo(
     () => activeFilter === 'all'
       ? EXERCISES
       : EXERCISES.filter(ex => ex.domain === activeFilter),
     [activeFilter]
   );
   ```
   This is likely already the pattern — verify it. If `filteredExercises` is computed inline in the hook body without `useMemo`, add it now.

2. **Add a `keyExtractor` to the FlatList** using `exercise.id` (not index). This allows FlatList to diff correctly across filter changes:
   ```jsx
   <FlatList keyExtractor={(item) => item.id.toString()} ... />
   ```

3. **Do not add skeleton loaders yet.** With static data there is no async gap to fill. Add skeletons only when `exerciseService.getAll()` becomes a real API call that has latency. Premature skeleton states add visual noise with no benefit.

4. **Add `getItemLayout` to FlatList** once card heights are fixed (see Q11). This eliminates layout calculation on scroll and is a significant perf win for taller lists:
   ```jsx
   getItemLayout={(data, index) => ({
     length: CARD_HEIGHT,
     offset: CARD_HEIGHT * Math.floor(index / 2), // numColumns=2
     index,
   })}
   ```

**Priority: P2**

---

## Section 4 — Insights

---

### Q13: What to persist first when a backend arrives

**The problem:** Everything in `scoresSlice.js` is mock-generated. `scoreHistory` is a 30-day array built by `generateMockHistory()` at onboarding completion. `cognitiveScore` is computed from assessment answers but then incremented by random(5–25) after each workout. None of it survives a restart.

**What to do — persistence priority order:**

1. **First: `cognitiveScore` and `domainScores`** — these are the user's identity in the app. Losing them destroys the core value proposition. Persist to AsyncStorage after every `COMPLETE_ASSESSMENT` and every `completeWorkout()` dispatch. Rehydrate in `AppContext.js` on mount.

2. **Second: `scoreHistory` array** — powers the 30-day chart in InsightsScreen. Each entry is `{ date: string, score: number }`. Append a new entry on each `completeWorkout()`. Cap at 90 entries (3 months) to keep storage size bounded. Persist the array to AsyncStorage.

3. **Third: `workoutComplete` and the date it was completed** — needed for streak logic. Persist `lastWorkoutDate` as an ISO string. On mount, if `lastWorkoutDate` is today, dispatch `setWorkoutComplete(true)` to restore the "workout done" state.

4. **Last: `streakDays`** — only add this after date-aware logic is solid. Streaks that reset incorrectly (e.g. timezone issues, app backgrounding) are more damaging to retention than no streak counter at all.

When the real backend arrives, move all of this out of AsyncStorage and into API sync. The services layer (`scoreService.js`) is already the right abstraction boundary — swap the implementation there without touching hooks or screens.

**Priority: P0**

---

### Q14: Is "weekly brief" the right information architecture?

**The problem:** The weekly brief is a tab inside InsightsScreen. To see it, a user must: tap the Insights tab, then tap the "weekly brief" tab. It is the most buried piece of content in the app. Meanwhile it contains the `topMoment`, `scoreRecap`, and `weekFocus` — high-motivation content that could drive weekly retention.

**What to do:**

1. **Move weekly brief delivery to a push notification (P1) and a home screen card (now).** The weekly brief teaser card already exists on HomeScreen and navigates to Insights. Make it route directly to the weekly brief tab, not the overview tab:
   ```jsx
   // In HomeScreen, weekly brief teaser onPress:
   navigation.navigate('Insights', { initialTab: 'weekly_brief' });

   // In InsightsScreen, read the param:
   const { initialTab } = route.params ?? {};
   const [activeTab, setActiveTab] = useState(initialTab ?? 'overview');
   ```

2. **Keep the tab structure inside Insights.** It is fine as a secondary access point. The issue is discoverability, not the tab itself.

3. **When push notifications are implemented**, send the weekly brief on Sunday evening. The notification text should be the `scoreRecap` string from `WEEKLY_BRIEF`. This is the single highest-ROI retention touchpoint in the app.

**Priority: P1**

---

### Q15: Domain radar chart comprehension

**The problem:** The `DomainRadar` component renders a hexagonal SVG radar chart with 6 axes (one per domain). Radar charts are not universally understood — many users will not know how to read them, what the shape means, or why one domain point is closer to the centre than another.

**What to do:**

1. **Add a one-line legend below the radar.** Show 6 coloured dots with domain names and scores:
   ```jsx
   // Below <DomainRadar /> in InsightsScreen:
   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] }}>
     {DOMAINS.map(domain => (
       <View key={domain.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
         <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: domain.color }} />
         <Text style={styles.caption}>{domain.label} · {domainScores[domain.id]}</Text>
       </View>
     ))}
   </View>
   ```

2. **Add an axis label to each point on the radar.** `DomainRadar.js` in `shared/components/` currently renders the hexagonal shape. Each vertex should show a 2–3 letter domain abbreviation (MEM, SPD, ATT, EXC, VRB, SPA). These can be small SVG `<text>` elements positioned just outside each vertex.

3. **Add a subtitle above the radar:** "your 6 cognitive domains" in `Typography.caption` weight. Context before chart, always.

4. **Do not replace the radar with a bar chart.** The radar's shape (the overall "area") gives users a gestalt read of their cognitive profile that a bar chart cannot. It is worth the comprehension investment.

**Priority: P1**

---

### Q16: Quarterly report teaser — is the upsell path clear?

**The problem:** InsightsScreen's overview tab contains a "quarterly report teaser." There is a "Your Plan" section in ProfileScreen's settings. The relationship between these two surfaces is undefined. If the quarterly report is a premium feature, the conversion path (teaser → paywall → purchase → unlock) is not implemented.

**What to do:**

1. **Decide the monetisation model before building the teaser.** The teaser should only exist if there is a destination to navigate to. If it currently navigates nowhere, **remove it** or replace it with a "coming soon" non-interactive card. A tappable element that does nothing damages trust more than no element at all.

2. **If the quarterly report is the premium upsell anchor**, the flow should be:
   - Teaser card in Insights (tappable)
   - → PaywallScreen (new screen, add to navigation)
   - → "Upgrade to Pro" CTA
   - → App Store purchase (RevenueCat is the recommended library for Expo)
   - → Unlock quarterly report and remove teaser

3. **"Your Plan" in ProfileScreen** should reflect the current plan state: "free" until purchase, then "pro." The `SettingRow` component in ProfileScreen is already self-contained — add a plan badge next to the label.

4. **Do not add RevenueCat or any IAP library until the paywall screen design is finalised.** The integration is straightforward but the UX of the paywall itself determines conversion rate far more than the technical implementation.

**Priority: P1**

---

## Section 5 — Profile

---

### Q17: Streak counter without persistence — does it erode trust?

**The problem:** `ProfileScreen` shows `streakDays` from `useProfileStats()`, which reads from `sessionSlice`. Because there is no persistence, `streakDays` resets to `0` on every app restart. A user who has genuinely used the app for 5 days sees "0 day streak" every time they reopen it.

**What to do:**

1. **Hide the streak counter entirely until persistence is implemented.** This is the correct call. A metric that is visually prominent but provably wrong destroys the user's trust in all other metrics (including their cognitive score). In `ProfileScreen`, conditionally render the streak stat:
   ```jsx
   // Only show streak if it is greater than 0 AND persistence exists
   {streakDays > 0 && <StatCard label="streak" value={`${streakDays} days`} />}
   ```

2. **Replace the hidden streak space with "sessions this week"** — a metric that can be accurately computed from the session log even without cross-session persistence (as long as the session data survives for the current app session). This gives users a meaningful number without lying to them.

3. **Add streak back once you have `lastWorkoutDate` persisted** (see Q13). The streak logic is: on app open, compare `lastWorkoutDate` to today. If yesterday → streak continues. If today → already counted. If 2+ days ago → streak resets to 0. Implement this in `sessionSlice.js`'s rehydration logic.

**Priority: P0**

---

### Q18: Reset button — no confirmation dialog

**The problem:** `ProfileScreen` has a reset button that dispatches `resetApp()`. This wipes all state including the cognitive score, onboarding completion, and score history. There is no confirmation dialog. A single accidental tap is irreversible.

**What to do:**

1. **Add a two-step confirmation.** On first tap, show a modal (or inline warning state) with the exact consequences listed:
   > "This will delete your cognitive score, all history, and return you to the welcome screen. This cannot be undone."
   Two buttons: "Cancel" and "Yes, reset everything" (in coral/red to signal danger).

2. **Implement the modal using React Native's `Modal` component** — do not use `Alert.alert()` as it does not respect the app's design system. Create a `ConfirmModal` component in `shared/components/` that accepts `visible`, `title`, `body`, `onConfirm`, and `onCancel` props. Reuse it for any other destructive actions that arise later.
   ```jsx
   // In ProfileScreen:
   const [showResetConfirm, setShowResetConfirm] = useState(false);

   <ConfirmModal
     visible={showResetConfirm}
     title="reset everything?"
     body="your score, history, and progress will be permanently deleted."
     onConfirm={() => { dispatch(resetApp()); setShowResetConfirm(false); }}
     onCancel={() => setShowResetConfirm(false)}
   />
   ```

3. **Add haptic feedback on the confirm tap** using `expo-haptics` (already in the stack):
   ```js
   import * as Haptics from 'expo-haptics';
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
   ```

**Priority: P0**

---

### Q19: Placeholder settings — show or hide?

**The problem:** Notifications and Account settings rows exist in `ProfileScreen` but presumably trigger no action. Tapping a setting row that does nothing — no navigation, no feedback, no "coming soon" — is a broken UX pattern.

**What to do:**

1. **If a setting does nothing: remove it from the screen entirely.** "Coming soon" labels on mobile apps read as incomplete and unpolished. They do not build anticipation; they build doubt.

2. **Exception — one acceptable pattern:** If "Notifications" can show the device's native notification permission dialog (even without app-side logic), then it is functional enough to ship. Use `expo-notifications` to request permissions:
   ```js
   import * as Notifications from 'expo-notifications';
   const handleNotificationsPress = async () => {
     await Notifications.requestPermissionsAsync();
   };
   ```
   This one tap delivers real value (user opts in for future notifications) and is fully implementable now.

3. **"Account" settings should not exist until there is an account system.** Remove it until authentication is built.

4. **Add back any removed rows when the feature ships.** The `SettingRow` and `Section` components in ProfileScreen are self-contained — adding rows is a one-line change.

**Priority: P1**

---

### Q20: Profile shows top 3 domains — should weak domains be visible?

**The problem:** ProfileScreen's domain highlights row shows the top 3 highest-scoring domains. This feels good ("look how strong I am at memory") but misses the primary motivational lever: improvement. Users who don't see their weakest domains have no urgency to train them.

**What to do:**

1. **Change the domain highlights row to show the 3 weakest domains**, not the strongest. Label the section "focus areas" instead of "top domains":
   ```jsx
   // In useProfileStats.js:
   const focusDomains = Object.entries(domainScores)
     .sort(([, a], [, b]) => a - b) // ascending = weakest first
     .slice(0, 3)
     .map(([domain]) => domain);
   ```

2. **Alternatively, show both** — a "strengths" row (top 2) and a "focus areas" row (bottom 2) — with different visual treatments. The strengths row uses filled/vibrant domain tiles; the focus areas row uses a more muted treatment with a small upward arrow to signal growth opportunity.

3. **Link focus area domain tiles directly to TrainScreen with the relevant domain filter pre-applied:**
   ```jsx
   onPress={() => navigation.navigate('Train', { initialFilter: domain.id })}
   ```
   This closes the loop: see a weakness on Profile → tap → land on Train filtered to that domain → start training.

**Priority: P1**

---

## Section 6 — Design System

---

### Q21: Dark mode contrast — do all 6 domain colours pass WCAG AA?

**The problem:** The 6 domain colours (`#0073E6`, `#FFC000`, `#3DAB7F`, `#A662C6`, `#FF7A00`, `#FF7DB4`) were specified for light mode. Against the dark surface (`#222120`), some of these — particularly `speed` yellow (`#FFC000`) and `spatial` pink (`#FF7DB4`) — may have insufficient contrast when used as text or icon colours.

**What to do:**

1. **Run a contrast audit now.** Use the WCAG formula: contrast ratio = (L1 + 0.05) / (L2 + 0.05) where L1 and L2 are relative luminances. You need ≥4.5:1 for normal text and ≥3:1 for large text/icons. Check each domain colour against `#222120`.

2. **In `theme.js`, add separate `dark` variants for any domain colour that fails.** The domain colour object already differentiates light/dark in `getDomains(Colors)`. For failing colours, use a lightened version (add ~30% lightness) as the dark-mode text/icon colour while keeping the original as the fill colour:
   ```js
   // Example fix for speed domain in getDomains():
   {
     id: 'speed',
     color: Colors.isDark ? '#FFD54F' : '#FFC000', // lighter yellow in dark mode
     bg: Colors.isDark ? '#3A2E00' : '#FFF8E1',
   }
   ```

3. **Test `DomainTile`, `InsightCard`, and the domain filter pills in dark mode** on a real device. Android and iOS render dark mode slightly differently — test both.

4. **Do not change the brand colours for light mode.** The light mode palette is correct. This is a dark mode extension task only.

**Priority: P1**

---

### Q22: Android BlurView degradation — fallback-first or progressive enhancement?

**The problem:** The bottom tab bar uses `expo-blur`'s `BlurView` for iOS glass effect. On Android versions that don't support BlurView, it degrades to a flat `backgroundColor`. This means Android users get a notably different (and less premium) tab bar experience. Android accounts for roughly 70–75% of global mobile market share.

**What to do:**

1. **Treat glass as progressive enhancement — but fix the fallback to look intentional.** The current fallback is likely a transparent or unstyled view. Replace it with a solid, on-brand tab bar background:
   ```jsx
   import { Platform } from 'react-native';
   import { BlurView } from 'expo-blur';

   const TabBarBackground = () => Platform.OS === 'ios'
     ? <BlurView tint={isDark ? 'dark' : 'light'} intensity={80} style={StyleSheet.absoluteFill} />
     : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface, opacity: 0.97 }]} />;
   ```

2. **Add a 0.5pt top border to the fallback** to visually separate the tab bar from screen content — the blur effect does this naturally; the flat fallback does not:
   ```jsx
   // Android tab bar container:
   borderTopWidth: 0.5,
   borderTopColor: Colors.border, // a light grey token
   ```

3. **Do not attempt to replicate blur on Android** via libraries like `@react-native-community/blur`. These have known performance issues on older Android devices and are not worth the complexity for a cosmetic effect.

**Priority: P2**

---

### Q23: Tone — playful vs. clinical credibility

**The problem:** "Playful, warm, lowercase everything" is the design brief. But cognitive fitness sits adjacent to mental health, neurological decline concerns, and medical wellness. Some users arrive because they're worried about their cognition — not because they want a fun brain game. The playful tone could actively signal "this isn't serious" to exactly the users who need it most.

**What to do:**

1. **The tone itself is correct — the execution needs calibration.** Headspace is also playful and warm, yet adults with clinical-level anxiety use it. The key is that Headspace never trivialises the user's problem. Cognify should not either.

2. **Audit all strings in `strings.js` for the following anti-patterns:**
   - Exclamation marks after every line → remove most of them
   - "Let's go!" or "You've got this!" type copy → replace with quieter confidence ("here we go.", "you're doing this.")
   - Anything that sounds like it's speaking to a child → rewrite as speaking to a capable adult

3. **Keep lowercase.** Lowercase is a design choice that signals approachability, not immaturity. It is correct.

4. **Keep the mascot on WelcomeScreen only.** The whale is charming as a brand moment. It should not appear in functional screens (scoring, assessment results, profile). The `cat_half_page.png` on TrainScreen's workout banner is worth reviewing — a character illustration on a performance screen may undermine focus.

5. **Add one sentence of scientific grounding somewhere in onboarding.** The assessment intro (FAQ accordion in `AssessmentIntroScreen`) is the right place. Something like: "our exercises are designed around established cognitive domains used in neuropsychological research." This one sentence earns trust without abandoning the brand voice.

**Priority: P1**

---

### Q24: `getDomains(Colors)` called per-render

**The problem:** `getDomains(Colors)` is called inside components on every render. It builds an array of 6 domain objects with colour values. Currently cheap, but if domain objects grow (more fields, computed values, icon lookups), this will become a measurable cost. More importantly, it creates a new array reference on every render, which can cause unnecessary re-renders in child components that receive domains as props.

**What to do:**

1. **Memoize at the component level** using `useMemo` anywhere `getDomains` is called with `Colors`:
   ```js
   // In any component that calls getDomains:
   const DOMAINS = useMemo(() => getDomains(Colors), [Colors]);
   ```
   `Colors` is the only dependency — it only changes when the user switches dark/light mode, which is rare. This eliminates redundant array reconstruction on every render.

2. **Do not memoize at module level** (i.e. do not call `getDomains` outside a component and cache the result as a module constant). Domain colours are reactive to `Colors`, which is theme-mode-dependent. Module-level caching would break dark mode.

3. **This is a low-urgency optimisation** with a one-line fix. Do it opportunistically when you're already touching a file that calls `getDomains`.

**Priority: P2**

---

## Section 7 — Architecture

---

### Q25: Persistence — which slice first, and what's the migration strategy?

**The problem:** No state survives app restart. The three slices are `onboardingSlice`, `scoresSlice`, and `sessionSlice`. Introducing AsyncStorage rehydration needs to be done carefully to avoid race conditions on mount and to not break the existing reducer logic.

**What to do — implementation blueprint:**

1. **Create a `storage.js` utility in `src/services/`:**
   ```js
   import AsyncStorage from '@react-native-async-storage/async-storage';
   const KEYS = {
     ONBOARDING: 'cognify:onboarding',
     SCORES: 'cognify:scores',
     SESSION: 'cognify:session',
   };
   export const saveOnboarding = (state) => AsyncStorage.setItem(KEYS.ONBOARDING, JSON.stringify(state));
   export const loadOnboarding = async () => {
     const raw = await AsyncStorage.getItem(KEYS.ONBOARDING);
     return raw ? JSON.parse(raw) : null;
   };
   // Same pattern for scores and session
   ```

2. **In `AppContext.js`, add an async bootstrap phase:**
   ```jsx
   const AppProvider = ({ children }) => {
     const [hydrated, setHydrated] = useState(false);
     const [onboarding, dispatchOnboarding] = useReducer(onboardingReducer, initialOnboardingState);
     // ... other reducers

     useEffect(() => {
       Promise.all([loadOnboarding(), loadScores()]).then(([savedOnboarding, savedScores]) => {
         if (savedOnboarding) dispatchOnboarding({ type: 'REHYDRATE', payload: savedOnboarding });
         if (savedScores) dispatchScores({ type: 'REHYDRATE', payload: savedScores });
         setHydrated(true);
       });
     }, []);

     if (!hydrated) return <SplashScreen />; // or null — hold the splash until hydrated
     return <AppContext.Provider value={...}>{children}</AppContext.Provider>;
   };
   ```

3. **Add `REHYDRATE` action handlers to each slice** that merge persisted state with the initial state (in case the shape has changed between app versions):
   ```js
   case 'REHYDRATE':
     return { ...initialState, ...action.payload };
   ```
   The spread order ensures new fields added to `initialState` get default values even if they're missing from the persisted payload.

4. **Persist after every state-changing dispatch** that involves onboarding completion, score updates, or workout completion. Do this in `AppContext.js` using a `useEffect` that watches the relevant state values:
   ```js
   useEffect(() => {
     if (state.onboardingComplete) saveOnboarding({ onboardingComplete: true, intent: state.intent, profile: state.profile });
   }, [state.onboardingComplete]);
   ```

**Priority: P0**

---

### Q26: `AssessmentScreens.js` is 800 lines — how to split it safely

**The problem:** `AssessmentScreens.js` exports 4 components: `AssessmentIntroScreen`, `AssessmentScreen`, `ProcessingScreen`, and `ResultsScreen`. At 800 lines it is the largest file in the codebase. Splitting it without TypeScript or tests requires care to avoid regressions.

**What to do — safe split procedure:**

1. **Read the file top to bottom and identify the 4 export boundaries.** Note any shared helper functions, styles, or constants defined in the file and used by more than one exported component.

2. **Move shared items to a `assessmentUtils.js` file first** in `screens/onboarding/`. Do not move any component yet — just extract the shared code and verify the file still compiles.

3. **Split one component at a time, in this order:**
   - `ProcessingScreen` first (most self-contained — it's just an animation)
   - `AssessmentIntroScreen` second (FAQ accordion, domain orbs — no game logic)
   - `ResultsScreen` third (reads state, dispatches actions, navigates)
   - `AssessmentScreen` last (most complex — exercise sequence logic)

4. **After each split, run `npx expo export -p web`** to catch compile errors immediately. Do not split all 4 at once.

5. **Update `navigation/index.js`** imports after each split. The navigator imports these screens by name — keep the export names identical to the original to avoid touching the navigator unnecessarily.

6. **Target file locations:**
   ```
   screens/onboarding/
   ├── AssessmentIntroScreen.js
   ├── AssessmentScreen.js
   ├── ProcessingScreen.js
   ├── ResultsScreen.js
   └── assessmentUtils.js  (shared helpers)
   ```

**Priority: P2**

---

### Q27: Mock services → real API — what UX states need designing first?

**The problem:** All three services (`exerciseService`, `scoreService`, `insightService`) return static data synchronously. When they become real API calls, they will have: loading states, error states, empty states, and stale-while-revalidate states. None of these are currently handled anywhere in hooks or screens.

**What to do — design these states before writing API code:**

1. **Loading state:** Each hook that calls a service should return an `isLoading` boolean. Screens should render a skeleton or spinner while loading. Design the skeleton UI for `TrainScreen` (exercise grid) and `InsightsScreen` (score chart) before switching to real data.

2. **Error state:** Each hook should return an `error` object. The `ErrorBoundary` component exists but only catches render errors — it will not catch async fetch failures. Add explicit error UI in `TrainScreen` and `InsightsScreen`:
   ```jsx
   if (error) return (
     <View style={styles.center}>
       <Text style={styles.muted}>couldn't load your data.</Text>
       <PillButton label="try again" onPress={retry} variant="ghost" />
     </View>
   );
   ```

3. **Empty state:** What does `TrainScreen` look like with 0 exercises? What does `InsightsScreen` look like with no score history? Design and build these states before the API goes live. Empty states are often forgotten until they appear in production.

4. **The service swap itself is simple** — it only happens inside `services/*.js`. Hooks never need to change:
   ```js
   // exerciseService.js — swap from:
   export const getAll = () => EXERCISES;
   // To:
   export const getAll = () => fetch('/api/exercises').then(r => r.json());
   ```
   Because hooks call services (not raw data), this is a one-line change per service method. The UX work is what takes time.

**Priority: P1**

---

### Q28: Analytics — top 5 events to instrument before launch

**The problem:** The app has zero analytics instrumentation. Without events, you cannot measure the onboarding funnel, identify drop-off points, track daily active usage, or know whether the workout or insights features are actually being used.

**What to do:**

Install `@segment/analytics-react-native` or `@amplitude/analytics-react-native` (both have Expo support). Then instrument these 5 events in priority order:

1. **`onboarding_completed`** — fire in `ResultsScreen` when `COMPLETE_ONBOARDING` is dispatched. Properties: `intent`, `ageRange`, `cognitiveScore`. This is your top-of-funnel completion metric.

2. **`workout_started`** — fire in `ActiveSessionScreen` when the session engine enters the `playing` phase for the first exercise. Properties: `exerciseCount`, `domains`. Lets you measure how many users who tap "start workout" actually begin.

3. **`workout_completed`** — fire when `completeWorkout()` is dispatched. Properties: `scoreDelta`, `exercisesCompleted`. Your core engagement metric.

4. **`checkin_completed`** — fire in `useCheckins.js` on `handleComplete`. Properties: `type` (sleep/activity/mood), `value`. Measures lifestyle data adoption.

5. **`screen_viewed`** — fire on every main tab screen mount. Properties: `screenName`. Gives you tab engagement distribution — crucial for knowing which features users actually use vs. ignore.

Add analytics calls inside action creators in `store/actions/index.js` — not in screens or hooks. This keeps instrumentation co-located with state changes and out of UI logic:
```js
// In store/actions/index.js:
export const completeWorkout = (scoreDelta) => {
  analytics.track('workout_completed', { scoreDelta });
  return { type: COMPLETE_WORKOUT, payload: { scoreDelta } };
};
```

**Priority: P0**

---

## Summary — Priority matrix

| Priority | Action |
|---|---|
| **P0** | Persist `onboardingComplete` to AsyncStorage |
| **P0** | Persist `cognitiveScore` and `scoreHistory` after every workout |
| **P0** | Hide streak counter until persistence is working |
| **P0** | Add confirmation dialog to reset button |
| **P0** | Add exercise rotation to `getDailyWorkout()` |
| **P0** | Add at least 2 more game types to `ActiveSessionScreen` |
| **P0** | Instrument the 5 core analytics events |
| **P1** | Add assessment progress bar and back-gesture confirmation |
| **P1** | Show intent selection state before auto-navigating |
| **P1** | Remove decorative clouds/stars from WelcomeScreen |
| **P1** | Collapse domain grid to 3 by default on HomeScreen |
| **P1** | Add check-in dismissal memory (6-hour cooldown) |
| **P1** | Fix sticky header to not animate text opacity |
| **P1** | Set minimum touch targets on exercise cards and filter pills |
| **P1** | Route weekly brief teaser directly to the brief tab |
| **P1** | Add legend and axis labels to DomainRadar |
| **P1** | Remove or wire up placeholder settings rows |
| **P1** | Show weakest domains as "focus areas" in Profile |
| **P1** | Audit and fix dark mode contrast for all 6 domain colours |
| **P1** | Audit all `strings.js` copy for tone calibration |
| **P1** | Design loading, error, and empty states before real API |
| **P2** | Make greeting contextual (streak, post-workout, etc.) |
| **P2** | Add `useMemo` to `filteredExercises` and `getDomains` calls |
| **P2** | Add `getItemLayout` to TrainScreen FlatList |
| **P2** | Fix Android tab bar fallback border and background |
| **P2** | Split `AssessmentScreens.js` into 4 separate files |
| **P2** | Define monetisation model and wire up quarterly report teaser |

---

*Generated from `KNOWLEDGE_GRAPH.md` — update this document when the architecture changes significantly.*
