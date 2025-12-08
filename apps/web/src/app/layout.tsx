import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'VisuCAN - AI-Powered PCB Design Platform',
    template: '%s | VisuCAN',
  },
  description:
    'AI-powered browser-based SaaS platform combining Claude AI with professional PCB design tools. Design PCBs from block diagram to manufacturing with ease.',
  keywords: [
    'PCB design',
    'AI',
    'Claude',
    'Altium',
    'electronics',
    'circuit design',
    'schematic',
    'manufacturing',
  ],
  authors: [{ name: 'VisuCAN' }],
  creator: 'VisuCAN',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://visucan.io',
    title: 'VisuCAN - AI-Powered PCB Design Platform',
    description:
      'Design PCBs from concept to manufacturing with AI assistance. Real-time component sourcing, instant quotes, and professional documentation.',
    siteName: 'VisuCAN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisuCAN - AI-Powered PCB Design Platform',
    description:
      'Design PCBs from concept to manufacturing with AI assistance.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
