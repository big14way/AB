# ⚡ AfriBridge - Quick Start for Judges

**Test the WhatsApp bot in 2 minutes!**

---

## 📱 Fastest Way to Test

### Step 1: Join WhatsApp Sandbox (30 seconds)

1. **Open WhatsApp** on your phone
2. **Message**: `+1 415 523 8886`
3. **Send**: `join [SANDBOX_CODE]` ← (Get code from judges@afribridge or check Twilio console)
4. **Wait**: You'll get a welcome confirmation

### Step 2: Start a Remittance (60 seconds)

```
You: send
Bot: [Asks for amount]

You: 1000 KES
Bot: [Asks for recipient]

You: +254712345678
Bot: [Shows summary, asks for confirmation]

You: confirm
Bot: [Creates payment link]
```

### Step 3: View on Blockchain (30 seconds)

- Bot will send you a BaseScan link
- Click to view transaction on Base Sepolia
- See USDC transfer, gas used, timestamp

**Done! ✅**

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| **Live API** | https://afribridge-8np4.onrender.com/health |
| **Smart Contract** | [View on BaseScan](https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88) |
| **GitHub** | https://github.com/big14way/AB |
| **Full Demo Guide** | See DEMO.md |
| **Video Demo** | [Coming soon] |

---

## 🎯 What to Look For

### ✅ Innovation
- WhatsApp-first UX (no app needed)
- Hybrid wallets (email + mobile)
- Bridge TradFi (M-Pesa) to DeFi (USDC)

### ✅ Technical
- Smart contract on Base Sepolia
- 56 automated tests
- Gas-optimized (~62k gas)
- Security best practices

### ✅ User Experience
- 7-state conversation flow
- Clear error messages
- Multi-currency support (5 currencies)
- Fast response times

### ✅ Real-World Impact
- Reduces remittance costs
- Instant transfers (vs 1-3 days)
- Accessible via WhatsApp (2B+ users)
- Focus on Africa

---

## 🧪 Test Commands

### Basic Commands
- `send` - Start new remittance
- `help` - Show help message
- `cancel` - Cancel current transaction

### Quick Send (Advanced)
- `send 1000 KES to +254712345678`
- `send 5000 NGN to +2348012345678`

### Supported Currencies
- **KES** - Kenyan Shilling
- **NGN** - Nigerian Naira
- **GHS** - Ghanaian Cedi
- **UGX** - Ugandan Shilling
- **RWF** - Rwandan Franc

---

## 💻 API Testing (Optional)

### Check Health
```bash
curl https://afribridge-8np4.onrender.com/health
```

### Check Contract Balance
```bash
curl https://afribridge-8np4.onrender.com/bridge/balance
```

---

## 🐛 Troubleshooting

**Bot not responding?**
- Check if you joined sandbox (`join [code]`)
- Wait 10 seconds (server cold start)
- Try `help` command

**Payment fails?**
- Use test card: 5531886652142950
- CVV: 564, Expiry: 09/32, PIN: 3310

**Questions?**
- Open GitHub issue
- Check DEMO.md for detailed guide

---

## 📊 Project Highlights

- **7,100+** lines of code
- **56** automated tests
- **10** REST API endpoints
- **5** supported currencies
- **1** smart contract (verified on BaseScan)
- **~62k** gas per transaction

---

## 🏆 Why AfriBridge Wins

1. **Novel Use Case**: First WhatsApp remittance on Base
2. **Technical Excellence**: Clean code, comprehensive tests
3. **Real Impact**: Solves actual problem (expensive remittances)
4. **Production Ready**: Deployed, tested, documented

---

**Questions? Check DEMO.md for full guide** 📖

**Built with ❤️ for Africa on Base** 🌍
