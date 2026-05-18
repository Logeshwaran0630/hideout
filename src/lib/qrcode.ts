import QRCode from 'qrcode';

export async function generateQRCode(bookingCode: string): Promise<string> {
  try {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hideout-67tl.vercel.app'}/scan/${bookingCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#FF4500',
        light: '#0A0F18',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return '';
  }
}
