# WalletConnect Integration with Reown AppKit

This document describes the WalletConnect integration in AfriBridge frontend using Reown AppKit.

## Packages Used

- `@reown/appkit@^1.8.11` - Reown AppKit core library
- `@reown/appkit-adapter-wagmi@^1.8.11` - Wagmi adapter for AppKit
- `wagmi@^2.18.2` - React hooks for Ethereum
- `viem@^2.38.1` - TypeScript Ethereum library

## Configuration

### 1. AppKit Configuration ([config/appkit.ts](config/appkit.ts))

The main configuration file sets up:
- **WagmiAdapter**: Connects Reown AppKit with Wagmi
- **Connectors**:
  - Coinbase Smart Wallet (Email login)
  - WalletConnect (QR code for mobile wallets)
- **Networks**: Base Sepolia testnet
- **Features**: Email login, analytics, wallet display

```typescript
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export const wagmiAdapter = new WagmiAdapter({
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  networks: [baseSepolia],
  connectors: [coinbaseWallet(...), walletConnect(...)],
});

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [baseSepolia],
  features: {
    email: true,
    analytics: true,
  },
});
```

### 2. Providers Setup ([config/providers.tsx](config/providers.tsx))

Wraps the app with necessary providers:
- `WagmiProvider` - Provides Wagmi context
- `QueryClientProvider` - For React Query

```typescript
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</WagmiProvider>
```

## Components

### AppKitButton Component ([components/AppKitButton.tsx](components/AppKitButton.tsx))

A simple component that uses AppKit's built-in modal:

```typescript
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

export function AppKitButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  return (
    <button onClick={() => open()}>
      {isConnected ? 'Manage Wallet' : 'Connect Wallet'}
    </button>
  );
}
```

### Legacy Components

The following components use the old wagmi-only setup:
- [components/WalletConnect.tsx](components/WalletConnect.tsx) - Custom UI
- [components/WalletAuthButton.tsx](components/WalletAuthButton.tsx) - Auth button

**Migration Note**: You can continue using these with the old [config/wagmi.ts](config/wagmi.ts) or migrate to use AppKit hooks.

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your project ID at: https://cloud.walletconnect.com

## Supported Wallets

### Via Coinbase Smart Wallet (CDP)
- Email-based authentication
- No browser extension needed
- Gasless transactions support

### Via WalletConnect
- MetaMask
- Trust Wallet
- Rainbow Wallet
- Coinbase Wallet app
- 300+ other wallets

## Features

### Email Login
Users can connect using just their email address via Coinbase Smart Wallet.

### QR Code Connection
Mobile wallet users can scan QR code to connect.

### Account Management
Built-in modal for:
- Viewing balance
- Switching networks
- Disconnecting wallet
- Transaction history

### Multi-chain Support
Currently configured for Base Sepolia, can be extended to:
- Base Mainnet
- Other EVM chains

## Usage Example

```typescript
'use client';

import { AppKitButton } from '@/components/AppKitButton';
import { useAppKitAccount } from '@reown/appkit/react';

export default function Page() {
  const { address, isConnected } = useAppKitAccount();

  return (
    <div>
      <AppKitButton />

      {isConnected && (
        <p>Connected as: {address}</p>
      )}
    </div>
  );
}
```

## Migration from Old Config

To switch from the old wagmi-only config to AppKit:

1. Update imports in your components:
   ```typescript
   // Old
   import { config } from '@/config/wagmi';

   // New
   import { config } from '@/config/appkit';
   ```

2. Use AppKit hooks for better UX:
   ```typescript
   // Old
   import { useAccount } from 'wagmi';

   // New
   import { useAppKitAccount } from '@reown/appkit/react';
   ```

3. Replace custom connect UI with AppKit button:
   ```typescript
   // Old
   import { WalletConnect } from '@/components/WalletConnect';

   // New
   import { AppKitButton } from '@/components/AppKitButton';
   ```

## Benefits of Reown AppKit

1. **Better UX**: Professional, tested modal UI
2. **More Wallets**: Support for 300+ wallets out of the box
3. **Email Login**: Easy onboarding for non-crypto users
4. **Maintained**: Regular updates and security patches
5. **Analytics**: Built-in usage analytics (optional)
6. **Customizable**: Theme and branding options

## Troubleshooting

### "Project ID not set" warning
Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your `.env.local` file.

### Hydration errors
Make sure components using hooks are client components (`'use client'` directive).

### Modal not appearing
Check that AppKit is properly initialized before components mount.

### Network switching issues
Ensure the network you're switching to is in the `networks` array in config.

## Resources

- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)
- [Wagmi Docs](https://wagmi.sh)
- [Base Network Docs](https://docs.base.org)
- [WalletConnect Cloud](https://cloud.walletconnect.com)

## Version History

- **v1.8.11** (Current) - Latest Reown AppKit with wagmi adapter
- Uses wagmi v2.18.2
- Supports Base Sepolia testnet
