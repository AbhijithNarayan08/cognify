jest.mock('../store/slices/scoresSlice', () => ({
  generateMockHistory: jest.fn(),
}));

import { scoreService } from './scoreService';

describe('scoreService', () => {
  describe('calculateExerciseScore', () => {
    let randomSpy;

    beforeEach(() => {
      // Mock Math.random() to always return 0.5 for deterministic scoring checks
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      randomSpy.mockRestore();
    });

    test('calculates score and delta for 100% accuracy', () => {
      const result = scoreService.calculateExerciseScore(10, 10);
      // accuracy = 1.0
      // score = Math.round(500 + 1.0 * 350 + 0.5 * 50) = Math.round(500 + 350 + 25) = 875
      // delta = Math.round(10 + 1.0 * 30) = 40
      expect(result).toEqual({ score: 875, delta: 40 });
    });

    test('calculates score and delta for 0% accuracy', () => {
      const result = scoreService.calculateExerciseScore(0, 10);
      // accuracy = 0.0
      // score = Math.round(500 + 0.0 * 350 + 0.5 * 50) = Math.round(525) = 525
      // delta = Math.round(10 + 0.0 * 30) = 10
      expect(result).toEqual({ score: 525, delta: 10 });
    });

    test('calculates score and delta for 50% accuracy', () => {
      const result = scoreService.calculateExerciseScore(5, 10);
      // accuracy = 0.5
      // score = Math.round(500 + 0.5 * 350 + 0.5 * 50) = Math.round(500 + 175 + 25) = 700
      // delta = Math.round(10 + 0.5 * 30) = 25
      expect(result).toEqual({ score: 700, delta: 25 });
    });

    test('handles division by zero edge case safely', () => {
      const result = scoreService.calculateExerciseScore(0, 0);
      // Math.max(1, 0) => 1. accuracy = 0/1 = 0
      // score = Math.round(500 + 0 + 25) = 525
      // delta = 10
      expect(result).toEqual({ score: 525, delta: 10 });
    });
  });

  describe('getRecentAverage', () => {
    test('returns 0 for empty or null history', () => {
      expect(scoreService.getRecentAverage([])).toBe(0);
      expect(scoreService.getRecentAverage(null)).toBe(0);
      expect(scoreService.getRecentAverage(undefined)).toBe(0);
    });

    test('averages all scores when history length is less than requested count (N)', () => {
      const history = [
        { score: 600 },
        { score: 700 },
      ];
      // (600 + 700) / 2 = 650
      expect(scoreService.getRecentAverage(history, 5)).toBe(650);
    });

    test('averages exactly the last N scores when history length is greater than N', () => {
      const history = [
        { score: 500 }, // ignored
        { score: 550 }, // ignored
        { score: 600 },
        { score: 700 },
        { score: 800 },
      ];
      // last 3: 600, 700, 800
      // (600 + 700 + 800) / 3 = 700
      expect(scoreService.getRecentAverage(history, 3)).toBe(700);
    });

    test('uses default value of N=7 when not specified', () => {
      const history = [
        { score: 100 }, // ignored
        { score: 200 },
        { score: 300 },
        { score: 400 },
        { score: 500 },
        { score: 600 },
        { score: 700 },
        { score: 800 },
      ];
      // last 7: 200, 300, 400, 500, 600, 700, 800
      // sum = 3500. 3500 / 7 = 500
      expect(scoreService.getRecentAverage(history)).toBe(500);
    });
  });
});
