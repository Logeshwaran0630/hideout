import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TIME_ZONE = "Asia/Kolkata";

type SlotPayload = {
  slotId: string;
  start: string;
  end: string;
};

type CalendarActionBody = {
  action?: string;
  data?: Record<string, unknown>;
  slots?: SlotPayload[];
  startDateTime?: string;
  endDateTime?: string;
  eventId?: string;
  summary?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
};

function getCalendarClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  console.log("[Calendar API] Init check:", {
    hasEmail: !!serviceAccountEmail,
    hasKey: !!privateKey,
    hasCalendarId: !!calendarId,
  });

  if (!serviceAccountEmail || !privateKey || !calendarId) {
    throw new Error("Google Calendar environment variables are not configured");
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return {
    calendarId,
    calendar: google.calendar({ version: "v3", auth }),
  };
}

function getActionData(body: CalendarActionBody) {
  return (body.data ?? body) as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CalendarActionBody;
    const { action } = body;
    const data = getActionData(body);

    console.log("[Calendar API] Action:", action);

    const { calendar, calendarId } = getCalendarClient();

    if (action === "checkSlotAvailability") {
      const startDateTime = data.startDateTime as string | undefined;
      const endDateTime = data.endDateTime as string | undefined;

      if (!startDateTime || !endDateTime) {
        return NextResponse.json({ error: "Missing date parameters" }, { status: 400 });
      }

      // DEBUG LOGGING
      console.log("[DEBUG] Checking availability:");
      console.log("  Start (raw):", startDateTime);
      console.log("  End (raw):", endDateTime);
      console.log("  Start as Date:", new Date(startDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      console.log("  End as Date:", new Date(endDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      console.log("  Start UTC:", new Date(startDateTime).toISOString());
      console.log("  End UTC:", new Date(endDateTime).toISOString());

      const response = await calendar.events.list({
        calendarId,
        timeMin: startDateTime,
        timeMax: endDateTime,
        singleEvents: true,
      });

      console.log("  Events found:", response.data.items?.length || 0);
      if (response.data.items && response.data.items.length > 0) {
        response.data.items.forEach((event, idx) => {
          console.log(`    Event ${idx + 1}:`, event.summary, "Start:", event.start?.dateTime, "End:", event.end?.dateTime);
        });
      }
      console.log("  Available:", (response.data.items?.length || 0) === 0);

      const available = (response.data.items?.length || 0) === 0;
      return NextResponse.json({ success: true, available });
    }

    if (action === "checkMultipleSlotsAvailability") {
      const slots = data.slots as SlotPayload[] | undefined;

      if (!Array.isArray(slots)) {
        return NextResponse.json({ error: "Invalid slots format" }, { status: 400 });
      }

      const availability: Record<string, boolean> = {};

      console.log("[DEBUG] Checking multiple slots availability");
      console.log("  Total slots:", slots.length);

      for (const slot of slots) {
        try {
          console.log(`  Checking slot ${slot.slotId}:`);
          console.log(`    Start: ${slot.start} (UTC: ${new Date(slot.start).toISOString()})`);
          console.log(`    End: ${slot.end} (UTC: ${new Date(slot.end).toISOString()})`);

          const response = await calendar.events.list({
            calendarId,
            timeMin: slot.start,
            timeMax: slot.end,
            singleEvents: true,
          });

          const isAvailable = (response.data.items?.length || 0) === 0;
          availability[slot.slotId] = isAvailable;

          console.log(`    Result: ${isAvailable ? "✅ Available" : "❌ Booked"} (${response.data.items?.length || 0} events)`);
          if (response.data.items && response.data.items.length > 0) {
            response.data.items.forEach((event) => {
              console.log(`      - ${event.summary} at ${event.start?.dateTime}`);
            });
          }
        } catch (error) {
          console.error(`[Calendar API] Error checking slot ${slot.slotId}:`, error);
          availability[slot.slotId] = true;
        }
      }

      return NextResponse.json({ success: true, availability });
    }

    if (action === "createCalendarEvent") {
      const eventData = (data.eventData ?? data) as Record<string, string | undefined>;
      const { summary, description, startTime, endTime } = eventData;

      if (!summary || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing event details" }, { status: 400 });
      }

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      console.log("[Calendar API] Creating event with IST times:", {
        startTimeRaw: startTime,
        endTimeRaw: endTime,
        startDateUTC: startDate.toISOString(),
        endDateUTC: endDate.toISOString(),
        startLocal: startDate.toLocaleString("en-IN", { timeZone: TIME_ZONE }),
        endLocal: endDate.toLocaleString("en-IN", { timeZone: TIME_ZONE }),
      });

      const event = {
        summary,
        description,
        start: {
          dateTime: startTime,
          timeZone: TIME_ZONE,
        },
        end: {
          dateTime: endTime,
          timeZone: TIME_ZONE,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      };

      console.log("[Calendar API] Event object:", JSON.stringify(event, null, 2));

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      console.log("[Calendar API] Event created:", response.data.id);

      return NextResponse.json({
        success: true,
        eventId: response.data.id,
      });
    }

    if (action === "cancelCalendarEvent") {
      const eventId = data.eventId as string | undefined;

      if (!eventId) {
        return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
      }

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      console.log("[Calendar API] Event deleted:", eventId);

      return NextResponse.json({ success: true });
    }

    if (action === "verifyCalendarConnection") {
      try {
        const response = await calendar.calendars.get({
          calendarId,
        });

        const isConnected = response.status === 200;

        console.log("[Calendar API] Connection verified:", isConnected);

        return NextResponse.json({
          success: isConnected,
          message: isConnected ? "Google Calendar is connected and ready" : "Connection failed",
        });
      } catch (error) {
        console.error("[Calendar API] Connection verification failed:", error);

        return NextResponse.json(
          {
            success: false,
            message: "Connection failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("[Calendar API] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
