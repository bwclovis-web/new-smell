/**
 * Utility functions for creating URL-friendly slugs
 */

export const createUrlSlug = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    // First decode any URL-encoded characters
    .replace(/%20/g, ' ')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Replace underscores with hyphens
    .replace(/_/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Convert to lowercase
    .toLowerCase()
}
