// src/features/train/engine/scoring.js
import { DOMAIN_SCORE_WEIGHTS } from '../../../constants/gameConfig';

/**
 * Calculates the score of a single round.
 * 
 * Formula: Math.round(Math.min(maxScore, baseScore + speedBonus) * multiplier)
 * 
 * Unit Tests (Expected inputs -> outputs):
 * 1. Base correct + no bonus:
 *    { baseScore: 100, speedBonus: 0, multiplier: 1.0 } -> 100
 * 2. Base correct + speed bonus:
 *    { baseScore: 100, speedBonus: 20, multiplier: 1.0 } -> 100 (capped by default maxScore=100)
 * 3. Base correct + speed bonus + multiplier:
 *    { baseScore: 100, speedBonus: 20, multiplier: 1.25 } -> 125 (cap applied BEFORE multiplier)
 * 4. Context Switch custom maxScore (150):
 *    { baseScore: 150, speedBonus: 0, multiplier: 1.1, maxScore: 150 } -> 165
 */
export function calculateRoundScore({ baseScore, speedBonus = 0, multiplier = 1.0, maxScore = 100 }) {
  const raw = Math.min(maxScore, baseScore + speedBonus);
  return Math.round(raw * multiplier);
}

/**
 * Calculates the session score as the average of round scores.
 * 
 * Unit Tests:
 * 1. Empty array -> 0
 * 2. [100, 110, 95] -> 102
 */
export function calculateSessionScore(roundScores) {
  if (!roundScores || roundScores.length === 0) return 0;
  return Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length);
}

/**
 * Updates a domain's score as a rolling weighted average.
 * 
 * Formula: Math.round(previousDomainScore * 0.7 + sessionScore * 0.3)
 * 
 * Unit Tests:
 * 1. { previous: 700, sessionScore: 800 } -> 730
 */
export function updateDomainScore(previousDomainScore, sessionScore) {
  const prevWeight = DOMAIN_SCORE_WEIGHTS?.previous ?? 0.7;
  const sessWeight = DOMAIN_SCORE_WEIGHTS?.session ?? 0.3;
  return Math.round(previousDomainScore * prevWeight + sessionScore * sessWeight);
}

/**
 * Normalises raw session score to 0-100 scale based on average level during session.
 */
export function normaliseSessionScore(rawSessionScore, averageLevelDuringSession) {
  // Maximum possible score per round at each level (perfect + fast, no streak):
  const MAX_ROUND_SCORES = {
    1: 50,    // 3 nodes × 10 × 1.0 + 10 completion + 10 speed
    2: 60,    // 4 nodes × 10 × 1.0 + 10 + 10
    3: 105,   // 5 nodes × 10 × 1.5 + 15 + 15
    4: 120,   // 6 nodes × 10 × 1.5 + 15 + 15
    5: 180,   // 7 nodes × 10 × 2.0 + 20 + 20
  };
  const ceiling = MAX_ROUND_SCORES[Math.round(averageLevelDuringSession)] || 100;
  return Math.min(100, Math.round((rawSessionScore / ceiling) * 100));
}

/**
 * Normalises raw Flash Sort session score to 0-100 scale.
 */
export function normaliseFlashSortSessionScore(rawSessionScore, averageLevelDuringSession) {
  const MAX_ROUND_SCORES = {
    1: 130, // Math.round((100 + 20 + 10) * 1.0)
    2: 130, // Math.round((100 + 20 + 10) * 1.0)
    3: 195, // Math.round((100 + 20 + 10) * 1.5)
    4: 195, // Math.round((100 + 20 + 10) * 1.5)
    5: 292, // Math.round((100 + 20 + 10) * 2.25)
  };
  const ceiling = MAX_ROUND_SCORES[Math.round(averageLevelDuringSession)] || 130;
  return Math.min(100, Math.round((rawSessionScore / ceiling) * 100));
}

