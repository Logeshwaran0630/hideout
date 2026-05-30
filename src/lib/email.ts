export const welcomeTemplate = `
Welcome to The Hideout!

Your H-ID: _____
Use this ID to book slots and track your H Coins.

Book your first slot: [Link]
`;

export const bookingTemplate = `
Your booking is confirmed!

Booking Code: _____
Date: _____
Time: _____
Session: _____
Price: ₹_____

Show this code at the counter.
`;

export {
  sendAdminAlertEmail,
  sendBookingCancellationEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendWelcomeEmail,
} from './emailService';