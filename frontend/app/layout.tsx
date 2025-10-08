import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Web3Providers } from '../config/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AfriBridge - WhatsApp Stablecoin Remittance',
  description: 'Send money from mobile money to USDC on Base blockchain via WhatsApp',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}
