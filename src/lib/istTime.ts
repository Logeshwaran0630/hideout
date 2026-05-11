/**
 * Utility functions for handling Indian Standard Time (IST/Asia/Kolkata)
 * 
 * IST is UTC+5:30
 * When creating times for Google Calendar API, we need to be precise about timezones
 */

/**
 * Convert IST local time to UTC ISO string for Google Calendar API
 * 
 * @param dateStr - Date in YYYY-MM-DD format (IST local date)
 * @param timeStr - Time in HH:mm or HH:mm:ss format (IST local time)
 * @returns ISO 8601 UTC string for Google Calendar API
 * 
 * Example: toISTISO("2026-05-14", "16:00") -> "2026-05-14T10:30:00.000Z" (4 PM IST = 10:30 AM UTC)
 */
export function toISTISO(dateStr: string, timeStr: string): string {
  const [hours, minutes, seconds = '0'] = timeStr.split(':');
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // IST is UTC+5:30, so to convert IST to UTC, subtract 5:30
  // Create date at UTC as if it's in IST, then subtract offset
  const istHours = parseInt(hours);
  const istMinutes = parseInt(minutes);
  const istSeconds = parseInt(seconds);
  
  // Subtract 5 hours 30 minutes from IST time to get UTC
  const utcDate = new Date(Date.UTC(
    year,
    month - 1,
    day,
    istHours - 5,
    istMinutes - 30,
    istSeconds
  ));
  
  return utcDate.toISOString();
}

/**
 * Create Date objects for start and end times in IST
 * Returns UTC ISO strings suitable for Google Calendar API
 * 
 * @param dateStr - Date in YYYY-MM-DD format
 * @param startTimeStr - Start time in HH:mm format (IST local)
 * @param endTimeStr - End time in HH:mm format (IST local)
 * @returns Object with start and end ISO strings
 */
export function createISTDateRange(dateStr: string, startTimeStr: string, endTimeStr: string) {
  const startISO = toISTISO(dateStr, startTimeStr);
  const endISO = toISTISO(dateStr, endTimeStr);
  
  return {
    start: startISO,
    end: endISO,
    startDate: new Date(startISO),
    endDate: new Date(endISO),
  };
}

/**
 * Verify timezone calculation (for debugging)
 */
export function debugTimeConversion(dateStr: string, timeStr: string) {
  const iso = toISTISO(dateStr, timeStr);
  const date = new Date(iso);
  
  return {
    input: `${dateStr} ${timeStr} (IST)`,
    iso: iso,
    istLocal: date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    utcString: date.toUTCString(),
  };
}

/**
 * Get current date in IST timezone
 */
export function getISTDate(): Date {
  return new Date();
}

/**
 * Format a date for display in IST
 */
export function formatDateIST(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('en-IN', {
    ...options,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format time for display in IST
 */
export function formatTimeIST(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleTimeString('en-IN', {
    ...options,
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format full date and time for display in IST
 */
export function formatDateTimeIST(date: Date): string {
  const dateStr = formatDateIST(date);
  const timeStr = formatTimeIST(date);
  return `${dateStr}, ${timeStr}`;
}
