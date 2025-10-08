# 🌍 AfriBridge

**WhatsApp-integrated stablecoin remittance dApp on Base blockchain**

Bridge African mobile money (M-Pesa via Flutterwave) to USDC on Base with a modern Next.js frontend featuring hybrid wallet support.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Base](https://img.shields.io/badge/Base-Sepolia-blue.svg)](https://base.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-green.svg)](https://soliditylang.org/)

## 📋 Overview

AfriBridge enables users to send money from African mobile money services to USDC on Base blockchain through:
- 📱 WhatsApp bot interface
- 📧 Email-based wallet (Coinbase Smart Wallet)
- 🔗 Mobile wallets via WalletConnect
- 💰 M-Pesa integration via Flutterwave
- ⚡ Fast & cheap transactions on Base L2

## 🎯 Features

### Smart Contracts
- **Bridge Contract**: Gas-optimized USDC bridge (~62k gas per transaction)
- **Deployed & Verified**: Base Sepolia testnet
- **Security**: OpenZeppelin AccessControl + ReentrancyGuard

### Backend API
- Express.js REST API with 10 endpoints
- WhatsApp bot with 7-state conversation flow
- Payment processing via Flutterwave
- USDC handling via Circle API
- Off-ramp service for withdrawals
- Error handling & retry mechanisms

### Frontend
- Next.js 14 with TypeScript
- Hybrid wallet support:
  - Coinbase Smart Wallet (CDP) - Email login
  - WalletConnect - Mobile wallets (MetaMask, Trust, etc.)
- Bridge contract integration
- Real-time transaction tracking
- Mobile-responsive design

### Testing
- 56 automated tests (contracts + backend + bot)
- E2E flow simulation
- 100% contract coverage
- Integration test suite

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Clone Repository

```bash
git clone https://github.com/big14way/AB.git
cd AB
npm install
```

### Environment Setup

#### Backend Configuration

Create `.env` in root:

```bash
# Blockchain
PRIVATE_KEY=your_wallet_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BRIDGE_CONTRACT_ADDRESS=0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
USDC_ADDRESS_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Flutterwave (get from flutterwave.com)
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_SECRET_HASH=your_hash

# Twilio (get from twilio.com)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Circle (get from circle.com)
CIRCLE_API_KEY=your_api_key
CIRCLE_WALLET_ID=your_wallet_id

# Admin
ADMIN_API_KEY=your_secure_admin_key
```

#### Frontend Configuration

Create `frontend/.env.local`:

```bash
# WalletConnect (get free at cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Bridge Contract
NEXT_PUBLIC_BRIDGE_CONTRACT_ADDRESS=0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### Run Backend

```bash
npm start
```

Backend runs on http://localhost:3000

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## 📱 Usage

### Connect Wallet

1. Visit http://localhost:3000
2. Click "Connect Wallet"
3. Choose:
   - **Coinbase Smart Wallet** (email login)
   - **WalletConnect** (QR code for mobile wallets)

### Send via WhatsApp

1. Message the bot: "send"
2. Enter amount in KES
3. Provide recipient Ethereum address
4. Confirm transaction
5. Pay via M-Pesa/card
6. Receive USDC on Base

### Deposit USDC (Frontend)

1. Connect wallet
2. Click "Test Deposit"
3. Enter recipient & amount
4. Approve transaction
5. View on BaseScan

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           FRONTEND                  │
│  Next.js + Wagmi + WalletConnect   │
│  ├─ CDP (Email Wallet)             │
│  └─ WalletConnect (Mobile)         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│           BACKEND                   │
│  Express API + WhatsApp Bot         │
│  ├─ Flutterwave (M-Pesa)           │
│  ├─ Circle (USDC)                  │
│  └─ Bridge Service                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      BRIDGE CONTRACT                │
│  Base Sepolia: 0xC3a201c...5Cf88   │
│  ├─ depositUSDC()                  │
│  └─ withdrawUSDC()                 │
└─────────────────────────────────────┘
```

## 🧪 Testing

### Run All Tests

```bash
npm run test:all
```

### Contract Tests

```bash
npm run contracts:test
```

Expected: 12 passing tests

### Backend Tests

```bash
npm test
```

Expected: 44 passing tests

### E2E Simulation

```bash
# Terminal 1
npm start

# Terminal 2
npm run test:e2e
```

## 📦 Deployment

### Deploy Contracts

```bash
npm run contracts:deploy:sepolia
```

### Deploy Backend (Vercel)

```bash
npm run deploy:vercel
```

Set environment variables in Vercel dashboard.

### Deploy Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Configure environment variables for production.

## 🔗 Links

### Deployed Contract
- **Address**: `0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88`
- **Network**: Base Sepolia (Chain ID: 84532)
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88)

### Resources
- **Base Docs**: https://docs.base.org
- **WalletConnect**: https://cloud.walletconnect.com
- **Coinbase CDP**: https://docs.cdp.coinbase.com
- **Flutterwave**: https://flutterwave.com/documentation
- **Circle**: https://developers.circle.com

## 🛠️ Tech Stack

**Blockchain:**
- Solidity 0.8.20
- Hardhat
- OpenZeppelin
- Base (Ethereum L2)

**Backend:**
- Node.js 18+
- Express.js
- Twilio (WhatsApp)
- Flutterwave (Payments)
- Circle (USDC)

**Frontend:**
- Next.js 14
- TypeScript
- Wagmi 2
- Viem 2
- WalletConnect

**Testing:**
- Hardhat (Contracts)
- Jest + Supertest (Backend)
- Chai (Assertions)

## 📊 Project Stats

- **Lines of Code**: ~7,100
- **Smart Contracts**: 1 (Bridge.sol)
- **API Endpoints**: 10
- **Tests**: 56 passing
- **Test Coverage**: >90%
- **Files**: 73+

## 🔐 Security

- Non-custodial wallets
- Role-based access control
- ReentrancyGuard protection
- Input validation
- Rate limiting
- Secure environment variables

**⚠️ Important**: This is a testnet MVP. For production:
- Get professional smart contract audit
- Implement KYC/AML compliance
- Add transaction database
- Use multi-sig for admin
- Deploy to Base mainnet

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Base](https://base.org) - Ethereum L2 network
- [Coinbase](https://coinbase.com) - Smart Wallet infrastructure
- [WalletConnect](https://walletconnect.com) - Wallet protocol
- [OpenZeppelin](https://openzeppelin.com) - Smart contract library
- [Flutterwave](https://flutterwave.com) - Payment processing
- [Circle](https://circle.com) - USDC infrastructure

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/big14way/AB/issues)
- **Discussions**: [GitHub Discussions](https://github.com/big14way/AB/discussions)

## 🗺️ Roadmap

### Current (Testnet MVP)
- ✅ Bridge contract deployed on Base Sepolia
- ✅ Backend API with WhatsApp bot
- ✅ Frontend with hybrid wallets
- ✅ 56 automated tests

### Next Steps
- [ ] Deploy to Base mainnet
- [ ] Add transaction database
- [ ] Implement Redis sessions
- [ ] KYC/AML compliance
- [ ] Admin dashboard
- [ ] Mobile app

### Future
- [ ] Multi-chain support
- [ ] Additional payment methods
- [ ] More African countries
- [ ] Fiat off-ramps
- [ ] Merchant API

---

**Built with ❤️ for Africa**

*Bridging traditional finance and DeFi, one transaction at a time.*
