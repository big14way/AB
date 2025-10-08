import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { walletConnect } from '@wagmi/connectors';
import { coinbaseWallet } from 'wagmi/connectors';

// Get WalletConnect Project ID from environment
// Get free project ID at: https://cloud.walletconnect.com
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!walletConnectProjectId) {
  console.warn(
    'WalletConnect Project ID is not set. Get one at https://cloud.walletconnect.com'
  );
}

/**
 * Wagmi Configuration for AfriBridge
 * 
 * Supports:
 * - Coinbase Smart Wallet (CDP) - Email-based wallet
 * - WalletConnect - Mobile wallets (MetaMask, Trust, etc.)
 * - Coinbase Wallet - Coinbase native wallet
 */
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    // Coinbase Smart Wallet (CDP) - Email login
    coinbaseWallet({
      appName: 'AfriBridge',
      appLogoUrl: 'https://afribridge.app/logo.png',
      preference: 'smartWalletOnly', // Force email-based Smart Wallet
      version: '4',
    }),
    
    // WalletConnect - Mobile wallets via QR code
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'AfriBridge',
        description: 'WhatsApp-integrated stablecoin remittance on Base',
        url: 'https://afribridge.app',
        icons: ['https://afribridge.app/logo.png'],
      },
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1000',
        },
      },
    }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
  },
  ssr: true, // Enable SSR support for Next.js
});

// Export chain for use in components
export { baseSepolia };

// Type exports for TypeScript
export type Config = typeof config;
