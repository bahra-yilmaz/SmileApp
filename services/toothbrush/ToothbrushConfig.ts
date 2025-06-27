// Configuration for toothbrush lifespan, health, and caching

export const TOOTHBRUSH_CONFIG = {
  /**
   * Recommended lifespan of a toothbrush in days.
   * The American Dental Association (ADA) recommends replacement every 3-4 months.
   * We use 90 days as the standard.
   */
  LIFESPAN_DAYS: 90,

  /**
   * Health status thresholds, defined in days.
   * These determine the status text and color in the UI.
   */
  HEALTH_THRESHOLDS: {
    BRAND_NEW: 7, // 0-7 days
    FRESH: 30, // 8-30 days
    GOOD: 60, // 31-60 days
    REPLACE_SOON: 90, // 61-90 days
    // Over 90 days is considered 'overdue'
  },

  /**
   * UI Colors corresponding to each health status.
   */
  HEALTH_COLORS: {
    BRAND_NEW: '#1ABC9C', // Turquoise
    FRESH: '#2ECC71', // Green
    GOOD: '#27AE60', // Darker Green
    REPLACE_SOON: '#F39C12', // Orange
    OVERDUE: '#E74C3C', // Red
  },

  /**
   * Local storage keys for caching and data persistence.
   */
  STORAGE_KEYS: {
    TOOTHBRUSH_DATA: 'app_toothbrush_data',
    TOOTHBRUSH_STATS_CACHE: 'app_toothbrush_stats_cache',
  },

  /**
   * Cache duration in milliseconds.
   * 5 minutes: 5 * 60 * 1000
   */
  CACHE_DURATION_MS: 300000,

  RECOMMENDED_REPLACEMENT_DAYS: 90, // 3 months
  REPLACE_SOON_THRESHOLD_DAYS: 75, // Approx 2.5 months
} as const;
