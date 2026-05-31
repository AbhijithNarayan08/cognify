/**
 * insightService — resolves insight templates with theme-aware colors.
 *
 * Keeps color resolution out of the data layer and in the service/presentation boundary.
 */
import { INSIGHT_TEMPLATES, WEEKLY_BRIEF } from '../data/exercises';

/**
 * Returns insight templates enriched with domain colors from the theme.
 * @param {object} Colors - theme colors object from useThemeColors()
 * @returns {Array}
 */
export const insightService = {
  getTemplates: (Colors) =>
    INSIGHT_TEMPLATES.map(t => ({
      ...t,
      accent: Colors.domain?.[t.domain]?.main || Colors.brandPrimary,
      bg: Colors.domain?.[t.domain]?.light || Colors.brandLight,
    })),

  getWeeklyBrief: () => WEEKLY_BRIEF,
};
