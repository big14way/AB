#!/bin/bash

# AfriBridge Payment Flow Test Script
# This script tests the complete payment flow without needing to actually pay

set -e

PHONE="+2348054030374"
RECIPIENT="+2348098765432"
AMOUNT="1000"
CURRENCY="NGN"

echo "🧪 Starting AfriBridge Payment Flow Test"
echo "=========================================="
echo ""

# Step 1: Send quick send command
echo "📱 Step 1: Sending quick send command..."
curl -s -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=whatsapp:${PHONE}" \
  --data-urlencode "Body=Send ${AMOUNT} ${CURRENCY} to ${RECIPIENT}" > /dev/null

sleep 2

# Step 2: Check session status
echo "📊 Step 2: Checking session status..."
SESSION=$(curl -s http://localhost:3000/status/${PHONE})
echo "$SESSION" | python3 -m json.tool
echo ""

# Extract txRef and chargeId from session
TX_REF=$(echo "$SESSION" | python3 -c "import sys, json; print(json.load(sys.stdin).get('txRef', ''))")

if [ -z "$TX_REF" ]; then
  echo "❌ Error: No transaction reference found. Session may not be in PAY state."
  exit 1
fi

echo "📋 Transaction Reference: $TX_REF"
echo ""

# Step 3: Confirm transaction
echo "✅ Step 3: Confirming transaction..."
curl -s -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=whatsapp:${PHONE}" \
  --data-urlencode "Body=confirm" > /dev/null

sleep 3

# Step 4: Get updated session with chargeId
echo "📊 Step 4: Getting payment link details..."
SESSION=$(curl -s http://localhost:3000/status/${PHONE})
echo "$SESSION" | python3 -m json.tool
echo ""

CHARGE_ID=$(echo "$SESSION" | python3 -c "import sys, json; s=json.load(sys.stdin); import re; link=s.get('paymentLink',''); print(re.search(r'/pay/([^/]+)', link).group(1) if link and '/pay/' in link else '')")
PAYMENT_LINK=$(echo "$SESSION" | python3 -c "import sys, json; print(json.load(sys.stdin).get('paymentLink', ''))")

echo "💳 Payment Link: $PAYMENT_LINK"
echo "🔑 Charge ID: $CHARGE_ID"
echo ""

# Step 5: Simulate Flutterwave webhook (mock payment success)
echo "🔄 Step 5: Simulating successful payment webhook..."
echo "(In production, Flutterwave would send this automatically)"
echo ""

# Get the secret hash from .env
if [ -f "backend/.env" ]; then
  SECRET_HASH=$(grep FLUTTERWAVE_SECRET_HASH backend/.env | cut -d '=' -f2)
else
  SECRET_HASH="test_secret_hash"
fi

curl -s -X POST http://localhost:3000/webhook/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: ${SECRET_HASH}" \
  -d "{
    \"event\": \"charge.completed\",
    \"data\": {
      \"id\": \"${CHARGE_ID}\",
      \"tx_ref\": \"${TX_REF}\",
      \"amount\": ${AMOUNT},
      \"currency\": \"${CURRENCY}\",
      \"status\": \"successful\",
      \"customer\": {
        \"phone_number\": \"${PHONE}\"
      }
    }
  }" | python3 -m json.tool

echo ""
sleep 5

# Step 6: Check final status
echo "🎉 Step 6: Checking final transaction status..."
curl -s http://localhost:3000/status/${PHONE} | python3 -m json.tool
echo ""

echo "=========================================="
echo "✅ Test Complete!"
echo ""
echo "💡 Note: In production, you would:"
echo "   1. Click the payment link"
echo "   2. Complete payment on Flutterwave"
echo "   3. Flutterwave automatically sends webhook"
echo "   4. System processes payment and sends USDC"
echo ""
echo "📱 For testing, we manually triggered the webhook"
echo "   to simulate a successful payment."
