import { NextResponse } from 'next/server';
import { verifyCalendarConnection } from '@/lib/googleCalendar';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const isConnected = await verifyCalendarConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Google Calendar is connected and ready' : 'Connection failed',
    });
  } catch (error) {
    console.error('[Calendar Verify] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Connection verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
