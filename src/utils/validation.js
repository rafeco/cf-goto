/**
 * Validation utilities for URLs and shortcuts
 */

// Reserved paths that cannot be used as shortcuts
const RESERVED_PATHS = ['_manage', '_api', 'admin', 'api'];

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Must start with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // Try to parse as URL
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate shortcut format
 * @param {string} shortcut - Shortcut to validate
 * @returns {object} - { valid: boolean, error: string }
 */
export function validateShortcut(shortcut) {
  if (!shortcut || typeof shortcut !== 'string') {
    return { valid: false, error: 'Shortcut is required' };
  }

  // Check length
  if (shortcut.length < 1 || shortcut.length > 100) {
    return { valid: false, error: 'Shortcut must be 1-100 characters' };
  }

  // Must be alphanumeric with hyphens and underscores (no leading/trailing hyphens)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(shortcut)) {
    return {
      valid: false,
      error: 'Shortcut must be alphanumeric (hyphens/underscores allowed, no leading/trailing hyphens)'
    };
  }

  // Check reserved paths
  if (RESERVED_PATHS.includes(shortcut.toLowerCase())) {
    return { valid: false, error: `"${shortcut}" is a reserved path` };
  }

  // Check for reserved prefixes
  if (shortcut.toLowerCase().startsWith('_')) {
    return { valid: false, error: 'Shortcuts cannot start with underscore' };
  }

  return { valid: true };
}
