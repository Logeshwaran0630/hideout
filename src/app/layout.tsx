import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ParticleNetwork from "@/components/ParticleNetwork";
import NeonBackground from "@/components/NeonBackground";
import FloatingElements from "@/components/FloatingElements";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Hideout | Gaming Lounge",
  description: "Premium local gaming lounge in Chennai for console, PC, and lounge bookings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A]">
        <NeonBackground />
        <ParticleNetwork />
        <FloatingElements />
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
