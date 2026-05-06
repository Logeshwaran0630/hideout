# Google Calendar Integration - Implementation Guide

This document explains how to set up Google Calendar as the single source of truth for The Hideout booking system.

## Overview

- **Google Calendar** = Primary source of truth for slot availability
- Website bookings create events in Google Calendar
- All slot availability checks query Google Calendar (not Supabase)
- Booking cancellations remove events from calendar
- Future WhatsApp agent will read/write to the same calendar

## Prerequisites

1. Google Cloud Account
2. Service account credentials (JSON key)
3. Google Calendar created and shared with service account

## Setup Instructions

### Step 1: Google Cloud Console Setup

1. Go to https://console.cloud.google.com/
2. Create a new project → "The Hideout Booking System"
3. Enable the following APIs:
   - Google Calendar API
4. Create a Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `hideout-booking`
   - Give it Owner role
   - Create a JSON key → Download and save securely
5. Create a Google Calendar:
   - Go to Google Calendar → Settings → Create new calendar
   - Name it "The Hideout Bookings"
   - Share it with the service account email
   - Give "Make changes to events" permission
6. Get your Calendar ID:
   - Go to calendar settings → Copy the Calendar ID (format: `xxx@group.calendar.google.com`)

### Step 2: Environment Variables

Add these to your existing `.env.local`:

```env
# From the service account JSON key file
GOOGLE_SERVICE_ACCOUNT_EMAIL=hideout-booking@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

**Important**: When copying `GOOGLE_PRIVATE_KEY`, preserve the `\n` characters exactly as they appear in the JSON file. Only add the Google Calendar variables - keep existing Supabase variables unchanged.

### Step 3: Database Migration

Run this SQL in Supabase to add the calendar_event_id column:

```sql
-- Add calendar_event_id column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_calendar_event_id ON bookings(calendar_event_id);
```

### Step 4: How It Works

#### Availability Check Flow
1. User selects a date on the booking wizard
2. System queries Google Calendar for events on that date
3. Any slots with existing events are marked as "booked"
4. Available slots are shown to the user

#### Booking Creation Flow
1. User confirms booking
2. System creates event in Google Calendar
3. Calendar event includes: booking code, H-ID, session type, player count
4. Once calendar event is created, booking is saved to Supabase
5. If calendar event creation fails, booking is not created
6. Event appears in Google Calendar within 5 seconds

#### Cancellation Flow
1. Admin cancels booking in dashboard
2. System deletes the corresponding event from Google Calendar
3. Then deletes booking from Supabase
4. Event disappears from Google Calendar within 5 seconds

## API Reference

### Calendar Service Functions

Located in `src/lib/googleCalendar.ts`:

```typescript
// Check if a single slot is available
async function checkSlotAvailability(
  startDateTime: Date,
  endDateTime: Date
): Promise<boolean>

// Check multiple slots at once
async function checkMultipleSlotsAvailability(
  slots: { start: Date; end: Date; slotId: string }[]
): Promise<Map<string, boolean>>

// Create a calendar event
async function createCalendarEvent(
  eventData: CalendarEventData
): Promise<string | null>

// Cancel/delete a calendar event
async function cancelCalendarEvent(eventId: string): Promise<boolean>

// Get all bookings for a date
async function getBookingsForDate(date: Date): Promise<any[]>

// Update an existing calendar event
async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventData>
): Promise<boolean>
```

## Changes Made

### New Files
- `src/lib/googleCalendar.ts` - Google Calendar service

### Modified Files
- `src/components/BookingWizard.tsx` - Uses Google Calendar for availability
- `src/app/api/bookings/route.ts` - Stores calendar_event_id in database
- `.env.example` - Added Google Calendar configuration template

### Database
- Added `calendar_event_id` column to `bookings` table
- Added index on `calendar_event_id` for faster lookups

## Troubleshooting

### "Invalid Credentials" Error
- Check that GOOGLE_SERVICE_ACCOUNT_EMAIL is correct
- Verify GOOGLE_PRIVATE_KEY has proper formatting (newlines as `\n`)
- Ensure private key has `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### Events Not Appearing in Calendar
- Verify calendar is shared with service account email
- Check that service account has "Make changes to events" permission
- Verify GOOGLE_CALENDAR_ID format: `xxx@group.calendar.google.com`

### 403 Forbidden Error
- Service account needs "Make changes to events" permission
- Go to calendar settings → Add people → Add service account email

### API Quota Exceeded
- Check Google Cloud Console → APIs & Services → Google Calendar API
- Monitor quota usage
- If needed, request quota increase

## Testing

1. Run the app: `npm run dev`
2. Book a slot through the website
3. Check Google Calendar → Event should appear immediately
4. Event title format: `Hideout Booking - [Name] ([H-ID])`
5. Event description includes: Session type, players, price, H-ID, email
6. Cancel booking in admin panel
7. Verify event is removed from Google Calendar

## Next Steps

Once calendar integration is working:
1. Sync existing bookings to Google Calendar (optional sync script provided)
2. Set up WhatsApp agent to read from calendar
3. Add calendar event reminders (email + popup)
4. Implement calendar event rescheduling

## Support

For issues:
- Check Google Cloud quotas
- Verify all env variables are correct
- Check service account permissions
- Review browser console for errors
- Check server logs in terminal
