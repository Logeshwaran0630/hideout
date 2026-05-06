const IST_OFFSET = "+05:30";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function normalizeTime(timeStr: string) {
  const [hours = "00", minutes = "00", seconds = "00"] = timeStr.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

/**
 * Convert an IST date and time into an RFC3339 string with the +05:30 offset.
 */
export function toISTISO(dateStr: string, timeStr: string): string {
  return `${dateStr}T${normalizeTime(timeStr)}${IST_OFFSET}`;
}

/**
 * Create a Date object for a date/time selected in Indian Standard Time.
 */
export function createISTDate(dateStr: string, timeStr: string): Date {
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(":").map(Number);
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, seconds) - IST_OFFSET_MS;

  return new Date(utcTimestamp);
}

/**
 * Format a Date for display in Indian Standard Time.
 */
export function formatIST(date: Date): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
