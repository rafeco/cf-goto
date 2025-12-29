/**
 * Analytics Engine helpers
 */

/**
 * Write redirect event to Analytics Engine
 * @param {object} env - Worker environment bindings
 * @param {string} shortcut - The shortcut that was used
 * @param {Request} request - The incoming request
 */
export function trackRedirect(env, shortcut, request) {
  try {
    // Extract useful metadata from request
    const referrer = request.headers.get('referer') || 'direct';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const country = request.cf?.country || 'unknown';

    // Write data point to Analytics Engine
    env.ANALYTICS.writeDataPoint({
      // Blob fields (strings)
      blobs: [shortcut, referrer, userAgent, country],
      // Double fields (numbers) - using current timestamp
      doubles: [Date.now()],
      // Index for efficient querying
      indexes: [shortcut]
    });
  } catch (error) {
    // Don't fail the redirect if analytics fails
    console.error('Analytics tracking failed:', error);
  }
}

/**
 * Query analytics for a specific shortcut
 * Note: This is a placeholder - actual implementation would use
 * Cloudflare's GraphQL or SQL API to query Analytics Engine
 *
 * @param {object} env - Worker environment bindings
 * @param {string} shortcut - The shortcut to get analytics for
 * @returns {Promise<object>} - Analytics data
 */
export async function getAnalytics(env, shortcut) {
  // For now, return placeholder data
  // In production, you would query Analytics Engine via GraphQL/SQL API
  return {
    shortcut,
    totalClicks: 0,
    note: 'Analytics querying requires GraphQL/SQL API integration'
  };
}
