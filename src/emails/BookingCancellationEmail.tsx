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

interface BookingCancellationEmailProps {
  name: string;
  bookingCode: string;
  bookingDate: string;
  timeSlot: string;
}

export const BookingCancellationEmail = ({
  name,
  bookingCode,
  bookingDate,
  timeSlot,
}: BookingCancellationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Hideout booking has been cancelled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://hideout.vercel.app/logo.png"
          width="60"
          height="60"
          alt="The Hideout"
          style={logo}
        />

        <Heading style={h1}>Booking Cancelled</Heading>

        <Text style={text}>Hey {name}, your booking has been cancelled.</Text>

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
        </Section>

        <Text style={refund}>
          Your H Coins have been refunded to your account.
        </Text>

        <Button href="https://hideout.vercel.app/slots" style={button}>
          Book a New Slot →
        </Button>

        <Hr style={hr} />

        <Text style={footer}>
          Need help? Reply to this email or WhatsApp us.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#0A0F18',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#14181F',
  border: '1px solid #2A2F38',
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
  color: '#F5F1EA',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const text = {
  color: '#A0A6AF',
  fontSize: '15px',
  textAlign: 'center' as const,
  margin: '12px 0',
};

const detailsBox = {
  backgroundColor: '#0A0F18',
  borderRadius: '12px',
  padding: '16px',
  margin: '20px 0',
};

const detailRow = {
  color: '#A0A6AF',
  fontSize: '14px',
  margin: '8px 0',
};

const refund = {
  color: '#22C55E',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const button = {
  backgroundColor: '#FF4500',
  borderRadius: '8px',
  color: '#F5F1EA',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '180px',
  margin: '20px auto',
  padding: '10px 20px',
};

const hr = {
  borderColor: '#2A2F38',
  margin: '24px 0 16px',
};

const footer = {
  color: '#71717A',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
};
