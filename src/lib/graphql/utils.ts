/**
 * GraphQL Utility Functions
 * Helper functions for working with GraphQL data
 */

/**
 * Normalize ID to number (handles string/number input)
 */
export function normalizeId(id: number | string): number {
  return typeof id === 'string' ? parseInt(id, 10) : id;
}

/**
 * Format Date to timestamp string (YYYY-MM-DD HH:MM:SS)
 * Used for GraphQL timestamp fields without timezone
 */
export function formatTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format optional Date to timestamp string or null
 */
export function formatOptionalTimestamp(date: Date | undefined | null): string | null {
  if (!date) return null;
  return formatTimestamp(new Date(date));
}

/**
 * Parse GraphQL timestamp to Date object
 */
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

/**
 * Parse optional GraphQL timestamp to Date object or undefined
 */
export function parseOptionalTimestamp(timestamp: string | null | undefined): Date | undefined {
  if (!timestamp) return undefined;
  return new Date(timestamp);
}

