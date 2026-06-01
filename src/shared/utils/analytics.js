/**
 * analytics.js — mathematical analytics engine.
 * Computes Pearson correlation coefficients and linear regression trajectories.
 */

/**
 * Calculates the Pearson Correlation Coefficient (r) between two numeric arrays.
 * Includes absolute zero-variance protections to guard against division by zero (NaN).
 *
 * @param {Array<number>} X - independent lifestyle ratings (e.g. 0-4)
 * @param {Array<number>} Y - dependent cognitive scores (e.g. 400-1000)
 * @returns {number} correlation coefficient r between -1 and +1
 */
export function calculatePearson(X, Y) {
  const n = X.length;
  if (n === 0 || n !== Y.length) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (let i = 0; i < n; i++) {
    const x = X[i];
    const y = Y[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  if (den === 0) return 0; // zero-variance guard against NaN
  return num / den;
}

/**
 * Calculates the linear regression slope (m) of score history.
 * Measures cognitive score movement trend per calendar day.
 *
 * @param {Array<{score: number}>} history - session history objects
 * @returns {number} daily growth/decline rate (slope m)
 */
export function calculateRegressionSlope(history) {
  const n = history.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i; // sequential day index
    const y = history[i].score || 700;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const num = n * sumXY - sumX * sumY;
  const den = n * sumXX - sumX * sumX;

  if (den === 0) return 0; // flatline protection
  return num / den;
}

/**
 * Normalizes any lifestyle habit value (number, string tag, null) into a clean, safe numeric rating.
 * Guarantees that calculations and graphs never encounter NaN values.
 *
 * @param {string} habit - 'sleep' | 'mood' | 'activity'
 * @param {any} val - raw logged value or string tag
 * @returns {number} normalized rating between 0 and 12
 */
export function getLifestyleRating(habit, val) {
  if (val === undefined || val === null) {
    return 2; // neutral fallback
  }

  if (habit === 'sleep') {
    const num = Number(val);
    return isNaN(num) ? 2 : num;
  }

  if (habit === 'mood') {
    if (typeof val === 'number') return val;
    const str = String(val).toLowerCase().trim();
    if (str === 'terrible') return 0;
    if (str === 'poor') return 1;
    if (str === 'ok' || str === 'okay' || str === 'neutral') return 2;
    if (str === 'good') return 3;
    if (str === 'great' || str === 'happy') return 4;
    return 2;
  }

  if (habit === 'activity') {
    if (typeof val === 'number') return val;
    const str = String(val).toLowerCase().trim();
    if (str === 'rest') return 0;
    if (str === 'walk') return 1;
    if (str === 'run') return 2;
    if (str === 'gym') return 3;
    if (str === 'sport') return 4;
    return 2;
  }

  const num = Number(val);
  return isNaN(num) ? 2 : num;
}
