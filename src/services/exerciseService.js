/**
 * exerciseService — interface for exercise data access.
 *
 * Currently backed by static mock data.
 * To connect a real backend: swap the implementations below without
 * touching any screen or hook code.
 */
import { EXERCISES, DAILY_WORKOUT, FLASH_SORT_STIMULI } from '../data/exercises';

export const exerciseService = {
  /**
   * Returns the full exercise library.
   * @returns {Promise<Array>}
   */
  getAll: async () => EXERCISES,

  /**
   * Returns today's workout set.
   * @returns {Promise<Array>}
   */
  getDailyWorkout: async () => {
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Deterministic pseudo-shuffle of exercises using a day seed
    const shuffled = [...EXERCISES].sort((a, b) => {
      const aHash = ((daySeed * (a.id.charCodeAt(0) || 1)) % 101);
      const bHash = ((daySeed * (b.id.charCodeAt(0) || 1)) % 101);
      return aHash - bHash;
    });
    
    const daily = [];
    const domainsUsed = new Set();
    for (const ex of shuffled) {
      if (!domainsUsed.has(ex.domain)) {
        daily.push(ex);
        domainsUsed.add(ex.domain);
        if (daily.length === 4) break;
      }
    }
    
    // Fallback if not enough unique domains (safeguard)
    if (daily.length < 4) {
      for (const ex of shuffled) {
        if (!daily.includes(ex)) {
          daily.push(ex);
          if (daily.length === 4) break;
        }
      }
    }
    
    return daily;
  },

  /**
   * Returns stimuli for the flash-sort game.
   * @returns {Promise<Array>}
   */
  getFlashSortStimuli: async () => FLASH_SORT_STIMULI,

  /**
   * Returns a single exercise by ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  getById: async (id) => EXERCISES.find(e => e.id === id) || null,
};
