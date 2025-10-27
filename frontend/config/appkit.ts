'use client';

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { baseSepolia } from 'viem/chains';
import { cookieStorage, createStorage } from 'wagmi';
import { coinbaseWallet, walletConnect } from '@wagmi/connectors';

// Get WalletConnect Project ID from environment
// Get free project ID at: https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn(
    'WalletConnect Project ID is not set. Get one at https://cloud.walletconnect.com'
  );
}

// Define metadata for the application
const metadata = {
  name: 'AfriBridge',
  description: 'WhatsApp-integrated stablecoin remittance on Base',
  url: 'https://afribridge.app',
  icons: ['https://afribridge.app/logo.png'],
};

// Define chains
const chains = [baseSepolia] as const;

// Create Wagmi Adapter with connectors
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: chains,
  connectors: [
    // Coinbase Smart Wallet (CDP) - Email login
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
      preference: 'smartWalletOnly', // Force email-based Smart Wallet
      version: '4',
    }),

    // WalletConnect - Mobile wallets via QR code
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1000',
        },
      },
    }),
  ],
});

// Create AppKit modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: chains,
  defaultNetwork: baseSepolia,
  metadata,
  features: {
    analytics: true, // Optional - Enable analytics
    email: true, // Enable email login
    socials: [], // Social login options
    emailShowWallets: true, // Show wallets in email flow
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#0052FF', // Coinbase blue
  },
});

// Export config for use in components
export const config = wagmiAdapter.wagmiConfig;

// Export chain for use in components
export { baseSepolia };
