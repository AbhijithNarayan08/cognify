/**
 * scoreService — business logic for cognitive score computation.
 *
 * Currently uses the mock algorithm from AppContext.
 * Replace implementations to connect a real scoring backend.
 */
import { generateMockHistory } from '../store/slices/scoresSlice';

export const scoreService = {
  /**
   * Generates a mock 30-day score history from a base score.
   * @param {number} baseScore
   * @returns {Array<{ date: string, score: number }>}
   */
  generateHistory: (baseScore) => generateMockHistory(baseScore),

  /**
   * Calculates score delta from exercise accuracy.
   * @param {number} correct
   * @param {number} total
   * @returns {{ score: number, delta: number }}
   */
  calculateExerciseScore: (correct, total) => {
    const accuracy = correct / Math.max(1, total);
    const score = Math.round(500 + accuracy * 350 + Math.random() * 50);
    const delta = Math.round(10 + accuracy * 30);
    return { score, delta };
  },

  /**
   * Returns the average of the last N scores in history.
   * @param {Array} history
   * @param {number} n
   * @returns {number}
   */
  getRecentAverage: (history, n = 7) => {
    if (!history?.length) return 0;
    const recent = history.slice(-n).map(h => h.score);
    return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  },
};
