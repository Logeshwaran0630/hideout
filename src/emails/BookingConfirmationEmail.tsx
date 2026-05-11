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
  Row,
  Column,
} from '@react-email/components';

interface BookingConfirmationEmailProps {
  name: string;
  hId: string;
  bookingCode: string;
  bookingDate: string;
  timeSlot: string;
  sessionType: string;
  players: number;
  price: number;
  coinsEarned: number;
}

export const BookingConfirmationEmail = ({
  name,
  hId,
  bookingCode,
  bookingDate,
  timeSlot,
  sessionType,
  players,
  price,
  coinsEarned,
}: BookingConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Booking Confirmed! Your code: {bookingCode}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://hideout.vercel.app/logo.png"
          width="60"
          height="60"
          alt="The Hideout"
          style={logo}
        />

        <Heading style={h1}>Booking Confirmed! 🎉</Heading>

        <Text style={text}>Hey {name}, your slot is locked in!</Text>

        {/* Booking Code */}
        <Section style={codeBox}>
          <Text style={codeLabel}>YOUR BOOKING CODE</Text>
          <Text style={codeText}>{bookingCode}</Text>
          <Text style={codeNote}>Show this at the counter</Text>
        </Section>

        {/* Booking Details */}
        <Section style={detailsBox}>
          <Row>
            <Column align="center" style={detailCell}>
              <Text style={detailLabel}>Date</Text>
              <Text style={detailValue}>{bookingDate}</Text>
            </Column>
            <Column align="center" style={detailCell}>
              <Text style={detailLabel}>Time</Text>
              <Text style={detailValue}>{timeSlot}</Text>
            </Column>
          </Row>
          <Row>
            <Column align="center" style={detailCell}>
              <Text style={detailLabel}>Session</Text>
              <Text style={detailValue}>{sessionType}</Text>
            </Column>
            <Column align="center" style={detailCell}>
              <Text style={detailLabel}>Players</Text>
              <Text style={detailValue}>{players}</Text>
            </Column>
          </Row>
        </Section>

        {/* Price & Coins */}
        <Section style={priceBox}>
          <Row>
            <Column align="center">
              <Text style={priceLabel}>Total Price</Text>
              <Text style={priceValue}>₹{price}</Text>
            </Column>
            <Column align="center">
              <Text style={priceLabel}>H Coins Earned</Text>
              <Text style={coinsValue}>+{coinsEarned}</Text>
            </Column>
          </Row>
        </Section>

        <Text style={reminder}>
          ⏰ Please arrive 10 minutes before your slot.
          Cancellations must be made 2 hours in advance.
        </Text>

        <Button href="https://hideout.vercel.app/profile" style={button}>
          View My Bookings →
        </Button>

        <Hr style={hr} />

        <Text style={footer}>
          H-ID: {hId} | The Hideout, Chennai | Open 11 AM - Midnight
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
  maxWidth: '520px',
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
  lineHeight: '22px',
  textAlign: 'center' as const,
  margin: '12px 0',
};

const codeBox = {
  backgroundColor: '#0A0A0A',
  border: '1px solid #A855F7',
  borderRadius: '12px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const codeLabel = {
  color: '#71717A',
  fontSize: '10px',
  letterSpacing: '1px',
  margin: '0 0 8px',
};

const codeText = {
  color: '#A855F7',
  fontSize: '28px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  margin: '0',
};

const codeNote = {
  color: '#71717A',
  fontSize: '11px',
  margin: '8px 0 0',
};

const detailsBox = {
  backgroundColor: '#0A0A0A',
  borderRadius: '12px',
  padding: '16px',
  margin: '20px 0',
};

const detailCell = {
  width: '50%',
};

const detailLabel = {
  color: '#71717A',
  fontSize: '11px',
  margin: '0 0 4px',
};

const detailValue = {
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 'bold',
  margin: 0,
};

const priceBox = {
  backgroundColor: '#0A0A0A',
  borderRadius: '12px',
  padding: '12px',
  margin: '20px 0',
};

const priceLabel = {
  color: '#71717A',
  fontSize: '11px',
  margin: 0,
};

const priceValue = {
  color: '#A855F7',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '4px 0 0',
};

const coinsValue = {
  color: '#22C55E',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '4px 0 0',
};

const reminder = {
  color: '#A1A1AA',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const button = {
  backgroundColor: '#A855F7',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '180px',
  margin: '20px auto 0',
  padding: '10px 20px',
};

const hr = {
  borderColor: '#2A2A2A',
  margin: '24px 0 16px',
};

const footer = {
  color: '#71717A',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
};
