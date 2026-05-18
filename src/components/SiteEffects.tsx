'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import DemonBackground from '@/components/DemonBackground';

const WhatsAppWidget = dynamic(() => import('@/components/WhatsAppWidget'), {
  ssr: false,
  loading: () => null,
});

const hiddenPrefixes = ['/admin', '/login', '/profile', '/scan', '/auth'];

export default function SiteEffects() {
  const pathname = usePathname();

  if (!pathname || hiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <>
      <DemonBackground />
      <WhatsAppWidget />
    </>
  );
}