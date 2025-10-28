# AfriBridge Frontend

Next.js frontend for AfriBridge with hybrid wallet support (CDP + WalletConnect).

## Features

- 🔐 **Hybrid Wallet Support**
  - Coinbase Smart Wallet (email login via CDP)
  - WalletConnect (MetaMask, Trust Wallet, etc.)
  
- ⚡ **Base Sepolia Integration**
  - Connect to Bridge contract
  - Deposit USDC
  - View transactions
  
- 🎨 **Modern UI**
  - Responsive design
  - Real-time wallet status
  - Transaction confirmations

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
# WalletConnect Project ID (REQUIRED)
# Get free at: https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Base Sepolia RPC
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# Bridge Contract Address
NEXT_PUBLIC_BRIDGE_CONTRACT_ADDRESS=0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
```

### 3. Get WalletConnect Project ID

1. Visit: https://cloud.walletconnect.com
2. Sign up (free)
3. Create new project
4. Copy Project ID
5. Add to `.env.local`

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

Open http://localhost:3000

## Wallet Options

### Coinbase Smart Wallet (CDP)
- **No download needed**
- Login with email
- Passkey authentication
- Perfect for new users

### WalletConnect
- **Mobile wallet support**
- Scan QR code
- MetaMask, Trust Wallet, Rainbow, etc.
- Full dApp browser support

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   └── WalletConnect.tsx # Wallet connection UI
├── config/
│   ├── wagmi.ts         # Wagmi configuration
│   └── providers.tsx    # Web3 providers
├── hooks/
│   └── useBridgeContract.ts # Bridge contract hook
└── public/
    └── (static assets)
```

## WalletConnect Integration (Updated)

**🆕 Now using Reown AppKit** for enhanced WalletConnect integration!

The `config/appkit.ts` file configures the new Reown AppKit:

```typescript
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { coinbaseWallet, walletConnect } from '@wagmi/connectors';

// Create Wagmi Adapter with connectors
export const wagmiAdapter = new WagmiAdapter({
  projectId: '1eebe528ca0ce94a99ceaa2e915058d7',
  networks: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'AfriBridge',
      preference: 'smartWalletOnly',
    }),
    walletConnect({
      projectId: '1eebe528ca0ce94a99ceaa2e915058d7',
      showQrModal: true,
    }),
  ],
});

// Create AppKit modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: '1eebe528ca0ce94a99ceaa2e915058d7',
  networks: [baseSepolia],
  features: {
    email: true,
    analytics: true,
  },
});
```

**Benefits of Reown AppKit:**
- ✅ Professional modal UI out of the box
- ✅ Support for 300+ mobile wallets
- ✅ Enhanced email login experience
- ✅ Built-in account management
- ✅ Regular security updates from Reown team

**Packages Used:**
- `@reown/appkit@^1.8.11`
- `@reown/appkit-adapter-wagmi@^1.8.11`

See `WALLETCONNECT_INTEGRATION.md` for detailed documentation.

## Usage

### Connect Wallet

```typescript
import { useConnect } from 'wagmi';

const { connect, connectors } = useConnect();

// Connect with Coinbase Smart Wallet
connect({ connector: connectors[0] });

// Connect with WalletConnect
connect({ connector: connectors[1] });
```

### Read Contract

```typescript
import { useBridgeContract } from '@/hooks/useBridgeContract';

const { contractBalance } = useBridgeContract();

console.log('Balance:', contractBalance);
```

### Deposit USDC

```typescript
import { useBridgeContract } from '@/hooks/useBridgeContract';

const { depositUSDC, isPending, isConfirmed } = useBridgeContract();

await depositUSDC(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // recipient
  '10.0', // amount USDC
  'ABR-123456' // reference
);
```

## Contract Integration

The Bridge contract at `0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88` supports:

- `depositUSDC(address to, uint256 amount, string fiatRef)`
- `getContractBalance() returns (uint256)`

See `hooks/useBridgeContract.ts` for implementation.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect project ID |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | No | Custom RPC URL (defaults to public) |
| `NEXT_PUBLIC_BRIDGE_CONTRACT_ADDRESS` | No | Contract address (defaults to deployed) |
| `NEXT_PUBLIC_API_URL` | No | Backend API URL |

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

Configure environment variables in Vercel dashboard.

### Manual Build

```bash
npm run build
npm start
```

## Testing

### Test Wallet Connection

1. Start dev server: `npm run dev`
2. Click "Connect Wallet"
3. Choose Coinbase Smart Wallet or WalletConnect
4. Complete authentication
5. Verify wallet address appears

### Test Contract Interaction

1. Connect wallet with ETH on Base Sepolia
2. Enter recipient address
3. Enter USDC amount
4. Click "Deposit USDC"
5. Approve transaction in wallet
6. Wait for confirmation
7. View transaction on BaseScan

## Troubleshooting

### WalletConnect Not Working

- Check Project ID is set correctly
- Visit https://cloud.walletconnect.com to verify project
- Ensure project is not paused

### Coinbase Wallet Not Appearing

- Check CDP is properly installed: `@coinbase/cdp-hooks`
- Verify wagmi configuration
- Check browser console for errors

### Contract Calls Failing

- Verify you're on Base Sepolia network
- Check you have ETH for gas
- Confirm contract address is correct
- Review transaction on BaseScan

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Resources

- **WalletConnect**: https://cloud.walletconnect.com
- **Coinbase CDP**: https://docs.cdp.coinbase.com
- **Wagmi**: https://wagmi.sh
- **Base**: https://docs.base.org
- **Contract**: https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88

## Support

For issues:
1. Check console for errors
2. Review WalletConnect project status
3. Verify environment variables
4. Check network connection
5. Review Base Sepolia status

---

Built with Next.js 14, Wagmi 2, and WalletConnect.
