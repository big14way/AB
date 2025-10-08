# AfriBridge Backend API

Express.js backend for WhatsApp-based stablecoin remittance on Base blockchain.

## Architecture

```
backend/
├── server.js                    # Main Express server
├── middleware/
│   └── twilioAuth.js           # Twilio webhook signature validation
├── services/
│   ├── flutterwaveService.js   # Flutterwave payment integration
│   ├── circleService.js        # Circle USDC operations
│   └── bridgeService.js        # Bridge contract interactions
└── utils/
    ├── messageParser.js        # WhatsApp message parsing
    └── sessionStore.js         # In-memory session management
```

## API Endpoints

### Health Check
```
GET /health
Response: { status: 'ok', timestamp: '...', uptime: 123.45 }
```

### WhatsApp Webhook
```
POST /webhook/whatsapp
Headers: x-twilio-signature (validated in production)
Body: Twilio webhook payload
```

**Message Format:**
- `Send 1000 KES to +254712345678`
- `Transfer 5000 NGN to +2348012345678`

**Flow:**
1. Parse remittance request from WhatsApp message
2. Create Flutterwave payment link
3. Poll for payment confirmation
4. Convert fiat to USDC
5. Deposit to Bridge contract
6. Send confirmation via WhatsApp

### Flutterwave Webhook
```
POST /webhook/flutterwave
Headers: verif-hash (webhook signature)
Body: Flutterwave webhook payload
```

### Status Check
```
GET /status/:phone
Response: Current transaction status for phone number
```

### Bridge Balance
```
GET /bridge/balance
Response: USDC balance in Bridge contract
```

## Services

### FlutterwaveService

**createPayment(amount, currency, phone, email, txRef)**
- Creates mobile money payment link
- Supports: KES, NGN, GHS, UGX, RWF
- Returns: { paymentLink, chargeId, txRef, status }

**verifyTransaction(transactionId)**
- Verifies payment status with Flutterwave
- Returns: { success, amount, currency, status }

**pollCharge(chargeId, maxAttempts=10, intervalMs=3000)**
- Polls payment status until success/failure
- 3-second intervals, 10 max attempts (30s total)
- Returns: verification result on success

### CircleService

**issueUSDC(amount, destinationAddress)**
- Issues USDC to destination address via Circle API
- Uses sandbox environment
- Returns: { success, transferId, status, amount }

**getTransferStatus(transferId)**
- Checks Circle transfer status
- Returns: { success, status, transferId }

**getWalletBalance()**
- Fetches Circle wallet balances
- Returns: { success, balances }

### BridgeService

**depositToBridge(amount, toAddress, fiatRef)**
- Deposits USDC to Bridge contract via ethers.js
- Gas estimation with 20% buffer
- Returns: { success, txHash, blockNumber, gasUsed }

**approveUSDC(amount)**
- Approves USDC spending for Bridge contract
- Checks existing allowance first
- Returns: { success, txHash }

**getContractBalance()**
- Gets Bridge contract USDC balance
- Returns: { success, balance, balanceWei }

## Session Management

In-memory session store (use Redis in production):
- Tracks user transaction state
- Automatic cleanup every 5 minutes
- 1-hour session expiry

**Session States:**
- `pending_payment` - Payment link created
- `awaiting_payment` - Waiting for confirmation
- `payment_confirmed` - Payment received
- `completed` - Transfer successful
- `failed` - Transfer failed

## Security

### Rate Limiting
- 100 requests per 15 minutes per IP on webhook endpoints

### Twilio Signature Validation
- Validates all WhatsApp webhook requests in production
- Skipped in development mode (NODE_ENV=development)

### Error Handling
- Comprehensive try-catch blocks
- User-friendly WhatsApp error messages
- Detailed server logging

## Currency Conversion

Mock conversion rates (use real exchange rate API in production):
- KES → USDC: 0.0077
- NGN → USDC: 0.0013
- GHS → USDC: 0.085
- UGX → USDC: 0.00027
- RWF → USDC: 0.00082

## Environment Variables

Required variables in `.env`:

```bash
# Server
NODE_ENV=development
PORT=3000

# Blockchain
ETHEREUM_PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
USDC_ADDRESS_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BRIDGE_CONTRACT_ADDRESS=0x...

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_SECRET_HASH=webhook_hash

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Circle
CIRCLE_API_KEY=TEST_API_KEY:...
CIRCLE_WALLET_ID=...

# Defaults
DEFAULT_RECIPIENT_ADDRESS=0x...
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test WhatsApp Message Parsing
Send POST to `/webhook/whatsapp` with Twilio format:
```json
{
  "From": "whatsapp:+254712345678",
  "Body": "Send 1000 KES to +254798765432"
}
```

## Logging

All services use console.log with prefixes:
- `[Server]` - Main server events
- `[Webhook]` - Webhook processing
- `[WhatsApp]` - Twilio/WhatsApp operations
- `[Flutterwave]` - Payment operations
- `[Circle]` - USDC operations
- `[Bridge]` - Blockchain transactions
- `[SessionStore]` - Session management

## Production Considerations

1. **Replace in-memory session store with Redis**
2. **Use real exchange rate API** (e.g., CoinGecko, CryptoCompare)
3. **Implement refund logic** for failed transactions
4. **Add transaction database** (PostgreSQL/MongoDB)
5. **Set up monitoring** (Sentry, DataDog)
6. **Configure HTTPS** for webhooks
7. **Add user authentication** for status endpoints
8. **Implement proper recipient address mapping** (phone → wallet)
9. **Add transaction limits** and KYC checks
10. **Set up backup RPC endpoints**

## Error Recovery

### Payment Failed
- Flutterwave refund via API
- Notify user via WhatsApp
- Store failed transaction for manual review

### Blockchain Transaction Failed
- Retry with higher gas
- Refund via Flutterwave if retries exhausted
- Log for manual intervention

### Circle Transfer Failed
- Retry transfer
- Notify admin
- Hold funds in Bridge contract for manual release

## Testing

Mock mode automatically enabled when:
- Twilio credentials invalid/missing → Mock WhatsApp messages
- Circle/Flutterwave in test mode → Use sandbox APIs
- Development environment → Skip signature validation

## Support

For transaction failures, users receive a unique `txRef` like:
```
AFRIB-1234567890-abc123def
```

Use this to look up transaction in session store and blockchain explorers.
