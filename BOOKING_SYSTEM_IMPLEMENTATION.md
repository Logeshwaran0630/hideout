# Booking System Revamp - Complete Implementation Guide

## 🎮 New Booking Flow (4-Step Process)

### Old Flow ❌
1. Date + Session Type (Solo/Duo/Squad only)
2. Time Slot selection
3. Confirm

### New Flow ✅
1. **Step 1**: Choose SETUP (PS5 / PS4 / Arcade / Racing Sim)
2. **Step 2**: Choose SESSION TYPE (Solo/Duo/Squad - filtered by setup's max players)
3. **Step 3**: Select DATE & TIME SLOT
4. **Step 4**: Review & Confirm Booking

---

## 📊 Pricing Matrix

| Setup | Solo (1P) | Duo (2P) | Squad (4P) |
|-------|-----------|----------|------------|
| PlayStation 5 | ₹150 | ₹250 | ₹350 |
| PlayStation 4 | ₹100 | ₹180 | ₹250 |
| Vintage Arcade | ₹50 | ₹80 | ₹120 |
| Sim Racing Rig | ₹50 (5 laps) | ₹80 (30 min) | ₹150 (1 hour) |

**Special Cases:**
- Racing Sim has different duration labels based on session type
- All other setups follow the formula: `base_price × price_multiplier`

---

## 🔧 Implementation Steps

### Step 1: Run Database Migration ⚡ **CRITICAL**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open file: `hideout/database/setup_system_migration.sql`
3. Copy the entire content
4. Paste into Supabase SQL Editor
5. Click **Run** button

**What this does:**
- Creates `setups` table with PS5, PS4, Arcade, Racing Sim
- Adds `price_multiplier` column to `session_types`
- Adds `setup_id` column to `bookings`
- Migrates existing bookings to PS5 as default
- Enables Row Level Security (RLS)

**Expected Output:**
```
setup_count: 4
bookings_with_setup: [current booking count]
```

### Step 2: Verify Components Are Updated ✅

All components have been automatically updated:

- ✅ **SetupCard.tsx** - Already exists and compatible
- ✅ **BookingWizard.tsx** - Completely rewritten with 4-step flow
- ✅ **slots/page.tsx** - Already fetches setups correctly
- ✅ **admin/BookingsClient.tsx** - Already displays setup column

### Step 3: Test Locally

```bash
cd hideout
npm run dev
# Server runs on http://localhost:3000
```

**Test Flow:**
1. Navigate to `/slots`
2. You should see 4 setup cards (PS5, PS4, Arcade, Racing)
3. Select a setup
4. Choose a session type (filtered by setup's max players)
5. Pick a date and time
6. Review and confirm

### Step 4: Deploy to Vercel

```bash
git add -A
git commit -m "feat: implement setup-first booking system"
git push
```

Vercel will auto-deploy. Check `/slots` on production to verify.

---

## 🔄 Pricing Logic

### How Prices Are Calculated

The `calculateBookingPrice()` function in `src/lib/pricing.ts` handles:

```typescript
// Special cases (Racing & Arcade have fixed prices)
if (setup.name === 'racing') {
  Solo → ₹50
  Duo → ₹80
  Squad → ₹150
}

if (setup.name === 'arcade') {
  Solo → ₹50
  Duo → ₹80
  Squad → ₹120
}

// Standard formula (PS5 & PS4)
price = setup.base_price × session_type.price_multiplier
```

### Price Multipliers (Database)

| Session Type | Multiplier | H Coins |
|--------------|-----------|---------|
| Solo | 1.0x | 10 |
| Duo | 1.5x | 25 |
| Squad | 2.0x | 50 |

---

## 📱 Component Structure

### New BookingWizard State Management

```typescript
// Step 1: Setup
const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null)

// Step 2: Session Type  
const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null)

// Step 3: Date & Time
const [selectedDate, setSelectedDate] = useState<string>("")
const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
```

### Data Flow

```
Slots Page (Server)
  ↓
Fetches: setups, sessionTypes, user, profile
  ↓
BookingWizard Component (Client)
  ↓
Step 1: Select Setup
  ↓
Step 2: Select Session Type (filtered)
  ↓
Step 3: Select Date & Slot
  ↓
Step 4: Review & Confirm
  ↓
API: POST /api/bookings
  ↓
Database: Insert booking with setup_id
  ↓
Calendar: Create Google Calendar event
  ↓
Confirmation Screen
```

---

## 🐛 Troubleshooting

### Issue: "No setups showing on booking page"
**Solution:** 
- Check that SQL migration was run successfully
- Verify `setups` table exists: `SELECT * FROM setups;` in SQL Editor
- Check that `is_active = true` for setups

### Issue: "Booking fails with 'setup_id is required'"
**Solution:**
- Run the database migration again
- Check that `bookings.setup_id` column exists
- Restart dev server: `npm run dev`

### Issue: "Session types showing when they shouldn't"
**Solution:**
- The filtering logic checks: `st.max_players <= selectedSetup.max_players`
- Racing Sim has `max_players = 2`, so Squad (4P) won't show
- Verify `session_types.max_players` are correct in database

### Issue: "Price not calculating correctly"
**Solution:**
- Check `src/lib/pricing.ts` for the setup name and logic
- Verify `session_types.price_multiplier` is set (1.0, 1.5, 2.0)
- Test with: `calculateBookingPrice(setup, sessionType)`

---

## 📊 Admin Panel Changes

The admin bookings page automatically shows:

- **Setup Column**: Displays setup name for each booking
- **Booking Details Modal**: Includes "Setup" field
- **Filters**: Already working with new structure

No code changes needed - it works automatically!

---

## 🎯 Testing Checklist

- [ ] Database migration runs without errors
- [ ] 4 setups appear on booking page
- [ ] Can select each setup
- [ ] Session types filter by setup's max_players
- [ ] Can select date and time slots
- [ ] Booking price matches pricing matrix
- [ ] Confirmation shows correct setup name
- [ ] Admin panel displays setup in table
- [ ] Admin modal shows setup in details
- [ ] Google Calendar event created successfully
- [ ] H Coins awarded correctly

---

## 🚀 Next Steps (Optional Enhancements)

1. **Add Setup Images**: Uncomment `icon` field in setup card
2. **Racing-Specific UI**: Add "5 laps", "30 min", "1 hour" labels (already implemented)
3. **Setup Availability**: Add per-setup capacity management
4. **Analytics**: Track which setups are most booked
5. **Package Deals**: Create multi-booking packages per setup

---

## 📞 Support

If you encounter issues:

1. Check the SQL migration file: `hideout/database/setup_system_migration.sql`
2. Verify Supabase tables: `setups`, `bookings`, `session_types`
3. Check browser console for errors
4. Review component props in `src/components/BookingWizard.tsx`

---

**Implementation Date:** May 13, 2026  
**Files Modified:** 
- BookingWizard.tsx (complete rewrite)
- New migration: setup_system_migration.sql
- SetupCard.tsx (no changes - already compatible)
- slots/page.tsx (no changes - already correct)
- admin/BookingsClient.tsx (no changes - already displays setup)

✅ **Ready to deploy!**
