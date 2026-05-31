import { t } from '../constants/useStrings';

// ── Exercise library ───────────────────────────────────────────────────────
// Pure data — no imports from UI or theme layers.
// Color resolution happens in the presentation layer.

export const EXERCISES = [
  {
    id: 'signal-chain',
    get name() { return t('exercise.signal-chain.name'); },
    domain: 'memory',
    duration: 90,
    difficulty: 2,
    get description() { return t('exercise.signal-chain.description'); },
    get instruction() { return t('exercise.signal-chain.instruction'); },
    type: 'sequence',
  },
  {
    id: 'flash-sort',
    get name() { return t('exercise.flash-sort.name'); },
    domain: 'speed',
    duration: 60,
    difficulty: 2,
    get description() { return t('exercise.flash-sort.description'); },
    get instruction() { return t('exercise.flash-sort.instruction'); },
    type: 'rapid-response',
  },
  {
    id: 'lighthouse-watch',
    get name() { return t('exercise.lighthouse-watch.name'); },
    domain: 'attention',
    duration: 90,
    difficulty: 2,
    get description() { return t('exercise.lighthouse-watch.description'); },
    get instruction() { return t('exercise.lighthouse-watch.instruction'); },
    type: 'vigilance',
  },
  {
    id: 'context-switch',
    get name() { return t('exercise.context-switch.name'); },
    domain: 'executive',
    duration: 75,
    difficulty: 3,
    get description() { return t('exercise.context-switch.description'); },
    get instruction() { return t('exercise.context-switch.instruction'); },
    type: 'task-switch',
  },
  {
    id: 'word-weave',
    get name() { return t('exercise.word-weave.name'); },
    domain: 'verbal',
    duration: 60,
    difficulty: 1,
    get description() { return t('exercise.word-weave.description'); },
    get instruction() { return t('exercise.word-weave.instruction'); },
    type: 'analogy',
  },
  {
    id: 'pattern-fold',
    get name() { return t('exercise.pattern-fold.name'); },
    domain: 'spatial',
    duration: 75,
    difficulty: 2,
    get description() { return t('exercise.pattern-fold.description'); },
    get instruction() { return t('exercise.pattern-fold.instruction'); },
    type: 'rotation',
  },
];

// Daily workout — 4 exercises selected by rules engine
export const DAILY_WORKOUT = [
  EXERCISES[0], // memory
  EXERCISES[1], // speed
  EXERCISES[4], // verbal
  EXERCISES[5], // spatial
];

// ── Rapid-response stimuli (Flash Sort) ──────────────────────────────────
export const FLASH_SORT_STIMULI = [
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
  { shape: 'circle', correct: 'left' },
  { shape: 'square', correct: 'right' },
];

// ── Insight templates ─────────────────────────────────────────────────────
// NOTE: No color values here. The 'domain' key is used by the presentation
// layer to resolve colors from the theme at render time.
export const INSIGHT_TEMPLATES = [
  {
    id: 'sleep-attention',
    get headline() { return t('insight.sleep-attention.headline'); },
    get body() { return t('insight.sleep-attention.body'); },
    domain: 'attention',
  },
  {
    id: 'memory-strength',
    get headline() { return t('insight.memory-strength.headline'); },
    get body() { return t('insight.memory-strength.body'); },
    domain: 'memory',
  },
  {
    id: 'speed-plateau',
    get headline() { return t('insight.speed-plateau.headline'); },
    get body() { return t('insight.speed-plateau.body'); },
    domain: 'speed',
  },
];

// Weekly brief content
export const WEEKLY_BRIEF = {
  get scoreRecap() { return t('weeklyBrief.scoreRecap'); },
  get topMoment() { return t('weeklyBrief.topMoment'); },
  get lifestyleHighlight() { return t('weeklyBrief.lifestyleHighlight'); },
  get weekFocus() { return t('weeklyBrief.weekFocus'); },
};
