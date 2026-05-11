#!/usr/bin/env node

/**
 * Clear all events from Google Calendar
 * 
 * Usage:
 *   node scripts/clear-calendar.js
 * 
 * This will delete ALL events from the calendar configured in your .env.local
 * Use with caution!
 */

const { google } = require('googleapis');

// Get credentials from environment variables
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const calendarId = process.env.GOOGLE_CALENDAR_ID;

if (!privateKey || !serviceAccountEmail || !calendarId) {
  console.error('❌ Missing environment variables:');
  console.error('   - GOOGLE_SERVICE_ACCOUNT_EMAIL');
  console.error('   - GOOGLE_PRIVATE_KEY');
  console.error('   - GOOGLE_CALENDAR_ID');
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: serviceAccountEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function clearCalendar() {
  try {
    console.log('🔄 Fetching calendar events...\n');
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      maxResults: 250,
    });

    const events = response.data.items || [];
    
    if (events.length === 0) {
      console.log('✅ Calendar is already empty!');
      return;
    }

    console.log(`Found ${events.length} events. Starting deletion...\n`);

    let deleted = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await calendar.events.delete({
          calendarId: calendarId,
          eventId: event.id,
        });
        console.log(`✅ Deleted: ${event.summary || 'Untitled Event'}`);
        deleted++;
      } catch (error) {
        console.error(`❌ Failed to delete: ${event.summary || event.id}`);
        console.error(`   Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n---`);
    console.log(`✅ Deleted: ${deleted} events`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} events`);
    }
    console.log(`Calendar cleared!`);
    
  } catch (error) {
    console.error('❌ Error clearing calendar:', error.message);
    process.exit(1);
  }
}

// Confirm before clearing
console.log('⚠️  WARNING: This will DELETE ALL events from your Google Calendar!');
console.log(`   Calendar ID: ${calendarId}\n`);

const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  clearCalendar();
} else {
  console.log('To confirm and proceed, run:');
  console.log('   node scripts/clear-calendar.js --confirm\n');
}
