import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  hId: string;
  email: string;
}

export const WelcomeEmail = ({ name, hId, email }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to The Hideout! Your H-ID is {hId}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://hideout.vercel.app/logo.png"
          width="80"
          height="80"
          alt="The Hideout"
          style={logo}
        />
        <Heading style={h1}>Welcome to The Hideout, {name}! 🎮</Heading>

        <Text style={text}>
          You're now part of Chennai's premier gaming lounge. Here's your unique H-ID:
        </Text>

        <Section style={codeBox}>
          <Text style={codeText}>{hId}</Text>
        </Section>

        <Text style={text}>
          Use this H-ID to book slots via WhatsApp or website. Keep it handy!
        </Text>

        <Section style={statsSection}>
          <Row>
            <Column align="center">
              <Text style={statNumber}>10+</Text>
              <Text style={statLabel}>Premium Consoles</Text>
            </Column>
            <Column align="center">
              <Text style={statNumber}>50+</Text>
              <Text style={statLabel}>Game Titles</Text>
            </Column>
            <Column align="center">
              <Text style={statNumber}>Midnight</Text>
              <Text style={statLabel}>Open Till</Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          Ready to play? Book your first slot:
        </Text>

        <Button href="https://hideout.vercel.app/slots" style={button}>
          Book a Slot →
        </Button>

        <Hr style={hr} />

        <Text style={footer}>
          The Hideout, Chennai<br />
          Open 11 AM – Midnight<br />
          Questions? Reply to this email or WhatsApp us.
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
  padding: '40px 32px',
  maxWidth: '560px',
};

const logo = {
  margin: '0 auto 24px',
  display: 'block',
};

const h1 = {
  color: '#FFFFFF',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '24px 0 16px',
};

const text = {
  color: '#A1A1AA',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const codeBox = {
  backgroundColor: '#0A0A0A',
  border: '1px solid #A855F7',
  borderRadius: '12px',
  padding: '16px',
  margin: '24px 0',
};

const codeText = {
  color: '#A855F7',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  fontFamily: 'monospace',
  letterSpacing: '2px',
  margin: 0,
};

const statsSection = {
  backgroundColor: '#0A0A0A',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
};

const statNumber = {
  color: '#A855F7',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
};

const statLabel = {
  color: '#71717A',
  fontSize: '12px',
  margin: '4px 0 0',
};

const button = {
  backgroundColor: '#A855F7',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  margin: '0 auto',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#2A2A2A',
  margin: '32px 0 24px',
};

const footer = {
  color: '#71717A',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
};
