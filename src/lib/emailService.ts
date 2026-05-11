import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || 'thehideoutgame@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL || process.env.GMAIL_USER || 'thehideoutgame@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  h_id?: string | null;
}

export interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  total_price: number;
  time_slots?: { label?: string | null } | null;
  session_types?: {
    name?: string | null;
    max_players?: number | null;
    h_coins_earned?: number | null;
  } | null;
  users?: User | null;
}

function getFromEmail() {
  return `"The Hideout" <${GMAIL_USER}>`;
}

function getCustomerName(user?: User | null) {
  return user?.display_name || user?.email?.split('@')[0] || 'Customer';
}

function getFormattedDate(date: string, includeYear = true) {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  });
}

function canSendEmail(label: string) {
  if (!GMAIL_USER) {
    console.error(`[Email] ${label} failed: GMAIL_USER is missing`);
    return false;
  }

  if (!GMAIL_APP_PASSWORD || GMAIL_APP_PASSWORD === 'replace-with-gmail-app-password') {
    console.error(`[Email] ${label} failed: GMAIL_APP_PASSWORD is missing or still a placeholder`);
    return false;
  }

  return true;
}

export async function sendWelcomeEmail(user: User) {
  const recipient = user.email;
  console.log(`[Email] Sending welcome email to ${recipient}`);

  try {
    if (!canSendEmail('Welcome email')) {
      return false;
    }

    if (!recipient) {
      console.error('[Email] Welcome email failed: recipient email is missing');
      return false;
    }

    const info = await transporter.sendMail({
      from: getFromEmail(),
      to: recipient,
      subject: 'Welcome to The Hideout!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #A855F7, #7C3AED); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to The Hideout!</h1>
          </div>
          <div style="padding: 20px; background: #18181B; color: #A1A1AA;">
            <p>Hi <strong style="color: white;">${getCustomerName(user)}</strong>,</p>
            <p>Your gaming adventure starts here!</p>
            <div style="background: #0A0A0A; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #A855F7; font-size: 12px;">YOUR H-ID</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: white;">${user.h_id || 'HID-000001'}</p>
            </div>
            <p>Use this H-ID to book slots and track your H Coins.</p>
            <a href="https://hideout-67tl.vercel.app/slots" style="display: inline-block; background: #A855F7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
              Book Your First Slot
            </a>
          </div>
          <div style="padding: 20px; text-align: center; font-size: 12px; color: #6B7280;">
            <p>The Hideout, Chennai | Open 11 AM - Midnight</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] Welcome email sent to ${recipient}, ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Welcome email failed:', error);
    return false;
  }
}

export async function sendBookingConfirmationEmail(booking: Booking) {
  const user = booking.users;
  const recipient = user?.email || '';
  const timeSlot = booking.time_slots?.label || 'Unknown';
  const sessionType = booking.session_types?.name || 'Standard';
  const coinsEarned = booking.session_types?.h_coins_earned || 0;

  console.log(`[Email] Sending booking confirmation to ${recipient || 'missing email'}`);

  try {
    if (!canSendEmail('Booking confirmation')) {
      return false;
    }

    if (!recipient) {
      console.error('[Email] Booking confirmation failed: recipient email is missing');
      return false;
    }

    const info = await transporter.sendMail({
      from: getFromEmail(),
      to: recipient,
      subject: `Booking Confirmed: ${booking.booking_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #A855F7, #7C3AED); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
          </div>
          <div style="padding: 20px; background: #18181B; color: #A1A1AA;">
            <p>Hi <strong style="color: white;">${getCustomerName(user)}</strong>,</p>
            <p>Your slot is locked in! Here are your booking details:</p>
            <div style="background: #0A0A0A; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #A855F7; font-size: 12px;">BOOKING CODE</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: white; letter-spacing: 2px;">${booking.booking_code}</p>
            </div>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td style="padding: 8px 0; color: #6B7280;">Date</td><td style="color: white;">${getFormattedDate(booking.booking_date)}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Time</td><td style="color: white;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Session</td><td style="color: white;">${sessionType}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Price</td><td style="color: #A855F7; font-weight: bold;">Rs. ${booking.total_price}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">H Coins Earned</td><td style="color: #22C55E;">+${coinsEarned} coins</td></tr>
            </table>
            <p>Show this booking code at the counter when you arrive.</p>
            <p>The Hideout, Chennai | Open 11 AM - Midnight</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] Booking confirmation sent to ${recipient}, ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Booking confirmation failed:', error);
    return false;
  }
}

export async function sendBookingReminderEmail(booking: Booking) {
  const user = booking.users;
  const recipient = user?.email || '';
  const timeSlot = booking.time_slots?.label || 'Unknown';
  const sessionType = booking.session_types?.name || 'Standard';

  console.log(`[Email] Sending reminder email to ${recipient || 'missing email'}`);

  try {
    if (!canSendEmail('Reminder email')) {
      return false;
    }

    if (!recipient) {
      console.error('[Email] Reminder email failed: recipient email is missing');
      return false;
    }

    const info = await transporter.sendMail({
      from: getFromEmail(),
      to: recipient,
      subject: 'Reminder: Your Hideout booking is tomorrow!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Booking Reminder</h1>
          <p>Hi ${getCustomerName(user)}, your gaming session is tomorrow.</p>
          <p><strong>Booking Code:</strong> ${booking.booking_code}</p>
          <p><strong>Date:</strong> ${getFormattedDate(booking.booking_date, false)}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>
          <p><strong>Session:</strong> ${sessionType}</p>
        </div>
      `,
    });

    console.log(`[Email] Reminder email sent to ${recipient}, ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Reminder email failed:', error);
    return false;
  }
}

export async function sendBookingCancellationEmail(booking: Booking) {
  const user = booking.users;
  const recipient = user?.email || '';
  const timeSlot = booking.time_slots?.label || 'Unknown';
  const sessionType = booking.session_types?.name || 'Standard';

  console.log(`[Email] Sending cancellation email to ${recipient || 'missing email'}`);

  try {
    if (!canSendEmail('Cancellation email')) {
      return false;
    }

    if (!recipient) {
      console.error('[Email] Cancellation email failed: recipient email is missing');
      return false;
    }

    const info = await transporter.sendMail({
      from: getFromEmail(),
      to: recipient,
      subject: `Booking Cancelled: ${booking.booking_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #EF4444; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
          </div>
          <div style="padding: 20px; background: #18181B; color: #A1A1AA;">
            <p>Hi <strong style="color: white;">${getCustomerName(user)}</strong>,</p>
            <p>Your booking has been cancelled as requested.</p>
            <div style="background: #0A0A0A; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #EF4444; font-size: 12px;">CANCELLED BOOKING</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: white;">${booking.booking_code}</p>
            </div>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td style="padding: 8px 0; color: #6B7280;">Date</td><td style="color: white;">${getFormattedDate(booking.booking_date, false)}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Time</td><td style="color: white;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Session</td><td style="color: white;">${sessionType}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Price</td><td style="color: #A855F7;">Rs. ${booking.total_price}</td></tr>
            </table>
            <p>We hope to see you again soon!</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] Cancellation email sent to ${recipient}, ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Cancellation email failed:', error);
    return false;
  }
}

export async function sendAdminAlertEmail(booking: Booking) {
  const user = booking.users;
  const timeSlot = booking.time_slots?.label || 'Unknown';
  const sessionType = booking.session_types?.name || 'Standard';

  console.log(`[Email] Sending admin alert for booking ${booking.booking_code}`);

  try {
    if (!canSendEmail('Admin alert')) {
      return false;
    }

    const info = await transporter.sendMail({
      from: getFromEmail(),
      to: ADMIN_EMAIL,
      subject: `New Booking: ${booking.booking_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #A855F7, #7C3AED); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Booking Alert!</h1>
          </div>
          <div style="padding: 20px; background: #18181B; color: #A1A1AA;">
            <p>A new booking has been made:</p>
            <table style="width: 100%; margin: 20px 0;">
              <tr><td style="padding: 8px 0; color: #6B7280;">Booking Code</td><td style="color: white; font-weight: bold;">${booking.booking_code}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Customer</td><td style="color: white;">${getCustomerName(user)}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">H-ID</td><td style="color: white;">${user?.h_id || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Date</td><td style="color: white;">${getFormattedDate(booking.booking_date)}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Time</td><td style="color: white;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Session</td><td style="color: white;">${sessionType}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280;">Price</td><td style="color: #A855F7;">Rs. ${booking.total_price}</td></tr>
            </table>
            <p>Login to admin panel to view full details.</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] Admin alert sent, ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Admin alert failed:', error);
    return false;
  }
}
