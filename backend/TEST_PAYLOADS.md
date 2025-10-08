# AfriBridge Bot Test Payloads

Test payloads for each bot state and scenario.

## Environment Setup

```bash
# Start server
npm start

# Or in development mode
npm run dev
```

## Test 1: Welcome State - Help Command

**State:** WELCOME

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=help"
```

**Expected Response (WhatsApp):**
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

## Test 2: Quick Send - Direct Transaction

**State:** WELCOME → CONFIRM

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=Send 1000 KES to +254798765432"
```

**Expected Response:**
```
✅ Transfer Summary

💰 Amount: 1000 KES (~7.7 USDC)
📱 To: +254798765432
🔗 Network: Base Sepolia

Reply "confirm" to proceed or "cancel" to abort.
```

---

## Test 3: Step-by-Step - Start Send

**State:** WELCOME → AMOUNT

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=send"
```

**Expected Response:**
```
💰 How much would you like to send?

Enter amount and currency:
Example: "1000 KES" or "5000 NGN"

Supported: KES, NGN, GHS, UGX, RWF
```

---

## Test 4: Amount Input

**State:** AMOUNT → RECIPIENT

**Prerequisite:** Run Test 3 first

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=1000 KES"
```

**Expected Response:**
```
✅ Amount: 1000 KES (~7.7 USDC)

📱 Enter recipient's phone number:
Include country code (e.g., +254712345678)
```

---

## Test 5: Recipient Input

**State:** RECIPIENT → CONFIRM

**Prerequisite:** Run Tests 3 & 4 first

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=+254798765432"
```

**Expected Response:**
```
✅ Transfer Summary

💰 Amount: 1000 KES (~7.7 USDC)
📱 To: +254798765432
🔗 Network: Base Sepolia

Reply "confirm" to proceed or "cancel" to abort.
```

---

## Test 6: Confirm Transaction

**State:** CONFIRM → PAY

**Prerequisite:** Have session in CONFIRM state

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=confirm"
```

**Expected Response:**
```
✅ Creating payment link...

Please wait...

[Then:]

💳 Complete Payment

https://flutterwave.com/pay/...

⏱️ Waiting for payment confirmation...

Once paid, reply "paid" to check status.
```

---

## Test 7: Cancel Transaction

**State:** CONFIRM → WELCOME

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=cancel"
```

**Expected Response:**
```
❌ Transfer cancelled.

Send "help" to start over.
```

---

## Test 8: Payment Verification (Manual)

**State:** PAY → PROCESSING

**Prerequisite:** Have session in PAY state with chargeId

**Request:**
```bash
curl -X POST http://localhost:3000/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254712345678",
    "chargeId": "flw_charge_123456"
  }'
```

**Expected Response (API):**
```json
{
  "status": "success",
  "result": {
    "success": true,
    "amount": 1000,
    "currency": "KES",
    "status": "successful"
  }
}
```

**Expected WhatsApp Messages:**
```
✅ Payment Confirmed!

💱 Converting 1000 KES → 7.7 USDC...

🔗 Depositing to blockchain...

[Then:]

🎉 Transfer Complete!

✅ 7.7 USDC sent to +254798765432

🔗 Transaction: 0xabcdef...12345678
👤 Recipient: 0x742d...bEb0.base.eth
⛽ Gas Used: 62123

🌐 View on BaseScan:
https://sepolia.basescan.org/tx/0xabcdef...

Thank you for using AfriBridge! 🌍
```

---

## Test 9: Flutterwave Webhook (Payment Success)

**State:** PAY → PROCESSING → SUCCESS

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: your_secret_hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 123456,
      "tx_ref": "AFRIB-1234567890-abc123",
      "amount": 1000,
      "currency": "KES",
      "status": "successful",
      "customer": {
        "phone_number": "+254712345678"
      }
    }
  }'
```

**Expected Response (API):**
```json
{
  "status": "received"
}
```

**Expected WhatsApp:** See Test 8 messages

---

## Test 10: Check Session Status

**State:** Any

**Request:**
```bash
curl http://localhost:3000/status/+254712345678
```

**Expected Response:**
```json
{
  "state": "CONFIRM",
  "amount": 1000,
  "currency": "KES",
  "usdcAmount": "7.7",
  "recipientPhone": "+254798765432",
  "txRef": "AFRIB-1234567890-abc123",
  "paymentLink": "https://flutterwave.com/pay/...",
  "txHash": null,
  "updatedAt": 1234567890
}
```

---

## Test 11: Error - Invalid Currency

**State:** WELCOME → WELCOME (retry)

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=Send 1000 USD to +254798765432"
```

**Expected Response:**
```
❌ Currency not supported: USD

We support: KES, NGN, GHS, UGX, RWF
```

---

## Test 12: Error - Invalid Amount Format

**State:** AMOUNT → AMOUNT (retry)

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=one thousand KES"
```

**Expected Response:**
```
❌ Invalid format.

Please enter amount and currency:
Example: "1000 KES"
```

---

## Test 13: Error - Invalid Phone Format

**State:** RECIPIENT → RECIPIENT (retry)

**Request:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+254712345678" \
  -d "Body=0712345678"
```

**Expected Response:**
```
❌ Invalid phone number.

Please enter a valid phone with country code:
Example: +254712345678
```

---

## Test 14: Multiple Currencies

### Test 14a: NGN (Nigeria)
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+2348012345678" \
  -d "Body=Send 5000 NGN to +2348098765432"
```

**Expected:** 5000 NGN = 6.5 USDC

### Test 14b: GHS (Ghana)
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+233201234567" \
  -d "Body=Send 100 GHS to +233209876543"
```

**Expected:** 100 GHS = 8.5 USDC

### Test 14c: UGX (Uganda)
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+256701234567" \
  -d "Body=Send 10000 UGX to +256709876543"
```

**Expected:** 10000 UGX = 2.7 USDC

### Test 14d: RWF (Rwanda)
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+250781234567" \
  -d "Body=Send 5000 RWF to +250789876543"
```

**Expected:** 5000 RWF = 4.1 USDC

---

## Test Sequence: Full Flow

Run tests in order to complete full transaction:

```bash
# 1. Welcome
curl -X POST http://localhost:3000/webhook/whatsapp \
  -d "From=whatsapp:+254712345678" \
  -d "Body=help"

# 2. Quick Send
curl -X POST http://localhost:3000/webhook/whatsapp \
  -d "From=whatsapp:+254712345678" \
  -d "Body=Send 1000 KES to +254798765432"

# 3. Confirm
curl -X POST http://localhost:3000/webhook/whatsapp \
  -d "From=whatsapp:+254712345678" \
  -d "Body=confirm"

# 4. Check Status
curl http://localhost:3000/status/+254712345678

# 5. Simulate Payment (Manual)
# Get chargeId from status response, then:
curl -X POST http://localhost:3000/payment/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+254712345678", "chargeId": "CHARGE_ID_HERE"}'
```

---

## Development Testing

### Mock Mode (No Real APIs)

Set in `.env`:
```bash
NODE_ENV=development
TWILIO_ACCOUNT_SID=test_account_sid
CIRCLE_API_KEY=test_api_key
```

All messages will be logged to console instead of sent to WhatsApp.

### Check Logs

```bash
tail -f server.log
```

Look for:
- `[Webhook]` - Incoming messages
- `[BotHandler]` - State transitions
- `[WhatsApp]` - Outgoing messages
- `[Flutterwave]` - Payment operations
- `[Bridge]` - Blockchain transactions

---

## Postman Collection

Import this collection for easier testing:

```json
{
  "info": {
    "name": "AfriBridge Bot Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Welcome - Help",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/webhook/whatsapp",
        "body": {
          "mode": "urlencoded",
          "urlencoded": [
            {"key": "From", "value": "whatsapp:+254712345678"},
            {"key": "Body", "value": "help"}
          ]
        }
      }
    },
    {
      "name": "Quick Send",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/webhook/whatsapp",
        "body": {
          "mode": "urlencoded",
          "urlencoded": [
            {"key": "From", "value": "whatsapp:+254712345678"},
            {"key": "Body", "value": "Send 1000 KES to +254798765432"}
          ]
        }
      }
    },
    {
      "name": "Check Status",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/status/+254712345678"
      }
    }
  ]
}
```

Save to `afribridge-tests.postman_collection.json` and import to Postman.
