import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VPS Monitor',
  description: 'Internal VPS monitoring dashboard',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
