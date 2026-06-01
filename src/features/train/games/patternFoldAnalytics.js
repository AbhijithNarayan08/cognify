// src/features/train/games/patternFoldAnalytics.js

/**
 * Calculates a composite Spatial Efficiency Index (0-100) combining accuracy and reaction speed.
 * Weighted: 70% accuracy, 30% speed.
 * 
 * @param {Array} rounds - Logged rounds for the session
 * @param {number} responseWindow - Time limit in ms for the level
 * @returns {number|null} Composite score, or null if < 6 completed rounds
 */
export function computeSpatialEfficiency(rounds, responseWindow) {
  if (!rounds || rounds.length < 6) return null;
  
  const completedRounds = rounds.filter(r => !r.timedOut);
  if (completedRounds.length === 0) return 0;

  const correctCount = rounds.filter(r => r.correct).length;
  const accuracy = correctCount / rounds.length;

  const avgRT = rounds.reduce((sum, r) => sum + r.reactionTimeMs, 0) / rounds.length;
  const speedScore = Math.max(0, 1 - (avgRT / responseWindow));

  return Math.round((accuracy * 0.7 + speedScore * 0.3) * 100);
}

/**
 * Computes accuracy ratio per specific rotation angle.
 * Requires at least 3 rounds of the given angle type, otherwise returns null.
 * 
 * @param {Array} rounds - Logged rounds for the session
 * @returns {Object} Accuracy mapping for 90, 180, and 270 degrees
 */
export function computeAngleAccuracy(rounds) {
  if (!rounds || rounds.length === 0) return { 90: null, 180: null, 270: null };

  return [90, 180, 270].reduce((acc, angle) => {
    const angleRounds = rounds.filter(r => r.targetAngle === angle);
    acc[angle] = angleRounds.length >= 3
      ? angleRounds.filter(r => r.correct).length / angleRounds.length
      : null;
    return acc;
  }, {});
}

/**
 * Computes the distribution of incorrect answers across various foil types.
 * 
 * @param {Array} rounds - Logged rounds for the session
 * @returns {Object} Foil breakdown ratios (mirror, angle, chirality) summing to 1.0
 */
export function computeFoilBreakdown(rounds) {
  const result = { mirror: 0, angle: 0, chirality: 0 };
  if (!rounds || rounds.length === 0) return result;

  const errors = rounds.filter(r => !r.correct && !r.timedOut);
  const totalErrors = errors.length;

  if (totalErrors === 0) return result;

  result.mirror = errors.filter(r => r.foilTypeSelected === 'mirror').length / totalErrors;
  result.angle = errors.filter(r => r.foilTypeSelected === 'angle').length / totalErrors;
  result.chirality = errors.filter(r => r.foilTypeSelected === 'chirality').length / totalErrors;

  return result;
}

/**
 * Detects cognitive pattern insights based on session metrics and longitudinal history.
 * 
 * @param {Object} session - Current session object
 * @param {Array} recentSessions - Historical sessions (excluding current)
 * @returns {Array<string>} Array of detected Pattern IDs
 */
export function detectPatterns(session, recentSessions = []) {
  const patterns = [];
  if (!session) return patterns;

  const { foilBreakdown, angleAccuracy, eliteSpeedRate, accuracy, spatialEfficiency, rounds } = session;

  // Pattern 1: MIRROR_TRAP_PRONE
  if (foilBreakdown && foilBreakdown.mirror > 0.5) {
    patterns.push('MIRROR_TRAP_PRONE');
  }

  // Pattern 2: ANGLE_270_WEAK
  if (
    angleAccuracy &&
    angleAccuracy[270] !== null &&
    angleAccuracy[270] < 0.65 &&
    angleAccuracy[90] !== null &&
    angleAccuracy[90] > 0.80 &&
    angleAccuracy[180] !== null &&
    angleAccuracy[180] > 0.80
  ) {
    patterns.push('ANGLE_270_WEAK');
  }

  // Pattern 3: SPEED_ACCURACY_TRADEOFF
  if (eliteSpeedRate > 0.4 && accuracy < 0.70) {
    patterns.push('SPEED_ACCURACY_TRADEOFF');
  }

  // Pattern 4: DELIBERATE_BUT_SLOW
  if (accuracy > 0.85 && eliteSpeedRate < 0.10) {
    patterns.push('DELIBERATE_BUT_SLOW');
  }

  // Pattern 5: CHIRALITY_BLIND
  if (foilBreakdown && foilBreakdown.chirality > 0.30) {
    patterns.push('CHIRALITY_BLIND');
  }

  // Pattern 6: LEVEL_COLOR_STRUGGLE
  // Compares accuracy when color segments > 1 (Level 3+) vs lower levels
  if (rounds && rounds.length > 0) {
    const multiColorRounds = rounds.filter(r => r.colorSegments > 1);
    const monoColorRounds = rounds.filter(r => r.colorSegments === 1);
    if (multiColorRounds.length >= 3 && monoColorRounds.length >= 3) {
      const multiAcc = multiColorRounds.filter(r => r.correct).length / multiColorRounds.length;
      const monoAcc = monoColorRounds.filter(r => r.correct).length / monoColorRounds.length;
      if (monoAcc - multiAcc > 0.20) {
        patterns.push('LEVEL_COLOR_STRUGGLE');
      }
    }
  }

  // Pattern 7: SPATIAL_IMPROVEMENT
  if (recentSessions && recentSessions.length >= 3) {
    // Compare with the session from 3 runs ago
    const referenceSession = recentSessions[0]; // Ordered oldest to newest in recentHistory
    if (referenceSession && spatialEfficiency - referenceSession.spatialEfficiency > 15) {
      patterns.push('SPATIAL_IMPROVEMENT');
    }
  }

  return patterns;
}

/**
 * Translates pattern IDs into localization keys or fallback copy.
 * 
 * @param {string} patternId - Pattern ID
 * @returns {string} User-facing instruction text
 */
export function getInsightCopy(patternId) {
  switch (patternId) {
    case 'MIRROR_TRAP_PRONE':
      return "You're frequently fooled by mirror images — your brain matches shape outlines before checking rotation direction.";
    case 'ANGLE_270_WEAK':
      return "Your brain rotates clockwise faster than counter-clockwise — 270° is your spatial blind spot.";
    case 'SPEED_ACCURACY_TRADEOFF':
      return "You're deciding faster than your spatial reasoning can keep up — pause before your first tap.";
    case 'DELIBERATE_BUT_SLOW':
      return "Precise but cautious — try trusting your first instinct more, you're usually right!";
    case 'CHIRALITY_BLIND':
      return "You're matching overall orientation before shape — check the block structure first, then rotation.";
    case 'LEVEL_COLOR_STRUGGLE':
      return "Multi-color shapes are disrupting your rotation tracking — focus on one color anchor per rotation.";
    case 'SPATIAL_IMPROVEMENT':
      return "Your spatial reasoning is measurably sharper — keep the streak going!";
    default:
      return "Keep practicing to uncover more deep insights about your unique spatial cognitive style.";
  }
}

/**
 * Analyzes session history and makes adaptive difficulty level suggestions.
 * 
 * @param {Array} history - Previous sessions list
 * @param {number} currentLevel - Current active level (1-5)
 * @returns {Object|null} Recommendation object: { direction: 'UP'|'DOWN', toLevel: number, reason: string }
 */
export function evaluateAdaptiveDifficulty(history, currentLevel) {
  if (!history || history.length === 0) return null;

  // Filter history to current level sessions only
  const levelSessions = history.filter(s => s.level === currentLevel && !s.abandoned);
  
  // LEVEL UP: Last 3 sessions with spatial efficiency > 80 and mirror trap rate < 20%
  if (levelSessions.length >= 3 && currentLevel < 5) {
    const recent = levelSessions.slice(0, 3); // Assumed to be ordered newest first
    const allHighEfficiency = recent.every(s => s.spatialEfficiency > 80);
    const allLowMirrorTrap = recent.every(s => s.foilBreakdown && s.foilBreakdown.mirror < 0.20);
    
    if (allHighEfficiency && allLowMirrorTrap) {
      return {
        direction: 'UP',
        fromLevel: currentLevel,
        toLevel: currentLevel + 1,
        reason: "Your mirror-trap accuracy is outstanding — ready for a tougher challenge?"
      };
    }
  }

  // LEVEL DOWN: Last 2 sessions with spatial efficiency < 45 or mirror trap rate > 60%
  if (levelSessions.length >= 2 && currentLevel > 1) {
    const recent = levelSessions.slice(0, 2);
    const lowEfficiency = recent.every(s => s.spatialEfficiency < 45);
    const highMirrorTrap = recent.every(s => s.foilBreakdown && s.foilBreakdown.mirror > 0.60);

    if (lowEfficiency || highMirrorTrap) {
      return {
        direction: 'DOWN',
        fromLevel: currentLevel,
        toLevel: currentLevel - 1,
        reason: "The rotation complexity seems high. Let's build solid fundamentals at a lower level."
      };
    }
  }

  return null;
}
