import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BookingReminderEmailProps {
  name: string;
  bookingCode: string;
  bookingDate: string;
  timeSlot: string;
  sessionType: string;
}

export const BookingReminderEmail = ({
  name,
  bookingCode,
  bookingDate,
  timeSlot,
  sessionType,
}: BookingReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Reminder: Your Hideout booking is tomorrow!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://hideout.vercel.app/logo.png"
          width="60"
          height="60"
          alt="The Hideout"
          style={logo}
        />

        <Heading style={h1}>⏰ Booking Reminder</Heading>

        <Text style={text}>Hey {name}, your gaming session is tomorrow!</Text>

        <Section style={detailsBox}>
          <Text style={detailRow}>
            <strong>Booking Code:</strong> {bookingCode}
          </Text>
          <Text style={detailRow}>
            <strong>Date:</strong> {bookingDate}
          </Text>
          <Text style={detailRow}>
            <strong>Time:</strong> {timeSlot}
          </Text>
          <Text style={detailRow}>
            <strong>Session:</strong> {sessionType}
          </Text>
        </Section>

        <Text style={reminder}>
          📍 Location: The Hideout, Chennai<br />
          🕐 Please arrive 10 minutes early<br />
          ❌ Cancellations must be made at least 2 hours before
        </Text>

        <Button href="https://hideout.vercel.app/profile" style={button}>
          View Booking Details →
        </Button>

        <Text style={footer}>
          Need to cancel? Reply to this email or WhatsApp us.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#0A0A0A',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#18181B',
  border: '1px solid #2A2A2A',
  borderRadius: '16px',
  margin: '40px auto',
  padding: '32px',
  maxWidth: '500px',
};

const logo = {
  margin: '0 auto 16px',
  display: 'block',
};

const h1 = {
  color: '#FFFFFF',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const text = {
  color: '#A1A1AA',
  fontSize: '15px',
  textAlign: 'center' as const,
  margin: '12px 0',
};

const detailsBox = {
  backgroundColor: '#0A0A0A',
  borderRadius: '12px',
  padding: '16px',
  margin: '20px 0',
};

const detailRow = {
  color: '#A1A1AA',
  fontSize: '14px',
  margin: '8px 0',
};

const reminder = {
  color: '#A1A1AA',
  fontSize: '13px',
  textAlign: 'center' as const,
  lineHeight: '20px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#A855F7',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  margin: '20px auto',
  padding: '10px 20px',
};

const footer = {
  color: '#71717A',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
};
