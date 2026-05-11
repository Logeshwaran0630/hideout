# Email System Integration Guide - The Hideout

This document shows how to integrate the Resend email system with your existing API endpoints and authentication flows.

## Quick Start (Manual Testing)

1. Get your test email sent:
   ```
   Visit: https://hideout.vercel.app/api/test-email
   ```
   (Change the email in `src/app/api/test-email/route.ts` to your own)

2. Check your email for the test message

## Integration Points

### 1. Send Welcome Email on Signup

**File:** `src/lib/supabase/server.ts` or your auth signup handler

After creating a new user profile in Supabase, add:

```typescript
import { sendWelcomeEmail } from '@/lib/emailService';

// After user is successfully created
if (user && profile) {
  await sendWelcomeEmail({
    id: user.id,
    email: user.email!,
    display_name: profile.display_name,
    h_id: profile.h_id,
  });
}
```

### 2. Send Booking Confirmation on Booking Creation

**File:** `src/app/api/bookings/route.ts` (POST endpoint)

After booking is created successfully:

```typescript
import { sendBookingConfirmationEmail, sendAdminAlertEmail } from '@/lib/emailService';

// After successful booking creation
if (booking) {
  // Send confirmation to customer
  await sendBookingConfirmationEmail(booking);
  
  // Send alert to admin
  await sendAdminAlertEmail(booking);
}
```

### 3. Send Email for Manual Bookings

**File:** `src/app/api/admin/manual-booking/route.ts`

After booking is created via manual entry:

```typescript
import { sendBookingConfirmationEmail, sendAdminAlertEmail } from '@/lib/emailService';

// After booking creation
if (booking) {
  await sendBookingConfirmationEmail(booking);
  await sendAdminAlertEmail(booking);
}
```

### 4. Send Cancellation Email

**File:** Any booking cancellation endpoint (e.g., `src/app/api/bookings/[id]/cancel/route.ts`)

When booking is cancelled:

```typescript
import { sendBookingCancellationEmail } from '@/lib/emailService';

// After successful cancellation
if (cancelledBooking) {
  await sendBookingCancellationEmail(cancelledBooking);
}
```

### 5. Reminder Emails (Auto via Cron)

**File:** `src/app/api/cron/send-reminders/route.ts` (Already created)

The cron job runs daily at 9 AM IST and automatically sends reminders for bookings happening tomorrow.

Setup in Vercel:
- Dashboard → Project Settings → Environment Variables
- Add: `CRON_SECRET=your-secret-key-here`
- The `vercel.json` file already has the cron schedule configured

## Database Query for Booking

When sending emails, the booking object should include related data. Here's the correct query structure:

```typescript
const { data: booking } = await supabase
  .from('bookings')
  .select(`
    *,
    users (*),
    time_slots (*),
    session_types (*)
  `)
  .eq('id', bookingId)
  .single();
```

This ensures all nested data needed by email templates is available.

## Email Templates Available

1. **WelcomeEmail** - Sent on signup
   - Props: `name`, `hId`, `email`
   - File: `src/emails/WelcomeEmail.tsx`

2. **BookingConfirmationEmail** - Sent on booking
   - Props: `name`, `hId`, `bookingCode`, `bookingDate`, `timeSlot`, `sessionType`, `players`, `price`, `coinsEarned`
   - File: `src/emails/BookingConfirmationEmail.tsx`

3. **BookingReminderEmail** - Sent 24 hours before booking
   - Props: `name`, `bookingCode`, `bookingDate`, `timeSlot`, `sessionType`
   - File: `src/emails/BookingReminderEmail.tsx`

4. **BookingCancellationEmail** - Sent on cancellation
   - Props: `name`, `bookingCode`, `bookingDate`, `timeSlot`
   - File: `src/emails/BookingCancellationEmail.tsx`

## Environment Variables

**In `.env.local` (Development):**
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=bookings@thehideout.in
RESEND_ADMIN_EMAIL=anna@thehideout.in
CRON_SECRET=your-secret-key-here
```

**In Vercel (Production):**
Add the same variables via Vercel Dashboard → Settings → Environment Variables

## Free Tier Limits

- **Monthly Emails:** 3,000
- **Cost:** ₹0
- **Sending Rate:** No limit

## Testing Checklist

- [ ] Install dependencies: `npm install`
- [ ] Add environment variables to `.env.local`
- [ ] Add RESEND_API_KEY from Resend dashboard
- [ ] Update RESEND_FROM_EMAIL to your domain
- [ ] Visit `/api/test-email` to test
- [ ] Check email inbox for test message
- [ ] Integrate with signup flow (sendWelcomeEmail)
- [ ] Integrate with booking creation (sendBookingConfirmationEmail)
- [ ] Test manual booking (sendBookingConfirmationEmail)
- [ ] Test booking cancellation (sendBookingCancellationEmail)
- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel
- [ ] Verify cron job runs (check logs in Vercel)

## Troubleshooting

**"Invalid API key"**
- Check RESEND_API_KEY format (should start with `re_`)
- Ensure key is from https://resend.com/api-keys

**"Invalid from email"**
- For testing: Use `onboarding@resend.dev` (provided by Resend)
- For production: Use a verified domain email

**Emails not sending**
- Check Resend dashboard for error logs
- Ensure booking has valid user data
- Verify email addresses are not empty

**Cron job not running**
- Check Vercel dashboard → Cron Jobs
- Ensure CRON_SECRET is set in production
- Verify `/api/cron/send-reminders` endpoint is accessible

## Cost Summary

| Item | Cost |
|------|------|
| Resend Free Tier | ₹0 (3,000 emails/month) |
| Email System Maintenance | ₹0 |
| **Total** | **₹0** |

After implementing all integrations, you'll have a fully automated email system! 🔥
