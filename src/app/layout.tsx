import type { Metadata } from "next";
import "./globals.css";
import SiteEffects from "@/components/SiteEffects";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-dark-bg text-white">
        <SiteEffects />
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
