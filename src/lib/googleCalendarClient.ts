/**
 * Client-side calendar utilities.
 * These functions call /api/calendar so client components never import server-only Google APIs.
 */

interface SlotToCheck {
  slotId: string;
  start: Date;
  end: Date;
}

export interface CalendarEventData {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
}

export async function checkSlotAvailability(startDateTime: Date, endDateTime: Date): Promise<boolean> {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "checkSlotAvailability",
        data: {
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check availability");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to check availability");
    }

    return Boolean(data.available);
  } catch (error) {
    console.error("Error checking slot availability:", error);
    return false;
  }
}

export async function checkMultipleSlotsAvailability(slots: SlotToCheck[]): Promise<Map<string, boolean>> {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "checkMultipleSlotsAvailability",
        data: {
          slots: slots.map((slot) => ({
            slotId: slot.slotId,
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          })),
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check availability");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to check availability");
    }

    const availabilityMap = new Map<string, boolean>();
    for (const [slotId, isAvailable] of Object.entries(data.availability || {})) {
      availabilityMap.set(slotId, isAvailable as boolean);
    }

    return availabilityMap;
  } catch (error) {
    console.error("Error checking multiple slots availability:", error);
    throw error;
  }
}

export async function createCalendarEvent(eventData: CalendarEventData): Promise<string | null> {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "createCalendarEvent",
        data: { eventData },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create calendar event");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to create calendar event");
    }

    return data.eventId || null;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

export async function cancelCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "cancelCalendarEvent",
        data: { eventId },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to cancel calendar event");
    }

    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error("Error cancelling calendar event:", error);
    return false;
  }
}
