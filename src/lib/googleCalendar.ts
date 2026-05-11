'use server';

import { google } from 'googleapis';

// Service account credentials from environment variables
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Get private key from env (handle newlines correctly)
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

console.log('[Google Calendar] Initializing with:');
console.log('[Google Calendar] Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('[Google Calendar] Has Private Key:', !!privateKey);
console.log('[Google Calendar] Calendar ID:', process.env.GOOGLE_CALENDAR_ID);

if (!privateKey) {
  console.error('[Google Calendar] ERROR: GOOGLE_PRIVATE_KEY is missing or empty!');
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
  console.error('[Google Calendar] ERROR: GOOGLE_SERVICE_ACCOUNT_EMAIL is missing!');
}

if (!process.env.GOOGLE_CALENDAR_ID) {
  console.error('[Google Calendar] ERROR: GOOGLE_CALENDAR_ID is missing!');
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

export interface CalendarEventData {
  summary: string;        // "Hideout Booking - John (HID-000123)"
  description: string;    // Full booking details
  startTime: string;      // ISO string
  endTime: string;        // ISO string
  attendees?: string[];   // Optional user email
}

/**
 * Check if a time slot is available on a specific date
 */
export async function checkSlotAvailability(
  startDateTime: Date,
  endDateTime: Date
): Promise<boolean> {
  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: startDateTime.toISOString(),
      timeMax: endDateTime.toISOString(),
      singleEvents: true,
    });

    // If no events found, slot is available
    return (response.data.items?.length || 0) === 0;
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    return false;
  }
}

/**
 * Check multiple time slots at once
 */
export async function checkMultipleSlotsAvailability(
  slots: { start: Date; end: Date; slotId: string }[]
): Promise<Map<string, boolean>> {
  const availabilityMap = new Map<string, boolean>();
  
  for (const slot of slots) {
    const isAvailable = await checkSlotAvailability(slot.start, slot.end);
    availabilityMap.set(slot.slotId, isAvailable);
  }
  
  return availabilityMap;
}

/**
 * Create a calendar event for a booking
 */
export async function createCalendarEvent(eventData: CalendarEventData): Promise<string | null> {
  try {
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

/**
 * Cancel/delete a calendar event by ID
 */
export async function cancelCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

/**
 * Get all bookings for a specific date
 */
export async function getBookingsForDate(date: Date): Promise<any[]> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

/**
 * Update an existing calendar event (e.g., reschedule)
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventData>
): Promise<boolean> {
  try {
    const existingEvent = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: eventId,
    });
    
    const updatedEvent = {
      ...existingEvent.data,
      ...(updates.summary && { summary: updates.summary }),
      ...(updates.description && { description: updates.description }),
      ...(updates.startTime && {
        start: { dateTime: updates.startTime, timeZone: 'Asia/Kolkata' },
      }),
      ...(updates.endTime && {
        end: { dateTime: updates.endTime, timeZone: 'Asia/Kolkata' },
      }),
    };
    
    await calendar.events.update({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: eventId,
      requestBody: updatedEvent,
    });
    
    return true;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

/**
 * Verify calendar connection (for testing)
 */
export async function verifyCalendarConnection(): Promise<boolean> {
  try {
    const response = await calendar.calendars.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Calendar connection failed:', error);
    return false;
  }
}
