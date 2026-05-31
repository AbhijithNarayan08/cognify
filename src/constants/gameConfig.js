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
  DIFFICULTY_TIERS: {
    easy:   [1, 2],
    medium: [3, 4],
    hard:   [5],
  },
  TIER_LABELS: {
    1: 'easy', 2: 'easy',
    3: 'medium', 4: 'medium',
    5: 'hard',
  },
  POINTS_PER_NODE: 10,
  TIER_MULTIPLIERS: {
    easy:   1.0,
    medium: 1.5,
    hard:   2.0,
  },
  levels: {
    1: {
      sequenceLength:   3,
      gridSize:         '3x3',
      displayDuration:  800,    // ms per node during watch phase
      nodeGap:          300,    // ms between nodes (constant)
      responseWindow:   8000,   // ms to complete recall
      tier:             'easy',
    },
    2: {
      sequenceLength:   4,
      gridSize:         '3x3',
      displayDuration:  650,
      nodeGap:          300,
      responseWindow:   9000,   // slightly longer
      tier:             'easy',
    },
    3: {
      sequenceLength:   5,
      gridSize:         '4x4',
      displayDuration:  500,
      nodeGap:          300,
      responseWindow:   10000,
      tier:             'medium',
    },
    4: {
      sequenceLength:   6,
      gridSize:         '4x4',
      displayDuration:  400,
      nodeGap:          300,
      responseWindow:   11000,
      tier:             'medium',
    },
    5: {
      sequenceLength:   7,
      gridSize:         '5x5',
      displayDuration:  300,
      nodeGap:          300,
      responseWindow:   12000,
      tier:             'hard',
    },
  },
};

export const FLASH_SORT = {
  FIXATION_DURATION_MS: 200,
  FEEDBACK_DURATION_MS: 300,
  ANTICIPATORY_THRESHOLD_MS: 100,
  SHAPE_SIZE_PT: 80,
  SQUARE_BORDER_RADIUS: 8,
  DISTRACTOR_COLOURS: ['#FFC000', '#0073E6', '#3DAB7F', '#D85A30'],
  DIFFICULTY_TIERS: {
    easy:   [1, 2],
    medium: [3, 4],
    hard:   [5],
  },
  TIER_LABELS: {
    1: 'easy', 2: 'easy',
    3: 'medium', 4: 'medium',
    5: 'hard',
  },
  TIER_MULTIPLIERS: {
    easy:   1.0,
    medium: 1.5,
    hard:   2.25,
  },
  MAX_ROUND_SCORES: {
    1: 130, // Math.round((100 + 20 + 10) * 1.0)
    2: 130, // Math.round((100 + 20 + 10) * 1.0)
    3: 195, // Math.round((100 + 20 + 10) * 1.5)
    4: 195, // Math.round((100 + 20 + 10) * 1.5)
    5: 292, // Math.round((100 + 20 + 10) * 2.25)
  },
  REACTION_TIME_BENCHMARKS: {
    excellent: { max: 250, label: "excellent — elite response speed" },
    great:     { max: 350, label: "great — well above average" },
    good:      { max: 450, label: "good — above average" },
    average:   { max: 600, label: "average response speed" },
    slow:      { max: Infinity, label: "keep training — speed improves quickly" },
  },
  levels: {
    1: {
      stimulusDuration:   1000,   // ms shape is visible
      ISI:                600,    // ms between rounds
      distractorType:     'none',
      shapeColour:        'primary',
      tier:               'easy',
    },
    2: {
      stimulusDuration:   800,
      ISI:                500,
      distractorType:     'colour',
      shapeColour:        'varied',
      tier:               'easy',
    },
    3: {
      stimulusDuration:   600,
      ISI:                400,
      distractorType:     'pattern_stripes',
      shapeColour:        'varied',
      tier:               'medium',
    },
    4: {
      stimulusDuration:   400,
      ISI:                300,
      distractorType:     'pattern_colour',
      shapeColour:        'varied',
      tier:               'medium',
    },
    5: {
      stimulusDuration:   250,
      ISI:                200,
      distractorType:     'high_similarity',
      shapeColour:        'varied',
      tier:               'hard',
    },
  },
};

export const LIGHTHOUSE_WATCH = {
  FEEDBACK_DURATION_MS: 200,
  FALSE_ALARM_PENALTY: -60,
  PULSE_INTERVAL_MS: 15000,
  DIFFICULTY_TIERS: {
    easy:   [1, 2],
    medium: [3, 4],
    hard:   [5],
  },
  TIER_LABELS: {
    1: 'Easy', 2: 'Easy',
    3: 'Medium', 4: 'Medium',
    5: 'Hard',
  },
  TIER_MULTIPLIERS: {
    Easy:   1.0,
    Medium: 1.6,
    Hard:   2.5,
  },
  SCORE_EVENTS: {
    HIT_BASE:         100,
    FALSE_ALARM:      -60,
    MISS:             0,
    CORRECT_REJECTION: 0,
  },
  MAX_ROUND_SCORES: {
    1: 100,
    2: 100,
    3: 160,
    4: 160,
    5: 250,
  },
  levels: {
    1: {
      stimulusDuration:  1000,
      ISI:               800,
      targetFrequency:   0.25,
      distractorSet:     'clearly_different',
      tier:              'Easy',
    },
    2: {
      stimulusDuration:  800,
      ISI:               600,
      targetFrequency:   0.20,
      distractorSet:     'similar_family',
      tier:              'Easy',
    },
    3: {
      stimulusDuration:  600,
      ISI:               400,
      targetFrequency:   0.167,
      distractorSet:     'near_identical',
      tier:              'Medium',
    },
    4: {
      stimulusDuration:  400,
      ISI:               300,
      targetFrequency:   0.125,
      distractorSet:     'star_variants',
      tier:              'Medium',
    },
    5: {
      stimulusDuration:  300,
      ISI:               200,
      targetFrequency:   0.10,
      distractorSet:     'five_vs_six_point',
      tier:              'Hard',
    },
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
  timingLevels: {
    1: { responseWindow: 10000 },
    2: { responseWindow: 9000  },
    3: { responseWindow: 8000  },
    4: { responseWindow: 7000  },
    5: { responseWindow: 6000  },
  },
};

export const SESSION_RESULT = {
  TRANSITION_DURATION_MS: 800,
  SCORE_COUNT_UP_MS: 500,
  MAX_PAUSES: 2,
};
