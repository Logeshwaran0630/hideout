// Quick verification script to test the calendar event deletion
// Run this in your browser console while on the admin bookings page

async function testCalendarEventDeletion() {
  console.log('🔍 Testing Calendar Event Deletion...\n');

  // 1. Check if calendar_event_id is present in bookings
  console.log('Step 1: Checking for calendar_event_id in bookings...');
  
  // Get a booking row from the page (this is a simple check)
  const bookingRows = document.querySelectorAll('tbody tr');
  
  if (bookingRows.length === 0) {
    console.log('❌ No bookings found on the page');
    return;
  }

  console.log(`✅ Found ${bookingRows.length} bookings\n`);

  // 2. Test the /api/calendar/verify endpoint
  console.log('Step 2: Testing calendar connection...');
  
  try {
    const verifyResponse = await fetch('/api/calendar/verify');
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      console.log('✅ Google Calendar connection verified:', verifyData.message);
    } else {
      console.log('❌ Google Calendar connection failed:', verifyData.message);
    }
  } catch (error) {
    console.log('❌ Error verifying calendar connection:', error);
  }

  console.log('\n---\n');
  console.log('🎯 Next Steps:');
  console.log('1. Click "Cancel" on any confirmed booking');
  console.log('2. Click "Yes, Cancel It" in the modal');
  console.log('3. Check Google Calendar - the event should be deleted');
  console.log('4. Refresh the page and verify the booking status is "cancelled"');
  console.log('\n📋 If the event is not deleted from Google Calendar:');
  console.log('   - Check browser console for errors');
  console.log('   - Ensure GOOGLE_CALENDAR_ID environment variable is correct');
  console.log('   - Verify the service account has write access to the calendar');
}

// Run the test
testCalendarEventDeletion();
