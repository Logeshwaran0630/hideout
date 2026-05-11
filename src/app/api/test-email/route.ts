import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  const gmailUser = process.env.GMAIL_USER || 'thehideoutgame@gmail.com';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const toEmail = process.env.RESEND_TEST_EMAIL || process.env.RESEND_ADMIN_EMAIL || gmailUser;

  console.log('[Test Email API] Testing Gmail SMTP with FROM:', gmailUser);

  try {
    if (!gmailAppPassword || gmailAppPassword === 'replace-with-gmail-app-password') {
      console.error('[Test Email API] GMAIL_APP_PASSWORD is missing or still a placeholder');
      return NextResponse.json(
        { success: false, error: 'Set GMAIL_APP_PASSWORD in .env.local first' },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const info = await transporter.sendMail({
      from: `"The Hideout" <${gmailUser}>`,
      to: toEmail,
      subject: 'Test Email from Hideout',
      html: '<strong>Email system is working! Booking confirmations will now be sent.</strong>',
    });

    console.log('[Test Email API] Email sent:', info.messageId);
    return NextResponse.json({
      success: true,
      message: 'Email sent!',
      id: info.messageId,
      to: toEmail,
      from: gmailUser,
    });
  } catch (error) {
    console.error('[Test Email API] Exception:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
