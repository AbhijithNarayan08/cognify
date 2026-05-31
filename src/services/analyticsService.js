/**
 * analyticsService — central wrapper for tracking event analytics.
 *
 * Currently logs to console. Can be seamlessly wired to Amplitude, Segment,
 * or Firebase Analytics when keys are provided.
 */
export const analytics = {
  /**
   * Tracks an event with custom metadata.
   * @param {string} eventName
   * @param {object} properties
   */
  track: (eventName, properties = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[Analytics] 📈 Event: "${eventName}" at ${timestamp}`, properties);
  },
};
export default analytics;
