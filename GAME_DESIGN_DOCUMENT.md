# Cognify — Game Design Document
> **For the LLM agent implementing the 6 training games.**
> Read this document in full before writing a single line of code. The systems interact — scoring, timing, difficulty, and UX rules are interdependent. Implement in the order specified in the **Agent Task Queue** at the bottom. Do not skip ahead.

---

## Agent Instructions — How to Work Through This Document

You are implementing 6 cognitive training games and their shared engine for Cognify, a React Native (Expo) app. This document is your complete specification. Follow these rules about how to read and act on it:

1. **Implement one task at a time.** The task queue at the bottom of this document lists every implementation unit in order. Complete each task, verify it compiles and runs, then move to the next. Never implement two tasks simultaneously.

2. **Check shared engine rules before touching any game file.** The shared engine (Section 2) defines systems used by all 6 games. If you change anything in the shared engine, it affects all games. Do not modify shared engine behaviour to fit a single game — adapt the game to fit the engine.

3. **Use the constants files, never hardcode.** Every timing value, scoring weight, and threshold defined in this document belongs in `src/constants/gameConfig.js`. Every string belongs in `strings.csv`. If you find yourself writing a number directly into a game component, stop and add it to `gameConfig.js` first.

4. **After each task, run a 3-point check:** (a) does it compile cleanly, (b) does the game session start, run for 60 seconds, and end on the results screen, (c) does the score update correctly per round. Do not proceed to the next task until all three pass.

5. **Do not invent behaviour not specified here.** If something is ambiguous, implement the more conservative option and leave a `// TODO: clarify` comment. Do not fill gaps with assumptions silently.

6. **File locations to work in:**
   - Shared engine: `src/features/train/engine/`
   - Game components: `src/features/train/games/`
   - Game config constants: `src/constants/gameConfig.js`
   - Session result screen: `src/features/train/screens/SessionResultScreen.js`
   - Active session screen: `src/features/train/screens/ActiveSessionScreen.js`

---

## Section 1 — Foundational Definitions

Before the engine or any game can be built, these definitions must be consistent everywhere in the codebase. Add them as comments to the top of `src/constants/gameConfig.js`.

**Round:** One complete stimulus → response → feedback cycle within a session. A round is the atomic unit of scoring.

**Session:** Exactly 60 seconds of active stimulus time across multiple rounds. Active time means a stimulus is visible and the user can respond. Inter-stimulus intervals, feedback phases, and pause time do not count toward the 60 seconds. One session maps to one entry in `scoreHistory`.

**Difficulty Level:** An integer from 1 (easiest) to 5 (hardest). Each game defines what each level means in terms of its own parameters. The adaptive ladder (Section 2) manages movement between levels.

**Domain Score:** A rolling weighted average of session scores for a given cognitive domain. It lives in `scoresSlice.js` and is updated after every session via the formula in Section 2. It is not a raw session score — it is a stable long-term signal.

**Session Score:** The mean of all normalised round scores in a session, from 0 to 100. Every game produces round scores on this same 0–100 scale. This is the only thing the domain score calculation receives.

---

## Section 2 — Shared Engine

### 2.1 Session Timer

The session timer tracks 60 seconds of active stimulus time only. It does not run during ISI (inter-stimulus intervals), feedback phases, or pauses.

Implement as a custom hook `useSessionTimer` in `src/features/train/engine/useSessionTimer.js`:

```js
// Tracks activeTimeElapsed (0 to SESSION_DURATION_MS)
// Exposes: activeTimeElapsed, isComplete, pause(), resume()
// Timer increments only when isActive === true
// Game engine sets isActive=true when stimulus appears, false when it disappears
// SESSION_DURATION_MS = 60000 — defined in gameConfig.js
```

Render the timer as a horizontal bar at the very top of the screen, full width, 3pt height. The bar drains from right to left (full = time remaining, empty = session over). Use the `speed` domain colour (`#FFC000`) for the bar fill — it is the most neutral of the domain colours and does not bias toward any particular game's domain colour.

Do not render a number countdown anywhere on the active session screen. Numbers create measurable anxiety in timed tasks. The bar gives pace without pressure.

Maximum pauses per session: 2. Track `pauseCount` in `useSessionTimer`. On the third pause attempt, ignore the pause gesture and do not show any UI feedback — the session continues. This is intentional and silent.

### 2.2 Adaptive Difficulty Ladder

The adaptive ladder lives in `src/features/train/engine/useAdaptiveLadder.js`.

```js
// State: currentLevel (1–5), consecutiveCorrect (0–n), consecutiveMisses (0–n)
// On correct response: consecutiveCorrect++, consecutiveMisses = 0
//   if consecutiveCorrect >= 3: currentLevel = Math.min(5, currentLevel + 1), consecutiveCorrect = 0
// On miss/incorrect: consecutiveMisses++, consecutiveCorrect = 0
//   if consecutiveMisses >= 2: currentLevel = Math.max(1, currentLevel - 1), consecutiveMisses = 0
// Exposes: currentLevel, recordCorrect(), recordMiss()
```

Starting level per session: the last difficulty level the user reached in this game during their previous session, loaded from `AsyncStorage` key `cognify:gameLevel:{gameId}`. Cap the starting level at 3 at the beginning of each calendar day regardless of stored level — this is the daily warm-up cap. If no stored level exists, start at 1.

Save the reached difficulty level to AsyncStorage at session end, not during the session. Saving mid-session would create a feedback loop where interrupted sessions corrupt the starting level.

### 2.3 Streak Multiplier

Lives in `src/features/train/engine/useStreakMultiplier.js`.

```js
// State: streakCount, multiplier
// Thresholds and multipliers (define in gameConfig.js):
//   streak >= 3:  multiplier = 1.1
//   streak >= 6:  multiplier = 1.25
//   streak >= 10: multiplier = 1.5
// On correct: streakCount++, update multiplier
// On miss/incorrect: streakCount = 0, multiplier = 1.0
// Exposes: streakCount, multiplier, recordCorrect(), recordMiss()
```

Display the multiplier badge only when `multiplier > 1.0`. Position: top-right of the session screen, below the score display. Format: `×1.25` in `Typography.caption`, coloured with the active game's domain colour.

Animate in: scale from 0.5 to 1.0 over 200ms when the multiplier first activates or increases.
Animate out: the badge shakes (translateX oscillating ±4pt, 3 cycles, 150ms total) then disappears when a miss resets it.
Do not animate the badge on every correct tap — only on threshold crossings and resets.

### 2.4 Score Calculation

Round score calculation (apply in this order, defined in `src/features/train/engine/scoring.js`):

```js
export function calculateRoundScore({ baseScore, speedBonus = 0, multiplier = 1.0 }) {
  const raw = Math.min(100, baseScore + speedBonus);
  return Math.round(raw * multiplier);
}
// baseScore: 0 or 100 for accuracy games; 0–100 for speed games (see per-game rules)
// speedBonus: defined per game, added before multiplier
// multiplier: from useStreakMultiplier
// Output is always an integer
```

Session score:
```js
export function calculateSessionScore(roundScores) {
  if (roundScores.length === 0) return 0;
  return Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length);
}
```

Domain score update (run in `scoresSlice.js` after session completes):
```js
// In gameConfig.js:
// DOMAIN_SCORE_WEIGHTS = { previous: 0.7, session: 0.3 }
export function updateDomainScore(previousDomainScore, sessionScore) {
  return Math.round(previousDomainScore * 0.7 + sessionScore * 0.3);
}
```

### 2.5 Haptic Rules

Define a single haptics utility at `src/utils/haptics.js`. All games import from here — never call `expo-haptics` directly in a game component.

```js
import * as Haptics from 'expo-haptics';

export const GameHaptics = {
  correct: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  incorrect: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  streakMilestone: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};
// Do not add any other haptic events. These three are the complete set.
```

### 2.6 Score Display

The running session score lives in the top-right corner of the active session screen. Rules:

- Font: `Typography.heading3`, colour `textPrimary`
- Updates immediately after every round — no delay
- Does not animate the number itself
- Shows a floating delta after each scoring round: `+{delta}` in a small text element that begins at the score position, translates upward by 20pt, and fades to opacity 0 over 600ms. Use `Animated.parallel` with `Animated.timing` for translate and opacity. After the animation completes, remove the element from the tree entirely.
- Delta colour: green for positive, coral for zero or positive-from-miss (none), no delta shown for 0-scoring rounds

### 2.7 Session End

When `isComplete === true` from `useSessionTimer`:

1. Abandon the current in-progress round immediately. Do not award partial score.
2. Show a 300ms "session complete" state: active stimulus fades to opacity 0, score number animates to its final value (count-up animation, 500ms, ease out).
3. Navigate to `SessionResultScreen` with the session data as route params.
4. Save the session score and difficulty level to AsyncStorage.
5. Dispatch `completeWorkout(scoreDelta)` to update `scoresSlice`.

### 2.8 Pause Behaviour

On pause (up to 2 per session):
- Freeze `useSessionTimer` (`isActive = false`)
- Do not freeze the current round's response window — the stimulus is hidden on pause, so the response window timer should also freeze. Implement by pausing a separate `useRoundTimer` hook in the same way.
- Replace the stimulus area with a solid surface using `Colors.surface` — do not blur (expo-blur has Android limitations per the PM analysis doc). The stimulus must not be visible through the pause overlay.
- Show "resume" button (primary, centred). No other controls on the pause screen.
- On resume: 3-2-1 countdown overlay (each number shows for 400ms, `Typography.display` size, centred) before gameplay resumes. This re-focuses the user's attention after the interruption.

---

## Section 3 — Game 1: Signal Chain
**Domain:** Memory | **Domain Colour:** `#0073E6`

### 3.1 What It Trains
Visual-spatial working memory and sequential recall. The user holds an ordered sequence of grid positions in mind and reproduces it exactly.

### 3.2 Round Structure

```
1. HIGHLIGHT PHASE
   - Nodes light up one at a time in sequence
   - Each node glows for displayDuration ms (see difficulty table)
   - Gap between nodes: 300ms (constant — never change this)
   - Input is ignored during highlight phase (silent ignore, no error)

2. RECALL PHASE
   - All nodes return to neutral state
   - User taps nodes in order
   - Each correct tap: brief glow confirmation (node pulses to full opacity and back, 150ms)
   - First wrong tap: ends recall phase immediately — do not accept further taps

3. FEEDBACK PHASE (600ms)
   - Correct sequence: all nodes flash green in order at 80ms intervals (replay effect)
   - Wrong sequence: correct sequence replays in orange (#FF7A00) at 80ms intervals
   - Never skip the error replay — it is the learning mechanism
```

### 3.3 Difficulty Parameters

```
// In gameConfig.js under SIGNAL_CHAIN:
Level 1: sequenceLength=3, gridSize='3x3', displayDuration=800, responseWindow=8000
Level 2: sequenceLength=4, gridSize='3x3', displayDuration=650, responseWindow=8000
Level 3: sequenceLength=5, gridSize='4x4', displayDuration=500, responseWindow=10000
Level 4: sequenceLength=6, gridSize='4x4', displayDuration=400, responseWindow=10000
Level 5: sequenceLength=7, gridSize='5x5', displayDuration=300, responseWindow=12000
```

Response window scales up at higher levels. The challenge is the sequence and speed, not the recall deadline.

### 3.4 Scoring

```js
// Base score: 100 if full sequence correct, 0 if any error (no partial credit)
// Speed bonus: +20 if recall completed in under 50% of responseWindow
// Apply calculateRoundScore({ baseScore, speedBonus, multiplier })
```

Partial credit is explicitly excluded. Signal Chain measures working memory capacity — a near-miss is a miss.

### 3.5 Layout Rules

- Node size: minimum 56×56pt with 8pt gaps
- On iPhone SE (320pt wide): if 5×5 grid cannot fit with nodes ≥44pt, cap grid at 4×4 for level 5
- Node appearance: circular, `memory` domain colour at 100% opacity when active, 20% opacity when neutral
- No icons or numbers inside nodes — position is the only information
- Grid is always centred horizontally and vertically in the stimulus area

### 3.6 Component File
`src/features/train/games/SignalChain.js`

---

## Section 4 — Game 2: Flash Sort
**Domain:** Speed | **Domain Colour:** `#FFC000`

### 4.1 What It Trains
Visual discrimination and choice reaction time. Measures millisecond-level reaction time and rewards speed above accuracy (with accuracy gated).

### 4.2 Round Structure

```
1. FIXATION CROSS (200ms)
   - Small cross (×) appears in exact centre of screen
   - Colour: textSecondary
   - Do not skip this phase — it reduces reaction time variance

2. STIMULUS
   - Single shape appears in exact screen centre
   - Shape: circle OR square
   - Response window begins at stimulus appearance
   - Full-screen tap zones: left half = circle response, right half = square response
   - Swipe left = circle, swipe right = square (equivalent to tap zones)

3. FEEDBACK (300ms)
   - Correct: brief green flash behind the shape (#3DAB7F at 40% opacity)
   - Incorrect: brief red flash behind the shape
   - Do not show correct answer on error — move to next round immediately
```

### 4.3 Difficulty Parameters

```
// In gameConfig.js under FLASH_SORT:
Level 1: stimulusDuration=1000, ISI=600, distractorType='none'
Level 2: stimulusDuration=800,  ISI=500, distractorType='colour'
Level 3: stimulusDuration=600,  ISI=400, distractorType='pattern_stripes'
Level 4: stimulusDuration=400,  ISI=300, distractorType='pattern_colour'
Level 5: stimulusDuration=250,  ISI=200, distractorType='high_similarity'
```

High-similarity distractors at level 5: slightly squashed circles (aspect ratio 0.85:1) and rounded squares (border-radius 40%). Task remains "what is the shape" — distractors are perceptual interference.

ISI is dead time between feedback end and next fixation cross. It does not count toward the 60-second active timer.

### 4.4 Scoring

```js
// Reaction time scoring (speed game — no flat base score):
const reactionTimeMs = responseTimestamp - stimulusTimestamp;
const maxTime = stimulusDuration; // from current difficulty level
const baseScore = Math.max(0, Math.round(100 * (1 - reactionTimeMs / maxTime)));

// Incorrect response: baseScore = 0 regardless of speed
// Anticipatory response (reactionTimeMs < 100ms): baseScore = 0, log as falseStart
//   Do NOT count false starts against the adaptive ladder miss counter

// Apply calculateRoundScore({ baseScore, speedBonus: 0, multiplier })
// Flash Sort has no speed bonus — the score IS the speed measurement
```

### 4.5 Layout Rules

- Shape size: 80×80pt, always centred at exact screen centre
- No positional variation between rounds — position change would measure spatial attention, not speed
- Tap zone affordance: show faint labels ("◁ circle" left, "square ▷" right) for the user's first 3 rounds of their first session only. Track `hasSeenTutorial` in AsyncStorage key `cognify:tutorial:flashSort`. Hide permanently after 3 rounds.
- Results screen: add 6th metric "your average reaction time: {mean}ms" below the standard 5

### 4.6 Component File
`src/features/train/games/FlashSort.js`

---

## Section 5 — Game 3: Lighthouse Watch
**Domain:** Attention | **Domain Colour:** `#A662C6`

### 5.1 What It Trains
Sustained vigilance — detecting rare targets while actively inhibiting responses to distractors. The hardest game psychologically because it requires prolonged attention with low positive reinforcement frequency.

### 5.2 Round Structure

```
1. STIMULUS STREAM
   - Icons appear one at a time, centre screen
   - Each icon displays for stimulusDuration ms
   - ISI between icons (counts as between-round time, not active time)
   - Continuous — no break between rounds visible to user

2. DETECTION
   - Most icons: distractors (do nothing)
   - Target (★ star): tap within responseWindow = stimulusDuration

3. RESPONSE TYPES
   - Hit: tapped target correctly → +100 base points
   - Miss: target appeared, no tap → 0 points, breaks streak
   - False Alarm: tapped distractor → -50 points, breaks streak
   - Correct Rejection: ignored distractor → 0 points (silence is the baseline)
```

### 5.3 Difficulty Parameters

```
// In gameConfig.js under LIGHTHOUSE_WATCH:
Level 1: stimulusDuration=1000, ISI=800, targetFreq=0.25, distractorType='clearly_different'
Level 2: stimulusDuration=800,  ISI=600, targetFreq=0.20, distractorType='similar_fill'
Level 3: stimulusDuration=600,  ISI=400, targetFreq=0.17, distractorType='near_identical'
Level 4: stimulusDuration=400,  ISI=300, targetFreq=0.125,distractorType='star_variants'
Level 5: stimulusDuration=300,  ISI=200, targetFreq=0.10, distractorType='5pt_vs_6pt_star'
```

Target frequency values: level 1 = 1 in 4 stimuli, level 5 = 1 in 10 stimuli. Generate target/distractor sequence randomly per session but ensure the declared frequency is maintained within a ±1 count tolerance over the full session.

Level 5 distractor: 6-point star vs 5-point star target. Do not make the distinction smaller than this — below this threshold the task measures acuity, not vigilance.

### 5.4 Scoring

```js
// Hit:
baseScore = 100;
// Apply calculateRoundScore({ baseScore, speedBonus: 0, multiplier })

// False Alarm:
roundScore = -50; // Applied directly, not through calculateRoundScore
// Multiplier does NOT apply to false alarm penalty
// False alarm DOES reset the streak multiplier

// Miss: roundScore = 0

// Session score floor: Math.max(0, calculateSessionScore(roundScores))
// Negative session score clips to 0 — no negative domain score updates
```

### 5.5 UX Rules

- Do not animate the score display during the stimulus stream — update silently. Animate only on streak milestone badges.
- False Alarm feedback: full-screen background flash red (#E24B4A at 30% opacity) for 200ms. This must be immediate and more severe than any other in-game feedback event. The severity matches the scoring penalty.
- Vigilance pulse: every 15 seconds of active time, the session timer bar pulses (opacity 1.0 → 0.85 → 1.0, 1 second cycle). Do not use sound or haptics for this. It is a sub-perceptual anchor implemented in `useSessionTimer` as a separate `usePulseAnimation` callback.
- Results screen additions: show Hit Rate (`hits / totalTargets × 100`%), False Alarm Rate (`falseAlarms / totalDistractors × 100`%), and Miss count as the 6th–8th metrics.
- Pause limit is most critical for this game — after 2 pauses, the 3rd attempt is silently ignored with no UI response.

### 5.6 Component File
`src/features/train/games/LighthouseWatch.js`

---

## Section 6 — Game 4: Context Switch
**Domain:** Executive Function | **Domain Colour:** `#3DAB7F`

### 6.1 What It Trains
Cognitive flexibility — rapidly switching between competing classification rules. The "switch cost" (latency penalty when rules change) is a direct measurement of executive function.

### 6.2 Round Structure

```
1. STIMULUS
   - A card appears: contains a coloured shape
   - Card's border colour = active rule (see rule table below)
   - Two response buttons at bottom (labels update to match active rule)

2. RULE APPLICATION
   - User reads border colour, applies rule, taps correct button

3. FEEDBACK (400ms)
   - Correct: green glow on card
   - Incorrect: red glow + correct answer highlighted
   - Show correct answer on error (unlike Flash Sort) — rule confusion needs correction
```

### 6.3 Rule System

```
// In gameConfig.js under CONTEXT_SWITCH.RULES:
BLUE border   → sort by SHAPE   → buttons: "circle" | "square"
RED border    → sort by COLOUR  → buttons: "red" | "blue"
YELLOW border → sort by SIZE    → buttons: "large" | "small"    (level 3+)
PURPLE border → sort by COUNT   → buttons: "one" | "two"        (level 5 only)
```

Button labels must update within 100ms of the new stimulus card appearing. Synchronise label update with the card entrance animation — they should appear to arrive together. A label lag of >100ms allows responses before the rule is readable, creating false errors that damage the user's trust in the game.

Stimulus constraint: the shape's fill colour must never match the active rule's border colour. If `shape.colour === rule.borderColour`, regenerate the stimulus. Implement this as a guard in the stimulus generator.

### 6.4 Difficulty Parameters

```
// In gameConfig.js under CONTEXT_SWITCH:
Level 1: switchFrequency=4, responseWindow=2500, activeRules=['shape','colour']
Level 2: switchFrequency=3, responseWindow=2000, activeRules=['shape','colour']
Level 3: switchFrequency=2, responseWindow=1800, activeRules=['shape','colour','size']
Level 4: switchFrequency=1, responseWindow=1500, activeRules=['shape','colour','size']
Level 5: switchFrequency='random', responseWindow=1200, activeRules=['shape','colour','size','count']
```

`switchFrequency=1` means alternating every single round. `switchFrequency='random'` means the rule changes randomly every 1–3 rounds.

### 6.5 Scoring

```js
// Standard round:
baseScore = correct ? 100 : 0;

// Switch round (round immediately following a rule change):
baseScore = correct ? 150 : 0;
// 150 base score on switch rounds — the only game where base score can exceed 100
// calculateRoundScore still clips output at a ceiling of 150 (not 100) for switch rounds
// Update calculateRoundScore to accept an optional maxScore parameter:
// Math.min(maxScore ?? 100, baseScore + speedBonus)

// Switch cost tracking (do not display during session):
// Log reactionTimeMs for switch rounds and stay rounds separately
// At session end, calculate: switchCost = mean(switchRoundRTs) - mean(stayRoundRTs)
// Show on results screen as "your switch cost: {switchCost}ms"
// A lower switch cost = better executive function
```

### 6.6 Rule Legend

Show a small legend strip below the card for the first 5 rounds of a user's first session. Track `hasSeenTutorial` in AsyncStorage key `cognify:tutorial:contextSwitch`. Format: coloured dot + rule name for each active rule at the current difficulty level. Hide permanently after round 5.

### 6.7 Component File
`src/features/train/games/ContextSwitch.js`

---

## Section 7 — Game 5: Word Weave
**Domain:** Verbal | **Domain Colour:** `#FF7A00`

### 7.1 What It Trains
Semantic reasoning and analogical thinking — the only game that is not reflex-based. The user identifies the logical relationship between word pairs and applies it to complete an analogy.

### 7.2 Round Structure

```
1. STIMULUS
   - Analogy frame: [Word A] : [___] :: [___] : [Word D]
   - Both blanks are filled by the same bridge word/concept
   - Four answer options appear as full-width cards below the frame
   - At levels 3–5: options are delayed by thinkTime ms (user sees question first)

2. RESPONSE
   - Single tap on an answer card
   - No retry within the same round — one tap locks the answer
   - No swipe mechanic — this is deliberate, not reflex

3. FEEDBACK (600ms)
   - Correct: selected card turns green (#3DAB7F)
   - Incorrect: selected card turns red, correct card turns green
   - One-line explanation appears in Typography.caption below options
   - Timer does NOT pause for the explanation — it auto-advances after 600ms
```

### 7.3 Analogy Difficulty Levels

```
Level 1: Category membership
  Example: "Dog : Animal :: Rose : [Plant]"
  Relationship: "is a type of"

Level 2: Functional relationship
  Example: "Pen : Write :: Knife : [Cut]"
  Relationship: "is used to"

Level 3: Part-to-whole
  Example: "Finger : Hand :: Petal : [Flower]"
  Relationship: "is part of"

Level 4: Antonymic / synonymic
  Example: "Hot : Cold :: Fast : [Slow]"
  Relationship: opposites or near-equivalents

Level 5: Abstract causal / structural
  Example: "Seed : Tree :: Idea : [Innovation]"
  Relationship: developmental or causal origin
```

### 7.4 Distractor Design Rules

Every analogy must have exactly 3 distractors following these types. Never use random distractors.

```
Distractor Type 1 — Same-category lure:
  Correct answer is "Plant" → distractor is "Tree"
  (Also a category answer, but wrong — too specific or too broad)

Distractor Type 2 — Thematic association:
  Question involves "Dog : Animal" → distractor is "Bark"
  (Strongly associated with the words but breaks the logical relationship)

Distractor Type 3 — Plausible non-answer:
  Sounds like it could fit the frame but fails the relationship test on inspection
  Requires the user to apply the relationship rule, not just word-association
```

Store all analogies in `src/data/wordWeaveAnalogies.js`. Each entry:
```js
{
  id: string,
  level: 1|2|3|4|5,
  wordA: string,
  wordD: string,
  bridgeWord: string,         // correct answer
  relationship: string,       // for the explanation text
  distractors: [string, string, string], // types 1, 2, 3 in order
  explanation: string,        // shown in feedback: "correct — both are types of fruit"
}
```

Minimum content requirement: 15 analogies per difficulty level = 75 total analogies before ship. Create all 75 in `wordWeaveAnalogies.js` before implementing the game component.

### 7.5 Difficulty Parameters

```
// In gameConfig.js under WORD_WEAVE:
Level 1: responseWindow=12000, thinkTime=0
Level 2: responseWindow=10000, thinkTime=0
Level 3: responseWindow=9000,  thinkTime=500
Level 4: responseWindow=8000,  thinkTime=1000
Level 5: responseWindow=7000,  thinkTime=1500
```

`thinkTime` is the delay before answer options appear. The user sees the analogy frame but no options. This forces relationship mapping before elimination strategies become available.

### 7.6 Scoring

```js
// Base score: 100 if correct, 0 if incorrect or miss
// Speed bonus: +25 if answered in under 40% of responseWindow
// Apply calculateRoundScore({ baseScore, speedBonus, multiplier })
```

### 7.7 UX Rules

- Typography is the entire interface. Analogy frame: `fontSize: 20, fontWeight: '500'`, generous line height (1.6)
- The bracket notation `[___]` uses `brandPrimary` colour (#FF7A00) — visually distinct from the words
- Answer option cards: full width, minimum 48pt height, word centred in `Typography.body`
- No colour on answer cards until the answer is tapped — pure white cards with `borderTertiary` border
- Score display: move to a smaller, less prominent position for this game only. Word Weave requires full cognitive engagement with the content — the score counter should not compete.
- The one-line explanation is the most important UX element in this game. It is how verbal reasoning skills transfer. Never skip it, never truncate it.

### 7.8 Component File
`src/features/train/games/WordWeave.js`

---

## Section 8 — Game 6: Pattern Fold
**Domain:** Spatial | **Domain Colour:** `#FF7DB4`

### 8.1 What It Trains
Mental rotation and spatial visualisation — the ability to mentally rotate 2D and 3D patterns and identify matching orientations.

### 8.2 Round Structure

```
1. STIMULUS
   - Target pattern: left side (or top on narrow screens)
   - Variant options: right side (or below), 3 or 4 options depending on level
   - One variant is the correctly rotated target
   - Other variants are: mirror images, different patterns, or different rotation angles

2. RESPONSE
   - Single tap on the matching variant
   - No swipe mechanic

3. FEEDBACK (500ms)
   - Correct: matching variant glows green, rotation animation plays
   - Incorrect: selected variant flashes red, correct variant glows orange (#FF7A00)
   - Rotation animation always plays (correct and incorrect) — shows the correct answer kinetically
   - Animation: target rotates to match the correct variant over 300ms, ease-out
```

### 8.3 Difficulty Parameters

```
// In gameConfig.js under PATTERN_FOLD:
Level 1: rotationType='2D',    angles=[45,90],           variants=3, mirrorsIncluded=false
Level 2: rotationType='2D',    angles=[90,135,180],       variants=3, mirrorsIncluded=true
Level 3: rotationType='2D_3D', angles=[90,180],           variants=4, mirrorsIncluded=true
Level 4: rotationType='3D',    angles=[90,180,270],       variants=4, mirrorsIncluded=true
Level 5: rotationType='3D_iso',angles='any',              variants=4, mirrorsIncluded=true
```

Pattern complexity by level:
- Levels 1–2: simple L-shapes and T-shapes
- Level 3: add coloured segments (2 colours max)
- Level 4: irregular polygons, 3 colours
- Level 5: irregular polyhedra with hollow cutouts, coloured faces

### 8.4 Scoring

```js
// Base score: 100 if correct, 0 if incorrect or miss
// Speed bonus: +20 if answered in under 50% of responseWindow
// Apply calculateRoundScore({ baseScore, speedBonus, multiplier })

// Mirror error tracking:
// If user selects a mirror-image variant (not a wrong rotation), log as mirrorError
// mirrorErrors are tracked in session analytics but NOT penalised differently in scoring
// Show on results screen as "mirror errors: {count}" as the 6th metric
```

### 8.5 Timing Parameters

```
// In gameConfig.js under PATTERN_FOLD:
Level 1: responseWindow=10000
Level 2: responseWindow=9000
Level 3: responseWindow=8000
Level 4: responseWindow=7000
Level 5: responseWindow=6000
```

No ISI between Pattern Fold rounds beyond the 500ms feedback phase. Spatial working memory decays quickly — a long gap between rounds would make each round easier and reduce training effect. Load the next stimulus immediately after feedback.

### 8.6 Layout Rules

- Target and all variant options must render at identical scale. Never scale variants differently from the target.
- Equal spacing between all variant cards and between variants and the target. Compute all margins programmatically — never hardcode asymmetric values.
- Narrow screen layout (≤320pt): stack target above, variants in rows of 2 below. Do not force side-by-side on small screens.
- Rotation animation: `Animated.timing`, 300ms, `Easing.out(Easing.cubic)`. The animation shows the target rotating to align with the correct answer. Purpose is perceptual learning, not decoration — never reduce or skip it for performance reasons.

### 8.7 Component File
`src/features/train/games/PatternFold.js`

---

## Section 9 — Session Result Screen

`src/features/train/screens/SessionResultScreen.js`

This screen is shared by all 6 games. It receives session data as route params.

### 9.1 Standard Metrics (all games)

Display exactly these 5 items for every game, in this order:

```
1. Session score (large, centred, Typography.display)
   - Green if higher than previous session of same game
   - Coral if lower
   - Grey if equal or first session

2. Delta from previous session
   - Format: "+18 from last session" or "−4 from last session"
   - Same colour logic as session score
   - If first session: "your first session" (no delta)

3. Rounds completed (integer)

4. Accuracy percentage (correct rounds / total rounds × 100, rounded to integer, + "%" suffix)

5. Longest streak (integer, + " in a row" suffix)
```

### 9.2 Game-Specific Additional Metrics

```
Flash Sort (6th):      "average reaction time: {mean}ms"
Lighthouse Watch (6–8): "hit rate: {hitRate}%", "false alarm rate: {FArate}%", "misses: {count}"
Context Switch (6th):  "switch cost: {switchCost}ms" (lower = better, add "(lower is better)" caption)
Pattern Fold (6th):    "mirror errors: {mirrorErrors}"
Signal Chain:          no additional metric
Word Weave:            no additional metric
```

### 9.3 CTA Rules

Primary button: "done" → navigates to `TrainScreen`
Secondary button: "play again" → restarts same game, same starting difficulty level (reset adaptive ladder to `lastSessionLevel`, not level 1)

"play again" must never be the primary button. Position it below "done" at lower visual weight.

### 9.4 What Not to Show

- No motivational quotes
- No comparisons to other users or percentages ("you beat 74% of users")
- No detailed round-by-round breakdown
- No advertisements or upsell prompts on this screen

### 9.5 Transition

Time from session end to results screen: 800ms total.
- 0–300ms: stimulus area fades to opacity 0
- 300–800ms: score animates to its final value (count-up, ease-out)
- 800ms: results screen appears

This 800ms is the user's psychological exhale after a demanding session. Do not rush it.

---

## Section 10 — Cross-Game Consistency Rules

These must be identical across all 6 games. If you are about to make something different for one game for non-functional reasons, do not. Visual consistency is a product principle, not a preference.

**Same across all games:**
- Session timer bar: position (top edge), colour (#FFC000), direction (drains right to left), height (3pt)
- Score display: position (top-right), format (integer, no decimals), font (Typography.heading3)
- Streak badge: position (top-right, below score), format (×1.25), animation spec (scale in 200ms, shake on reset)
- Haptic patterns: correct → Light Impact, incorrect → Error Notification, streak milestone → Heavy Impact
- Feedback flash colours: green (#3DAB7F) = correct, red (#E24B4A) = incorrect, orange (#FF7A00) = show-correct-answer
- Results screen layout: same component for all 6, game-specific metrics appended at the bottom

**Different per game (and only these things):**
- The stimulus content and interaction mechanic
- The domain accent colour used in UI chrome and score display
- The game-specific additional metric on the results screen

---

## Section 11 — gameConfig.js Structure

Create this file first before any game implementation. Every numeric constant in this document belongs here.

```js
// src/constants/gameConfig.js

export const SESSION_DURATION_MS = 60000;

export const ADAPTIVE_LADDER = {
  correctToAdvance: 3,
  missesToRetreat: 2,
  min: 1,
  max: 5,
  dailyWarmUpCap: 3,
};

export const STREAK_MULTIPLIERS = {
  3:  1.1,
  6:  1.25,
  10: 1.5,
};

export const DOMAIN_SCORE_WEIGHTS = {
  previous: 0.7,
  session:  0.3,
};

export const SIGNAL_CHAIN = {
  NODE_GAP_MS: 300,
  FEEDBACK_DURATION_MS: 600,
  FEEDBACK_INTERVAL_MS: 80,
  levels: {
    1: { sequenceLength: 3, gridSize: '3x3', displayDuration: 800,  responseWindow: 8000  },
    2: { sequenceLength: 4, gridSize: '3x3', displayDuration: 650,  responseWindow: 8000  },
    3: { sequenceLength: 5, gridSize: '4x4', displayDuration: 500,  responseWindow: 10000 },
    4: { sequenceLength: 6, gridSize: '4x4', displayDuration: 400,  responseWindow: 10000 },
    5: { sequenceLength: 7, gridSize: '5x5', displayDuration: 300,  responseWindow: 12000 },
  },
};

export const FLASH_SORT = {
  FIXATION_DURATION_MS: 200,
  FEEDBACK_DURATION_MS: 300,
  ANTICIPATORY_THRESHOLD_MS: 100,
  SHAPE_SIZE_PT: 80,
  levels: {
    1: { stimulusDuration: 1000, ISI: 600, distractorType: 'none'             },
    2: { stimulusDuration: 800,  ISI: 500, distractorType: 'colour'           },
    3: { stimulusDuration: 600,  ISI: 400, distractorType: 'pattern_stripes'  },
    4: { stimulusDuration: 400,  ISI: 300, distractorType: 'pattern_colour'   },
    5: { stimulusDuration: 250,  ISI: 200, distractorType: 'high_similarity'  },
  },
};

export const LIGHTHOUSE_WATCH = {
  FEEDBACK_DURATION_MS: 200,
  FALSE_ALARM_PENALTY: -50,
  PULSE_INTERVAL_MS: 15000,
  levels: {
    1: { stimulusDuration: 1000, ISI: 800, targetFreq: 0.25,  distractorType: 'clearly_different' },
    2: { stimulusDuration: 800,  ISI: 600, targetFreq: 0.20,  distractorType: 'similar_fill'      },
    3: { stimulusDuration: 600,  ISI: 400, targetFreq: 0.167, distractorType: 'near_identical'    },
    4: { stimulusDuration: 400,  ISI: 300, targetFreq: 0.125, distractorType: 'star_variants'     },
    5: { stimulusDuration: 300,  ISI: 200, targetFreq: 0.10,  distractorType: '5pt_vs_6pt_star'   },
  },
};

export const CONTEXT_SWITCH = {
  FEEDBACK_DURATION_MS: 400,
  SWITCH_ROUND_BONUS_MULTIPLIER: 1.5,
  RULES: {
    shape:  { borderColour: '#185FA5', buttons: ['circle', 'square']  },
    colour: { borderColour: '#E24B4A', buttons: ['red', 'blue']       },
    size:   { borderColour: '#BA7517', buttons: ['large', 'small']    },
    count:  { borderColour: '#534AB7', buttons: ['one', 'two']        },
  },
  levels: {
    1: { switchFrequency: 4,        responseWindow: 2500, activeRules: ['shape','colour']               },
    2: { switchFrequency: 3,        responseWindow: 2000, activeRules: ['shape','colour']               },
    3: { switchFrequency: 2,        responseWindow: 1800, activeRules: ['shape','colour','size']        },
    4: { switchFrequency: 1,        responseWindow: 1500, activeRules: ['shape','colour','size']        },
    5: { switchFrequency: 'random', responseWindow: 1200, activeRules: ['shape','colour','size','count']},
  },
};

export const WORD_WEAVE = {
  FEEDBACK_DURATION_MS: 600,
  SPEED_BONUS_THRESHOLD: 0.4,
  SPEED_BONUS_POINTS: 25,
  levels: {
    1: { responseWindow: 12000, thinkTime: 0    },
    2: { responseWindow: 10000, thinkTime: 0    },
    3: { responseWindow: 9000,  thinkTime: 500  },
    4: { responseWindow: 8000,  thinkTime: 1000 },
    5: { responseWindow: 7000,  thinkTime: 1500 },
  },
};

export const PATTERN_FOLD = {
  FEEDBACK_DURATION_MS: 500,
  ROTATION_ANIMATION_MS: 300,
  SPEED_BONUS_THRESHOLD: 0.5,
  SPEED_BONUS_POINTS: 20,
  levels: {
    1: { rotationType: '2D',     angles: [45,90],      variants: 3, mirrorsIncluded: false },
    2: { rotationType: '2D',     angles: [90,135,180], variants: 3, mirrorsIncluded: true  },
    3: { rotationType: '2D_3D',  angles: [90,180],     variants: 4, mirrorsIncluded: true  },
    4: { rotationType: '3D',     angles: [90,180,270], variants: 4, mirrorsIncluded: true  },
    5: { rotationType: '3D_iso', angles: 'any',        variants: 4, mirrorsIncluded: true  },
  },
};

export const SESSION_RESULT = {
  TRANSITION_DURATION_MS: 800,
  SCORE_COUNT_UP_MS: 500,
  MAX_PAUSES: 2,
};
```

---

## Section 12 — Agent Task Queue

**Work through these tasks exactly in order. Do not skip ahead. Complete each task and verify it before moving to the next.**

---

### TASK 01 — Create gameConfig.js
Create `src/constants/gameConfig.js` with the full structure defined in Section 11. No game logic yet — only constants. Verify the file exports correctly by importing one constant in the app entry and logging it.

---

### TASK 02 — Build useSessionTimer
Create `src/features/train/engine/useSessionTimer.js`. Implement 60-second active-time tracking with pause/resume support and the 2-pause limit. Write a simple test: mount a component that uses the hook, call resume(), wait 2 seconds, call pause(), verify activeTimeElapsed is approximately 2000ms.

---

### TASK 03 — Build useAdaptiveLadder
Create `src/features/train/engine/useAdaptiveLadder.js`. Implement the 3-correct-advance / 2-miss-retreat ladder with AsyncStorage persistence for starting level and daily warm-up cap. Verify: call recordCorrect() 3 times, confirm level advances. Call recordMiss() 2 times, confirm level retreats.

---

### TASK 04 — Build useStreakMultiplier
Create `src/features/train/engine/useStreakMultiplier.js`. Implement streak tracking and multiplier thresholds from Section 2.3. Verify: after 6 correct calls, multiplier should be 1.25. After 1 miss call, multiplier should be 1.0 and streak should be 0.

---

### TASK 05 — Build scoring.js
Create `src/features/train/engine/scoring.js` with `calculateRoundScore`, `calculateSessionScore`, and `updateDomainScore` as defined in Section 2.4. Include the `maxScore` parameter extension for Context Switch. Write unit tests as inline comments showing expected inputs and outputs.

---

### TASK 06 — Build haptics.js
Create `src/utils/haptics.js` with the `GameHaptics` object from Section 2.5. Import and use this in every subsequent game component — never call expo-haptics directly.

---

### TASK 07 — Build SessionTimerBar component
Create `src/features/train/components/SessionTimerBar.js`. Renders the 3pt draining bar from Section 2.1. Accepts `activeTimeElapsed` and `totalDuration` as props. Implement the Lighthouse Watch pulse as an optional prop `pulse={true}` that activates the 15-second opacity cycle. Verify visually in a test screen.

---

### TASK 08 — Build StreakBadge component
Create `src/features/train/components/StreakBadge.js`. Renders the ×N.NN badge from Section 2.3. Accepts `multiplier`, `domainColour` as props. Renders null when multiplier is 1.0. Implement the scale-in and shake-on-reset animations. Verify with a test screen that toggles the multiplier.

---

### TASK 09 — Build ScoreDisplay component
Create `src/features/train/components/ScoreDisplay.js`. Renders the session score with floating delta animation from Section 2.6. Accepts `score` and `lastScore` as props, computes delta internally. Verify the floating delta animation plays and completes without memory leaks.

---

### TASK 10 — Build ActiveSessionScreen shell
Create `src/features/train/screens/ActiveSessionScreen.js` as a shell that: renders `SessionTimerBar`, `ScoreDisplay`, `StreakBadge`, a placeholder stimulus area, and handles pause/resume. Wire up `useSessionTimer`, `useAdaptiveLadder`, `useStreakMultiplier`. Does not render any actual game yet. Verify the session starts, timer counts, and the screen navigates to `SessionResultScreen` after 60 seconds.

---

### TASK 11 — Build SessionResultScreen
Create `src/features/train/screens/SessionResultScreen.js` with all standard metrics from Section 9. Accepts session data as route params. Renders the 5 standard metrics and a slot for the game-specific 6th metric (passed as a prop). Wire up the "done" and "play again" CTAs. Verify navigation flows correctly.

---

### TASK 12 — Build Signal Chain game
Create `src/features/train/games/SignalChain.js`. Implement the full round structure from Section 3.2. Integrate with the shared engine hooks. Wire into `ActiveSessionScreen` when `exercise.type === 'signal_chain'`. Verify: complete a 60-second session, check session score is in 0–100 range, check domain score updates.

---

### TASK 13 — Build Flash Sort game
Create `src/features/train/games/FlashSort.js`. Implement from Section 4. Include the fixation cross, full-screen tap zones, anticipatory error detection, and the first-session tutorial labels. Wire into `ActiveSessionScreen` for `exercise.type === 'flash_sort'`. Verify reaction time scoring produces values across the full 0–100 range at different response speeds.

---

### TASK 14 — Build Lighthouse Watch game
Create `src/features/train/games/LighthouseWatch.js`. Implement from Section 5. Include false alarm negative scoring, hit/miss/false alarm tracking, and the full-screen red false alarm flash. Wire in the vigilance pulse via `SessionTimerBar`'s pulse prop. Verify session score never goes negative (floor at 0).

---

### TASK 15 — Build Context Switch game
Create `src/features/train/games/ContextSwitch.js`. Implement from Section 6. Include rule system, button label synchronisation, switch round detection, and switch cost tracking. Update `calculateRoundScore` to accept `maxScore=150` for switch rounds. Wire in the first-session rule legend. Verify switch cost is logged correctly in session result.

---

### TASK 16 — Create wordWeaveAnalogies.js
Before building the Word Weave game component, create `src/data/wordWeaveAnalogies.js` with a minimum of 15 analogies per difficulty level (75 total). Each entry must follow the schema in Section 7.4 including the 3 distractor types and the explanation string. This data task must be complete before TASK 17 begins.

---

### TASK 17 — Build Word Weave game
Create `src/features/train/games/WordWeave.js`. Implement from Section 7. Include think time delay before options appear at levels 3–5, single-tap locking, and the 600ms explanation feedback. Apply de-emphasised score display for this game only. Verify thinkTime correctly delays option appearance without affecting the response window countdown.

---

### TASK 18 — Build Pattern Fold game
Create `src/features/train/games/PatternFold.js`. Implement from Section 8. Include mirror error tracking (separate from scoring), rotation feedback animation, and the equal-spacing layout constraint. Implement the narrow-screen stacked layout for ≤320pt screens. Verify the rotation animation plays at 300ms and completes before the next round begins.

---

### TASK 19 — Integration pass
With all 6 games implemented, run a full integration check:
- All 6 games complete a 60-second session without errors
- Session scores from all 6 games are in the 0–100 range
- Domain scores update correctly in scoresSlice after each session
- Results screen shows correct data for each game including game-specific metrics
- Adaptive ladder saves and restores correctly across sessions
- Daily warm-up cap (level 3 max at session start) applies correctly
- Streak multiplier resets correctly on miss across all games
- All haptics fire on correct events

---

### TASK 20 — Audit pass
Final audit before marking games as feature-complete:
- No hardcoded strings in any game component — all strings in strings.csv
- No hardcoded timing values in any game component — all constants from gameConfig.js
- No direct expo-haptics calls in game components — all through haptics.js
- No game deviates from the shared cross-game consistency rules in Section 10
- Session timer bar looks and behaves identically in all 6 games
- Results screen layout is identical across all 6 games (excluding the 6th metric slot)

---

*This document is the single source of truth for all game behaviour in Cognify. If you find a gap or ambiguity, add a `// TODO: clarify` comment at the relevant code location and do not invent behaviour. Do not modify this document during implementation — treat it as a locked specification.*
