# AfriBridge WhatsApp Bot Flow

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AfriBridge Bot States                        │
└─────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   WELCOME   │
                              │             │
                              │ Entry Point │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              "help"/"hi"     "send [amt]..."    "send"/"transfer"
                    │                │                │
                    ↓                ↓                ↓
              ┌──────────┐     ┌──────────┐    ┌──────────┐
              │ WELCOME  │────→│ CONFIRM  │    │  AMOUNT  │
              │ (repeat) │     │          │    │          │
              └──────────┘     └────┬─────┘    └────┬─────┘
                                    │               │
                                    │         "1000 KES"
                                    │               │
                                    │               ↓
                                    │          ┌──────────┐
                                    │          │RECIPIENT │
                                    │          │          │
                                    │          └────┬─────┘
                                    │               │
                                    │        "+254712..."
                                    │               │
                                    │               ↓
                               "confirm"      ┌──────────┐
                                    ├─────────│ CONFIRM  │
                                    │         │          │
                                    ↓         └────┬─────┘
                              ┌──────────┐        │
                              │   PAY    │←───────┘
                              │          │     "confirm"
                              └────┬─────┘
                                   │
                        Payment Link Sent
                                   │
                              User Pays
                                   │
                            ┌──────┴──────┐
                            │             │
                   Flutterwave Webhook   "paid"
                            │             │
                            └──────┬──────┘
                                   │
                                   ↓
                            ┌─────────────┐
                            │ PROCESSING  │
                            │             │
                            │ • Convert   │
                            │ • Bridge    │
                            │ • Confirm   │
                            └──────┬──────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                   Success                 Error
                        │                     │
                        ↓                     ↓
                  ┌──────────┐          ┌──────────┐
                  │ SUCCESS  │          │  ERROR   │
                  │          │          │          │
                  │ + TxHash │          │ + Refund │
                  │ + Name   │          │ + Support│
                  └──────────┘          └──────────┘
                        │                     │
                        └─────────┬───────────┘
                                  │
                            User can restart
                                  │
                                  ↓
                            ┌──────────┐
                            │ WELCOME  │
                            └──────────┘
```

## State Details

### 🟢 WELCOME
**Entry State** - User first interaction

**Accepts:**
- `hi` / `hello` / `start` → Show welcome message
- `help` → Show help message
- `send 1000 KES to +254...` → Quick send (→ CONFIRM)
- `send` / `transfer` → Step-by-step (→ AMOUNT)

**Response:**
```
🌍 Welcome to AfriBridge!

Send money across Africa using USDC on Base blockchain.

📱 Quick Send:
Send [amount] [currency] to [phone]
Example: "Send 1000 KES to +254712345678"

🔄 Step by Step:
Reply with "send" to start

💰 Supported: KES, NGN, GHS, UGX, RWF
```

---

### 💰 AMOUNT
**Step 1** - Collect amount and currency

**Accepts:**
- `1000 KES` / `5000 NGN` → Parse and continue (→ RECIPIENT)
- Invalid format → Retry with error

**Response:**
```
✅ Amount: 1000 KES (~7.7 USDC)

📱 Enter recipient's phone number:
Include country code (e.g., +254712345678)
```

---

### 📱 RECIPIENT
**Step 2** - Collect recipient phone

**Accepts:**
- `+254712345678` → Valid phone (→ CONFIRM)
- Invalid phone → Retry with error

**Response:**
```
✅ Transfer Summary

💰 Amount: 1000 KES (~7.7 USDC)
📱 To: +254712345678
🔗 Network: Base Sepolia

Reply "confirm" to proceed or "cancel" to abort.
```

---

### ✅ CONFIRM
**Step 3** - Confirm transaction details

**Accepts:**
- `confirm` / `yes` → Create payment (→ PAY)
- `cancel` / `abort` → Cancel and reset (→ WELCOME)
- Other → Retry confirmation

**Action:** Create Flutterwave payment link

**Response:**
```
💳 Complete Payment

https://flutterwave.com/pay/...

⏱️ Waiting for payment confirmation...

Once paid, reply "paid" to check status.
```

---

### 💳 PAY
**Step 4** - Waiting for payment

**Accepts:**
- `paid` / `done` → Check payment status
- `cancel` → Cancel transaction (→ WELCOME)
- Other → Remind to pay

**Background:**
- Flutterwave webhook → Auto-trigger on payment
- Auto-reminder after 30 seconds

**Response (waiting):**
```
⏱️ Waiting for payment...

Complete the payment and reply "paid" when done.
```

---

### ⏳ PROCESSING
**Step 5** - Transaction processing

**Actions:**
1. Convert fiat to USDC
2. Deposit to Bridge contract
3. Wait for blockchain confirmation

**Response:**
```
✅ Payment Confirmed!

💱 Converting 1000 KES → 7.7 USDC...

🔗 Depositing to blockchain...
```

**User Action:** None (automated)

---

### 🎉 SUCCESS
**Final State** - Transaction complete

**Response:**
```
🎉 Transfer Complete!

✅ 7.7 USDC sent to +254712345678

🔗 Transaction: 0xabcdef...12345678
👤 Recipient: 0x742d...bEb0.base.eth
⛽ Gas Used: 62123

🌐 View on BaseScan:
https://sepolia.basescan.org/tx/0xabcdef...

Thank you for using AfriBridge! 🌍
```

**Session:** Stored for history, user can start new transfer

---

### ❌ ERROR
**Error State** - Transaction failed

**Triggers:**
- Payment failed
- Blockchain transaction failed
- Service unavailable

**Response:**
```
❌ Transfer Failed

Payment received but blockchain transfer failed.

Reference: AFRIB-1234567890-abc123
Error: Insufficient gas

Please contact support for a refund.
```

**User Action:** Contact support or retry

---

## Quick Send Flow

User can bypass AMOUNT and RECIPIENT states:

```
User: "Send 1000 KES to +254712345678"
  ↓
Bot: Parses → amount=1000, currency=KES, phone=+254...
  ↓
State: WELCOME → CONFIRM (skip AMOUNT & RECIPIENT)
  ↓
Bot: Shows summary, requests confirmation
```

## Message Parsing

### Quick Send Format
```regex
/send\s+(\d+(?:\.\d+)?)\s*([a-z]{3})\s+to\s+(\+?\d+)/i
```

**Examples:**
- ✅ `Send 1000 KES to +254712345678`
- ✅ `send 5000 NGN to +2348012345678`
- ✅ `Transfer 100 GHS to +233201234567`
- ✅ `1000 KES to +254712345678`

### Amount Format
```regex
/(\d+(?:\.\d+)?)\s*([a-z]{3})/i
```

**Examples:**
- ✅ `1000 KES`
- ✅ `5000.50 NGN`
- ✅ `100GHS`

### Phone Format
```regex
/\+?\d{10,15}/
```

**Examples:**
- ✅ `+254712345678`
- ✅ `254712345678`
- ✅ `+2348012345678`

## Session Management

### Session Structure
```javascript
{
  state: 'CONFIRM',
  amount: 1000,
  currency: 'KES',
  usdcAmount: '7.7',
  recipientPhone: '+254712345678',
  txRef: 'AFRIB-1234567890-abc123',
  chargeId: 'flw_charge_123',
  paymentLink: 'https://...',
  paymentResult: { ... },
  bridgeResult: { txHash: '0x...', gasUsed: '62123' },
  startedAt: 1234567890,
  completedAt: 1234567900,
  updatedAt: 1234567890
}
```

### Session Storage
- **Engine:** In-memory (development) / Redis (production)
- **Key:** `whatsapp:{phone}` (e.g., `whatsapp:+254712345678`)
- **TTL:** 1 hour (auto-cleanup every 5 minutes)

## Error Handling

### User Errors (Recoverable)
- Invalid format → Retry with hint
- Unsupported currency → Show supported list
- Invalid phone → Retry with example

### System Errors (Unrecoverable)
- Payment API down → Error state + retry
- Blockchain failure → Error state + refund
- Network timeout → Error state + support

## Supported Currencies

| Currency | Rate to USDC | Example |
|----------|--------------|---------|
| KES | 0.0077 | 1000 KES = 7.7 USDC |
| NGN | 0.0013 | 5000 NGN = 6.5 USDC |
| GHS | 0.085 | 100 GHS = 8.5 USDC |
| UGX | 0.00027 | 10000 UGX = 2.7 USDC |
| RWF | 0.00082 | 5000 RWF = 4.1 USDC |

## Basename Resolution (Mock)

For buildathon MVP, we mock Basename resolution:

```javascript
// Mock implementation
address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
  ↓
basename: 0x742d...bEb0.base.eth
```

**Production:** Integrate real Basename API for reverse lookups

## State Transitions Summary

| Current State | User Input | Next State | Action |
|--------------|------------|------------|---------|
| WELCOME | `help` | WELCOME | Show help |
| WELCOME | `send 100 KES to +254...` | CONFIRM | Parse & confirm |
| WELCOME | `send` | AMOUNT | Request amount |
| AMOUNT | `1000 KES` | RECIPIENT | Save amount |
| RECIPIENT | `+254...` | CONFIRM | Save phone |
| CONFIRM | `confirm` | PAY | Create payment |
| CONFIRM | `cancel` | WELCOME | Reset |
| PAY | `paid` | PROCESSING | Verify payment |
| PAY | (webhook) | PROCESSING | Auto-verify |
| PROCESSING | (success) | SUCCESS | Complete |
| PROCESSING | (failure) | ERROR | Refund |
| SUCCESS | `send` | AMOUNT | New transfer |
| ERROR | `help` | WELCOME | Restart |

## API Integration Points

### 1. Flutterwave
- **createPayment()** → PAY state
- **verifyTransaction()** → PROCESSING state
- **Webhook** → Auto-trigger from PAY → PROCESSING

### 2. Bridge Contract
- **depositToBridge()** → PROCESSING state
- **Returns:** txHash, gasUsed, blockNumber

### 3. Basename (Mock)
- **resolveBasename()** → SUCCESS state
- **Returns:** formatted .base.eth name

## Testing States

See [TEST_PAYLOADS.md](TEST_PAYLOADS.md) for example messages for each state.
