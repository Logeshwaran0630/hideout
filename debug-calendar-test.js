/**
 * Browser Console Debug Script for Google Calendar Integration
 * 
 * Paste this entire script into your browser console (F12) on the booking page
 * This will test the API endpoints and show you exactly what's being sent/received
 */

// Colors for console output
const colors = {
  success: 'color: #4ade80; font-weight: bold;',
  error: 'color: #ef4444; font-weight: bold;',
  info: 'color: #06b6d4; font-weight: bold;',
  debug: 'color: #a78bfa; font-weight: bold;',
};

console.log('%c🧪 Google Calendar Debug Test Started', colors.info);
console.log('');

// Test 1: Check Calendar Connection
async function testCalendarConnection() {
  console.log('%c📡 Test 1: Calendar Connection', colors.info);
  
  try {
    const response = await fetch('/api/calendar/verify');
    const data = await response.json();
    
    if (data.success) {
      console.log('%c✅ Calendar Connected:', colors.success, data.message);
    } else {
      console.log('%c❌ Connection Failed:', colors.error, data.message);
    }
  } catch (error) {
    console.log('%c❌ Error:', colors.error, error.message);
  }
  console.log('');
}

// Test 2: Check specific time slot
async function testCheckAvailability(dateStr, startTime, endTime) {
  console.log(`%c🕐 Test 2: Check Availability for ${dateStr} ${startTime}-${endTime} (IST)`, colors.info);
  
  // Convert IST to UTC (IST is UTC+5:30)
  const [hours, minutes] = startTime.split(':').map(Number);
  const [eHours, eMinutes] = endTime.split(':').map(Number);
  const [year, month, day] = dateStr.split('-').map(Number);
  
  const utcStart = new Date(Date.UTC(year, month - 1, day, hours - 5, minutes - 30)).toISOString();
  const utcEnd = new Date(Date.UTC(year, month - 1, day, eHours - 5, eMinutes - 30)).toISOString();
  
  console.log(`  IST: ${dateStr} ${startTime}-${endTime}`);
  console.log(`  UTC: ${utcStart}`);
  console.log(`  to: ${utcEnd}`);
  
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkSlotAvailability',
        data: {
          startDateTime: utcStart,
          endDateTime: utcEnd,
        },
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(
        `%c${data.available ? '✅ Available' : '❌ Booked'}`,
        data.available ? colors.success : colors.error
      );
    } else {
      console.log('%c❌ Error:', colors.error, data.error);
    }
  } catch (error) {
    console.log('%c❌ Error:', colors.error, error.message);
  }
  console.log('');
}

// Test 3: Check May 14, 4 PM IST (10:30 AM UTC)
async function testMay14() {
  console.log('%c📅 Test 3: May 14, 2026 - 4:00 PM IST', colors.debug);
  await testCheckAvailability('2026-05-14', '16:00', '17:00');
}

// Run all tests
async function runAllTests() {
  await testCalendarConnection();
  await testMay14();
  
  console.log('%c✅ Debug test completed! Check server console for detailed logs.', colors.success);
  console.log('%c   Run: npm run dev (if not already running)', colors.info);
  console.log('%c   Look for [DEBUG] messages in terminal', colors.info);
}

// Run tests
runAllTests();

// Also expose individual test functions for manual use
window.testCalendarDebug = {
  testConnection: testCalendarConnection,
  testTime: (date, start, end) => testCheckAvailability(date, start, end),
  testMay14: testMay14,
};

console.log('%c📌 Manual Test Commands Available:', colors.debug);
console.log('   testCalendarDebug.testConnection()');
console.log('   testCalendarDebug.testTime("2026-05-14", "16:00", "17:00")');
console.log('   testCalendarDebug.testMay14()');
