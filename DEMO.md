# 🎯 AfriBridge - Demo Guide for Judges/Reviewers

**WhatsApp-based Stablecoin Remittance on Base Blockchain**

This guide helps judges and reviewers test and evaluate the AfriBridge project.

---

## 🚀 Quick Links

- **Live Backend API**: https://afribridge-8np4.onrender.com
- **Smart Contract**: [0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88](https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88)
- **GitHub Repository**: https://github.com/big14way/AB
- **Network**: Base Sepolia Testnet (Chain ID: 84532)

---

## 📱 Option 1: Test WhatsApp Bot (Recommended)

### Prerequisites
- WhatsApp installed on your phone
- Access to WhatsApp number: **+1 415 523 8886**

### Step 1: Join Twilio Sandbox

1. **Open WhatsApp** on your phone
2. **Send a message to**: +1 415 523 8886
3. **Message content**: `join <sandbox-code>` (sandbox code will be provided)
4. **Wait for confirmation**: You'll receive a welcome message

### Step 2: Test Remittance Flow

#### 2.1 Start Transaction
```
You: send
Bot: 💰 How much would you like to send?
     Supported: KES, NGN, GHS, UGX, RWF
```

#### 2.2 Enter Amount
```
You: 1000 KES
Bot: ✅ Amount: 1000 KES (~7.7 USDC)
     📱 Enter recipient's phone number:
     Include country code (e.g., +254712345678)
```

#### 2.3 Enter Recipient
```
You: +254712345678
Bot: ✅ Transfer Summary
     💰 Amount: 1000 KES (~7.7 USDC)
     📱 To: +254712345678
     🔗 Network: Base Sepolia
     
     Reply "confirm" to proceed or "cancel" to abort.
```

#### 2.4 Confirm Transaction
```
You: confirm
Bot: 💳 Complete Payment
     [Payment Link]
     
     ⏱️ Waiting for payment confirmation...
```

#### 2.5 Complete Payment
- Click the payment link
- Complete payment via test card/mobile money
- Reply "paid" to check status

```
You: paid
Bot: 🎉 Transfer Complete!
     ✅ 7.7 USDC sent to +254712345678
     🔗 Transaction: [TX Hash]
     👤 Recipient: [Address]
     
     View on BaseScan: [Link]
```

### Alternative Commands
- `help` - Show help message
- `cancel` - Cancel current transaction
- Quick send: `send 1000 KES to +254712345678`

---

## 💻 Option 2: Test via API (For Technical Reviewers)

### Health Check
```bash
curl https://afribridge-8np4.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T15:00:00.000Z",
  "uptime": 123.456
}
```

### Test Webhook (Simulate WhatsApp Message)
```bash
curl -X POST https://afribridge-8np4.onrender.com/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=help&MessageSid=TEST123"
```

### Check Bridge Contract Balance
```bash
curl https://afribridge-8np4.onrender.com/bridge/balance
```

**Expected Response:**
```json
{
  "balance": "100.00",
  "decimals": 6,
  "symbol": "USDC"
}
```

### Check Session Status
```bash
curl https://afribridge-8np4.onrender.com/status/whatsapp:+1234567890
```

---

## 🔗 Option 3: Frontend Testing (If Deployed)

### Connect Wallet

**Option A: Email Wallet (Coinbase Smart Wallet)**
1. Visit frontend URL
2. Click "Connect Wallet"
3. Select "Coinbase Smart Wallet"
4. Enter your email
5. Complete verification

**Option B: Mobile Wallet (WalletConnect)**
1. Visit frontend URL
2. Click "Connect Wallet"
3. Select "WalletConnect"
4. Scan QR code with MetaMask/Trust Wallet
5. Approve connection

### Test Deposit
1. Switch to Base Sepolia network
2. Get test USDC from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
3. Enter recipient address
4. Enter amount (e.g., 10 USDC)
5. Click "Deposit"
6. Approve transaction in wallet
7. View transaction on BaseScan

---

## 🧪 Option 4: Smart Contract Interaction

### Using BaseScan

1. **Visit Contract**: https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88#writeContract

2. **Connect Wallet** (MetaMask on Base Sepolia)

3. **Test `depositUSDC` Function**:
   - `_usdcAmount`: 1000000 (1 USDC, 6 decimals)
   - `_recipient`: Your wallet address
   - `_metadata`: "Test deposit"

4. **View Transaction**:
   - Check the transaction hash
   - Verify in "Events" tab
   - See USDC transfer

### Using Cast (CLI)

```bash
# Check contract balance
cast call 0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88 \
  "getContractBalance()(uint256)" \
  --rpc-url https://sepolia.base.org

# Check contract version
cast call 0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88 \
  "VERSION()(string)" \
  --rpc-url https://sepolia.base.org
```

---

## 📊 Key Metrics to Evaluate

### ✅ Functionality
- [ ] WhatsApp bot responds to messages
- [ ] Bot handles conversation flow (7 states)
- [ ] Payment link generation works
- [ ] Smart contract deposits USDC
- [ ] Transaction appears on BaseScan
- [ ] Frontend wallet connection works
- [ ] Multi-currency support (KES, NGN, GHS, UGX, RWF)

### ⚡ Performance
- [ ] Bot response time < 3 seconds
- [ ] API response time < 1 second
- [ ] Transaction confirmation < 30 seconds
- [ ] Gas cost < 100k per transaction

### 🔐 Security
- [ ] Non-custodial (users control keys)
- [ ] Access control implemented
- [ ] ReentrancyGuard protection
- [ ] Input validation
- [ ] Error handling

### 🎨 User Experience
- [ ] Clear bot instructions
- [ ] Helpful error messages
- [ ] Transaction tracking
- [ ] Mobile-responsive design
- [ ] Easy wallet connection

---

## 🎬 Demo Video

**[Link to demo video will be here]**

The video demonstrates:
1. Complete WhatsApp bot flow (0:00 - 2:30)
2. Payment process (2:30 - 4:00)
3. Blockchain transaction (4:00 - 5:30)
4. Frontend wallet connection (5:30 - 7:00)

---

## 🧪 Test Accounts & Data

### Test Phone Numbers
- Sender: +1234567890 (use your own number)
- Recipient: +254712345678 (test recipient)

### Test Wallet Addresses
- Test Recipient: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0`

### Test Amounts
- Small: 100 KES (~0.77 USDC)
- Medium: 1000 KES (~7.7 USDC)
- Large: 10000 KES (~77 USDC)

### Test Payment Cards (Flutterwave Sandbox)
```
Card Number: 5531886652142950
CVV: 564
Expiry: 09/32
PIN: 3310
OTP: 12345
```

---

## 🐛 Troubleshooting

### Bot Not Responding?
1. **Check if you joined sandbox**: Send `join <code>` first
2. **Verify webhook URL**: Should be set in Twilio console
3. **Check server status**: Visit `/health` endpoint
4. **Wait 10 seconds**: Server might be cold-starting

### Payment Link Fails?
1. **Check currency**: Only KES, NGN, GHS, UGX, RWF supported
2. **Use test cards**: Production cards won't work on testnet
3. **Try different amount**: Some amounts might have minimum limits

### Transaction Not Appearing?
1. **Check BaseScan**: https://sepolia.basescan.org
2. **Verify network**: Must be Base Sepolia (84532)
3. **Wait 30 seconds**: Blockchain confirmation time
4. **Check contract events**: View in "Events" tab

### Frontend Issues?
1. **Switch to Base Sepolia**: Check network in wallet
2. **Get test ETH**: Need gas for transactions
3. **Approve USDC**: Contract needs approval first
4. **Clear cache**: Hard refresh browser

---

## 📞 Contact & Support

### For Judges/Reviewers
- **Questions**: Open an issue on GitHub
- **Bugs**: Report with screenshots/logs
- **Feature requests**: Discussion section

### Project Links
- **GitHub**: https://github.com/big14way/AB
- **Smart Contract**: https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
- **Backend API**: https://afribridge-8np4.onrender.com
- **Documentation**: See README.md

---

## 🏆 What Makes AfriBridge Special

### Innovation
- ✨ WhatsApp-first UX (no app install needed)
- 🔗 Hybrid wallet support (email + mobile)
- 🌍 Bridge traditional finance (M-Pesa) to DeFi
- ⚡ Built on Base (low cost, high speed)

### Technical Excellence
- 🧪 56 automated tests (>90% coverage)
- 🔒 Security best practices (OpenZeppelin)
- 📱 7-state conversation flow
- 🎯 Gas-optimized contracts (~62k gas)

### Real-World Impact
- 💰 Reduces remittance costs (vs Western Union: 5-7%)
- ⏱️ Instant transfers (vs banks: 1-3 days)
- 📱 Accessible via WhatsApp (2B+ users)
- 🌍 Focus on African markets

---

## 📈 Project Statistics

- **Code**: ~7,100 lines
- **Tests**: 56 passing
- **Endpoints**: 10 REST APIs
- **Smart Contracts**: 1 (Bridge.sol)
- **Supported Currencies**: 5 (KES, NGN, GHS, UGX, RWF)
- **Deployment**: Base Sepolia + Render

---

## 🎯 Evaluation Criteria

### Base-Specific Features (40%)
- [x] Deployed on Base Sepolia
- [x] Uses Base RPC endpoints
- [x] Verified contract on BaseScan
- [x] Optimized for Base gas costs
- [x] Leverages Base speed/cost benefits

### Innovation (25%)
- [x] Novel use case (WhatsApp remittance)
- [x] Hybrid wallet integration
- [x] Bridge traditional + DeFi
- [x] User-friendly interface

### Technical Implementation (25%)
- [x] Clean, well-documented code
- [x] Comprehensive test coverage
- [x] Security best practices
- [x] Error handling
- [x] Scalable architecture

### User Experience (10%)
- [x] Intuitive bot conversation
- [x] Clear error messages
- [x] Mobile-friendly
- [x] Fast response times

---

**Thank you for reviewing AfriBridge! 🌍**

*Built with ❤️ to bridge Africa to DeFi*
