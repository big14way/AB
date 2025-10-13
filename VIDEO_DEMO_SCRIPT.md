# 🎬 AfriBridge - Video Demo Script

**Duration**: 5-7 minutes  
**Goal**: Show complete end-to-end remittance flow

---

## 🎯 Demo Flow Overview

1. **Introduction** (30s)
2. **WhatsApp Bot Demo** (3 mins)
3. **Smart Contract Interaction** (2 mins)
4. **Frontend Wallet Demo** (1.5 mins)
5. **Conclusion** (30s)

---

## 📝 Script

### Scene 1: Introduction (0:00 - 0:30)

**[Screen: Show AfriBridge logo/homepage]**

> "Hi! I'm demonstrating AfriBridge - a WhatsApp-based stablecoin remittance platform built on Base blockchain.
>
> AfriBridge allows users to send money from African mobile money services like M-Pesa directly to USDC on Base, all through a simple WhatsApp conversation.
>
> Let's see it in action."

---

### Scene 2: WhatsApp Bot Demo (0:30 - 3:30)

#### 2.1 Opening WhatsApp (0:30 - 0:45)

**[Screen: Show WhatsApp on phone]**

> "First, I'll open WhatsApp and message our bot at +1 415 523 8886. This is a Twilio sandbox number for testing."

**[Action: Show sending "send" message]**

#### 2.2 Enter Amount (0:45 - 1:15)

**[Screen: Show bot response]**

> "The bot immediately responds asking for the amount. I'll send 1000 KES - that's Kenyan Shillings.
>
> Notice how the bot automatically converts this to USDC at current rates - about 7.7 USDC."

**[Action: Type "1000 KES"]**

**[Screen: Show bot confirming amount and asking for recipient]**

#### 2.3 Enter Recipient (1:15 - 1:45)

> "Now I need to provide the recipient's phone number. I'll use a test number with the country code."

**[Action: Type "+254712345678"]**

**[Screen: Show transaction summary]**

> "Perfect! The bot shows me a complete summary:
> - 1000 KES converting to 7.7 USDC
> - Recipient phone number
> - Network: Base Sepolia testnet
>
> I'll confirm this transaction."

**[Action: Type "confirm"]**

#### 2.4 Payment Link (1:45 - 2:30)

**[Screen: Show payment link message]**

> "The bot creates a Flutterwave payment link instantly. This is where users would pay via M-Pesa, bank card, or mobile money.
>
> Let me click this link to show the payment interface."

**[Action: Click payment link]**

**[Screen: Show Flutterwave payment page]**

> "Here you can see multiple payment options:
> - M-Pesa for Kenya
> - Card payment
> - Bank transfer
> - USSD
>
> For this demo, I'll use a test card."

**[Action: Fill in test card details and submit]**

#### 2.5 Transaction Complete (2:30 - 3:30)

**[Screen: Show payment success, go back to WhatsApp]**

> "Payment successful! Now I'll tell the bot I've paid."

**[Action: Type "paid"]**

**[Screen: Show bot processing message]**

> "The bot confirms payment received and is now:
> 1. Converting KES to USDC
> 2. Depositing to the Bridge contract on Base
> 3. Processing the blockchain transaction
>
> And... done!"

**[Screen: Show success message with transaction hash]**

> "The bot confirms:
> - 7.7 USDC sent successfully
> - Transaction hash
> - Recipient address
> - Link to view on BaseScan
>
> The entire process took about 30 seconds!"

---

### Scene 3: Smart Contract on BaseScan (3:30 - 5:30)

#### 3.1 View Transaction (3:30 - 4:15)

**[Screen: Click BaseScan link from bot]**

> "Let's verify this on-chain. Here's the transaction on Base Sepolia's block explorer."

**[Screen: Show transaction details on BaseScan]**

> "We can see:
> - Transaction hash
> - Block number and timestamp
> - Gas used: only 62,123 - very efficient!
> - From address: our Bridge contract
> - To address: recipient
> - USDC transfer event"

#### 3.2 View Contract (4:15 - 5:00)

**[Screen: Navigate to contract address]**

> "This is our Bridge contract at 0xC3a201...5Cf88. It's fully verified on BaseScan."

**[Screen: Show Contract tab]**

> "You can see:
> - Contract source code
> - All functions (depositUSDC, withdrawUSDC)
> - Access controls (ADMIN_ROLE, OPERATOR_ROLE)
> - Security features (ReentrancyGuard, Pausable)"

**[Screen: Show Read Contract]**

> "In the Read Contract section, we can check:
> - Contract balance
> - Version number
> - Admin addresses"

**[Screen: Show Events tab]**

> "And here in Events, we see all past deposits - complete transparency!"

---

### Scene 4: Frontend Wallet Demo (5:00 - 6:30)

#### 4.1 Connect Wallet (5:00 - 5:30)

**[Screen: Show frontend homepage]**

> "AfriBridge also has a web frontend with hybrid wallet support. Let me connect using Coinbase Smart Wallet."

**[Action: Click "Connect Wallet"]**

**[Screen: Show wallet options]**

> "Users can choose:
> - Coinbase Smart Wallet - login with just email, no app needed
> - WalletConnect - for MetaMask, Trust Wallet, etc."

**[Action: Select Coinbase, enter email]**

**[Screen: Show wallet connected]**

> "Connected! Notice I didn't need a browser extension or seed phrase - just my email."

#### 4.2 Make Deposit (5:30 - 6:15)

**[Screen: Show deposit interface]**

> "Now I can make a direct deposit to the Bridge contract. Let me send 10 USDC to a recipient address."

**[Action: Fill in form]**

> "I'll enter:
> - Recipient address
> - Amount: 10 USDC
> - Add some metadata for tracking"

**[Action: Click Deposit]**

**[Screen: Show wallet approval popup]**

> "The wallet asks for approval. I'll confirm."

**[Action: Approve transaction]**

**[Screen: Show transaction pending]**

> "Transaction submitted! On Base Sepolia, this confirms in just a few seconds."

**[Screen: Show success with TX hash]**

> "Done! Transaction confirmed. I can click here to view it on BaseScan."

---

### Scene 5: Conclusion (6:15 - 7:00)

**[Screen: Show project dashboard/stats]**

> "So that's AfriBridge - making blockchain remittances as easy as sending a WhatsApp message.
>
> Key features:
> - ✨ WhatsApp-first UX - no app needed
> - ⚡ Built on Base - fast and cheap
> - 🔗 Hybrid wallets - email or mobile
> - 💰 Multiple payment methods - M-Pesa, cards, USSD
> - 🌍 Focus on Africa - KES, NGN, GHS, UGX, RWF
>
> The project is fully open source with:
> - 56 automated tests
> - Verified smart contracts
> - Comprehensive documentation
> - Production-ready API
>
> All deployed on Base Sepolia testnet. Links in the description!
>
> Thanks for watching!"

**[Screen: Show final slide with links]**

```
🌍 AfriBridge
GitHub: github.com/big14way/AB
Contract: 0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
Base Sepolia: sepolia.basescan.org
Built with ❤️ for Africa
```

---

## 🎥 Recording Tips

### Setup
- **Screen Recorder**: OBS Studio, Loom, or QuickTime
- **Phone Recorder**: Use iOS/Android screen recording
- **Mic**: Clear audio is crucial
- **Background**: Clean, professional
- **Lighting**: Well-lit face

### Best Practices
1. **Practice run**: Do 2-3 practice takes
2. **Pace**: Speak slowly and clearly
3. **Pause**: Give 1-2 seconds between sections
4. **Show cursor**: Help viewers follow along
5. **Edit**: Cut out mistakes, add captions

### Phone Recording
- **Enable screen recording** in phone settings
- **Turn on "Show touches"** to highlight taps
- **Hold phone steady** or use a stand
- **Disable notifications** to avoid interruptions

### Editing Checklist
- [ ] Add intro/outro cards
- [ ] Add captions for key points
- [ ] Highlight important UI elements
- [ ] Add background music (low volume)
- [ ] Speed up waiting times (2x speed)
- [ ] Export in 1080p or higher

---

## 📊 B-Roll Footage Ideas

### While Showing Code
- Contract code scrolling
- Test output running
- API logs streaming

### While Explaining Features
- Map of Africa
- Mobile money statistics
- Remittance cost comparisons
- Base network animation

### Transition Shots
- Network diagrams
- Architecture flowcharts
- WhatsApp to blockchain animation

---

## 🎨 Graphics to Include

### Title Cards
```
[0:00] AfriBridge
       WhatsApp Remittance on Base

[0:30] Part 1: WhatsApp Bot Demo

[3:30] Part 2: Smart Contract Verification

[5:00] Part 3: Frontend Wallet Integration

[6:15] Conclusion
```

### Lower Thirds
- Transaction details (amount, gas, time)
- Wallet addresses (abbreviated)
- Contract functions being called
- Network status (Base Sepolia)

### Callouts
- Highlight bot responses
- Point out gas costs
- Show conversion rates
- Emphasize security features

---

## 📱 Social Media Cuts

### 60s TikTok/Reels Version
- [0-10s] Problem: Expensive remittances
- [10-30s] Solution: WhatsApp + blockchain
- [30-50s] Quick demo of bot conversation
- [50-60s] Results + call to action

### 30s Twitter Version
- [0-5s] Hook: "Send money via WhatsApp"
- [5-20s] Show bot conversation
- [20-28s] Show BaseScan confirmation
- [28-30s] Links + hashtags

---

## 🎯 Key Messages to Emphasize

1. **Simplicity**: "As easy as sending a text"
2. **Speed**: "Transaction confirmed in 30 seconds"
3. **Cost**: "Low fees thanks to Base L2"
4. **Innovation**: "First WhatsApp remittance on Base"
5. **Impact**: "Banking the unbanked in Africa"

---

## 📝 Video Description Template

```
AfriBridge - WhatsApp Stablecoin Remittance on Base Blockchain

Send money from M-Pesa to USDC on Base, all through WhatsApp! 🌍💰

In this demo, I show:
✅ Complete WhatsApp bot conversation flow
✅ Flutterwave payment integration
✅ Smart contract transaction on Base Sepolia
✅ Coinbase Smart Wallet (email-based)
✅ Full end-to-end remittance in 30 seconds

🔗 Links:
- GitHub: https://github.com/big14way/AB
- Smart Contract: https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
- Live API: https://afribridge-8np4.onrender.com
- Demo Guide: [Link to DEMO.md]

📊 Tech Stack:
- Solidity 0.8.20 + OpenZeppelin
- Base (Ethereum L2)
- Twilio (WhatsApp)
- Flutterwave (Payments)
- Coinbase Smart Wallet
- Next.js + Wagmi + WalletConnect

#Base #Blockchain #Web3 #Africa #Remittance #DeFi #WhatsApp
```

---

## ✅ Pre-Recording Checklist

- [ ] Backend service is running
- [ ] WhatsApp sandbox is active
- [ ] Test wallet has Base Sepolia ETH
- [ ] Test wallet has USDC for deposits
- [ ] Frontend is deployed and accessible
- [ ] Browser is in presentation mode
- [ ] Phone screen recording is enabled
- [ ] Notifications are disabled
- [ ] Test payment cards are ready
- [ ] BaseScan tabs are pre-loaded
- [ ] Recording software is tested
- [ ] Microphone is working
- [ ] Lighting is good
- [ ] Background is clean

---

## 🎬 Ready to Record!

Good luck with your demo video! 🌟

Remember: This is your chance to show judges the real-world impact and technical excellence of AfriBridge. Make it count!
