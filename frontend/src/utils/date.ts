/**
 * Date and Time formatting utilities for Groupin Account Checker.
 * Handles UTC parsing for timestamps returned by the API so they display
 * accurately in the user's local timezone (e.g. IST).
 */

export const parseUtcDate = (val: string | Date | null | undefined): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  let str = String(val).trim();
  if (!str) return null;

  // If the ISO string lacks timezone offset ('Z', '+', or '-XX:XX' at the end),
  // treat it as UTC so browsers don't incorrectly interpret it as naive local time.
  if (!str.endsWith('Z') && !str.includes('+') && !/T.*\d{2}-\d{2}$/.test(str)) {
    str = `${str}Z`;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Format a timestamp to 12-hour local time (e.g., "12:50:10 PM")
 */
export const formatTime = (val: string | Date | null | undefined): string => {
  const d = parseUtcDate(val);
  if (!d) return '—';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

/**
 * Format a timestamp to local date and time (e.g., "07/10/2026, 12:50:10 PM")
 */
export const formatDateTime = (val: string | Date | null | undefined): string => {
  const d = parseUtcDate(val);
  if (!d) return '—';
  return d.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};
