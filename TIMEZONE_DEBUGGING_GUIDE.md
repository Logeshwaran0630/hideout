# Google Calendar Timezone Debugging Guide

## 🎯 What Changed
Fixed timezone handling for proper IST (Indian Standard Time) conversion:
- **Old way**: Converting local dates to ISO without accounting for timezone offset
- **New way**: Properly converting IST times to UTC for Google Calendar API

### Key Functions Updated

#### `src/lib/istTime.ts` - Timezone Conversion
```typescript
// Example: 2026-05-14 16:00 (4 PM IST) → 2026-05-14T10:30:00.000Z (UTC)
toISTISO("2026-05-14", "16:00");
// Returns: "2026-05-14T10:30:00.000Z"
```

#### `src/app/api/calendar/route.ts` - Debug Logging
Added detailed debug logs to show exactly what times are being checked.

#### `src/components/BookingWizard.tsx` - Using Proper Conversion
Now uses `createISTDateRange()` which ensures correct timezone conversion.

---

## 🧪 How to Test

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Open Browser Console
Go to your booking page and press **F12** to open Developer Tools → Console tab

### Step 3: Run Debug Script
Copy and paste the entire content of `debug-calendar-test.js` into the console:

```javascript
// This will test:
// 1. Calendar connection
// 2. May 14, 4 PM IST availability
```

### Step 4: Check Server Console Output
Look at your terminal running `npm run dev`. You should see:

```
[DEBUG] Checking availability:
  Start (raw): 2026-05-14T10:30:00.000Z
  End (raw): 2026-05-14T11:30:00.000Z
  Start as Date: 5/14/2026, 4:00:00 PM
  End as Date: 5/14/2026, 5:00:00 PM
  Start UTC: 2026-05-14T10:30:00.000Z
  End UTC: 2026-05-14T11:30:00.000Z
  Events found: 0
  Available: ✅ Available
```

---

## 📊 Expected Results

### If Calendar is Empty (No Events)
**Console Output**:
```
✅ Available
Events found: 0
```

### If Calendar Has Events at That Time
**Console Output**:
```
❌ Booked
Events found: 1
  - Hideout Booking - John (H-ID-001) at 2026-05-14T10:30:00.000Z
```

---

## 🔍 Timezone Conversion Reference

### IST to UTC Conversion (UTC+5:30)
To convert IST to UTC: **Subtract 5 hours 30 minutes**

| IST Time | UTC Time | Difference |
|----------|----------|-----------|
| 4:00 PM (16:00) | 10:30 AM | -5:30 |
| 2:00 PM (14:00) | 8:30 AM | -5:30 |
| 6:00 PM (18:00) | 12:30 PM | -5:30 |
| 9:00 AM (09:00) | 3:30 AM | -5:30 |

### Example Conversion
```
IST Time: 2026-05-14 at 4:00 PM
         ↓
       Subtract 5:30
         ↓
UTC Time: 2026-05-14 at 10:30 AM
         ↓
ISO Format: 2026-05-14T10:30:00.000Z
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Available" But Shows "Booked"
**Cause**: Timezone mismatch between what was sent and what's in Google Calendar
**Fix**:
1. Check server console for `[DEBUG]` output
2. Verify the UTC time matches what's in Google Calendar
3. Clear Google Calendar and try again

### Issue 2: Events Not Showing in Calendar
**Cause**: Calendar event creation failed silently
**Fix**:
1. Check browser console for errors
2. Look for error in server console
3. Verify `GOOGLE_CALENDAR_ID` environment variable
4. Test calendar connection: `testCalendarDebug.testConnection()`

### Issue 3: Wrong Date/Time in Google Calendar
**Cause**: IST conversion not happening
**Fix**:
1. Check `istTime.ts` is properly imported in BookingWizard
2. Run `testCalendarDebug.testTime("2026-05-14", "16:00", "17:00")` in console
3. Compare UTC time shown vs what's in Google Calendar

---

## 📝 Manual Testing Steps

### Test 1: Check if Calendar is Connected
```javascript
testCalendarDebug.testConnection()
// Should see: ✅ Calendar Connected
```

### Test 2: Book a Slot on May 14 @ 4 PM
1. Go to booking page
2. Select May 14 as date
3. Look at console - should see `[Booking] Slot` logs
4. Select 4 PM slot
5. Click Book
6. Check Google Calendar - event should appear at 4 PM IST

### Test 3: Cancel and Verify Deletion
1. Go to admin/bookings
2. Find the booking you just made
3. Click Cancel
4. Check Google Calendar - event should be gone

---

## 💡 Debug Commands

Run these in browser console:

```javascript
// Test calendar connection
testCalendarDebug.testConnection()

// Test specific time (IST format)
testCalendarDebug.testTime("2026-05-14", "16:00", "17:00")

// Test May 14 @ 4 PM
testCalendarDebug.testMay14()

// Check what times are being sent for a slot
// (This will be logged automatically when you load slots)
```

---

## 📋 Expected Logs

### On Booking Page Load
```
[Booking] Slot 4:00 PM - 5:00 PM (4-5 hours):
  local: 2026-05-14 16:00 - 17:00 (IST)
  utc: 2026-05-14T10:30:00.000Z - 2026-05-14T11:30:00.000Z
  debug: {
    input: "2026-05-14 16:00 (IST)",
    iso: "2026-05-14T10:30:00.000Z",
    istLocal: "5/14/2026, 4:00:00 PM",
    utcString: "Thu, 14 May 2026 10:30:00 GMT"
  }
```

### On Booking Confirmation
```
[Booking Confirmation]
  date: 2026-05-14
  slot: 16:00 - 17:00
  startIST: 2026-05-14T10:30:00.000Z
  endIST: 2026-05-14T11:30:00.000Z
```

### On Server (Terminal)
```
[DEBUG] Checking availability:
  Start (raw): 2026-05-14T10:30:00.000Z
  End (raw): 2026-05-14T11:30:00.000Z
  Start as Date: 5/14/2026, 4:00:00 PM
  End as Date: 5/14/2026, 5:00:00 PM
  Events found: 0
  Available: true
```

---

## ✅ Success Indicators

- ✅ Calendar connection test passes
- ✅ Debug logs show correct UTC conversion (4 PM IST = 10:30 AM UTC)
- ✅ Google Calendar event created with correct IST time
- ✅ Admin dashboard shows same time as Google Calendar
- ✅ Cancellation removes event from Google Calendar
- ✅ No timezone-related errors in console

---

## 🚀 Next Steps

1. Run `npm run dev`
2. Open booking page
3. Paste debug script in console
4. Share the console output and server logs if issues persist
