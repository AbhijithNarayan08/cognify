/**
 * dummyData — 30-day (1-month) history data parser and adapter
 *
 * Imports the static JSON dataset and overlays live date objects
 * and centralized user score shifts at runtime.
 *
 * Data contract per item in the returned array:
 *   date      : string  — ISO date string (YYYY-MM-DD)
 *   score     : number  — overall cognitive score (400–980)
 *   sleep     : number  — hours slept (0–12)
 *   trained   : boolean — whether the user trained that day
 *   mood      : string  — self-reported mood tag
 *   domains   : object  — { memory, speed, attention, executive, verbal, spatial }
 */
import rawDummyData from './dummyData.json';

/**
 * Returns 30-day score history adapted to the user's baseScore.
 *
 * The JSON baseline assumes a final-day score of 725.
 * scoreOffset shifts all scores so the latest day matches `baseScore`.
 *
 * @param {number} baseScore — the user's current cognitive score (default 680)
 * @returns {Array<Object>}
 */
export function get14DaysDummyData(baseScore = 680) {
  // The raw JSON's most-recent day (dayOffset 0) has score 725
  const scoreOffset = baseScore - 725;

  return rawDummyData.map(day => {
    const date = new Date();
    date.setDate(date.getDate() - day.dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    const clamp = (v) => Math.max(400, Math.min(980, Math.round(v)));

    return {
      date: dateStr,
      score: clamp(day.score + scoreOffset),
      sleep: day.sleep,
      trained: day.trained,
      mood: day.mood || 'neutral',
      domains: {
        memory:    clamp(day.domains.memory + scoreOffset),
        speed:     clamp(day.domains.speed + scoreOffset),
        attention: clamp(day.domains.attention + scoreOffset),
        executive: clamp(day.domains.executive + scoreOffset),
        verbal:    clamp(day.domains.verbal + scoreOffset),
        spatial:   clamp(day.domains.spatial + scoreOffset),
      },
    };
  });
}
