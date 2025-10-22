#!/bin/bash

# AfriBridge Testnet Setup Helper
# This script helps you set up your wallet with testnet tokens

set -e

echo "🌍 AfriBridge Testnet Setup"
echo "======================================"
echo ""

WALLET="0x208B2660e5F62CDca21869b389c5aF9E7f0faE89"
BRIDGE="0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88"
RPC="https://sepolia.base.org"

echo "📋 Your Wallet: $WALLET"
echo "🌉 Bridge Contract: $BRIDGE"
echo ""

# Check if cast is installed
if ! command -v cast &> /dev/null; then
    echo "⚠️  Foundry not installed!"
    echo ""
    echo "To install Foundry (for blockchain commands):"
    echo "  curl -L https://foundry.paradigm.xyz | bash"
    echo "  foundryup"
    echo ""
    echo "After installing, run this script again."
    echo ""
    echo "For now, you can still proceed manually:"
    echo ""
    HAS_CAST=false
else
    HAS_CAST=true
    echo "✅ Foundry is installed"
    echo ""
fi

# Step 1: Check ETH balance
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Get Base Sepolia ETH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HAS_CAST" = true ]; then
    echo "Checking current ETH balance..."
    BALANCE=$(cast balance $WALLET --rpc-url $RPC 2>/dev/null || echo "0")
    BALANCE_ETH=$(cast --to-unit $BALANCE ether 2>/dev/null || echo "0")
    echo "Current balance: $BALANCE_ETH ETH"
    echo ""
fi

echo "🚰 Get FREE Base Sepolia ETH from faucet:"
echo ""
echo "   Option 1 (Recommended):"
echo "   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
echo ""
echo "   Option 2:"
echo "   https://www.alchemy.com/faucets/base-sepolia"
echo ""
echo "Enter your wallet address when prompted:"
echo "   $WALLET"
echo ""

read -p "Press ENTER after you've requested ETH from the faucet..."
echo ""

if [ "$HAS_CAST" = true ]; then
    echo "Checking new balance..."
    sleep 2
    BALANCE=$(cast balance $WALLET --rpc-url $RPC 2>/dev/null || echo "0")
    BALANCE_ETH=$(cast --to-unit $BALANCE ether 2>/dev/null || echo "0")
    echo "New balance: $BALANCE_ETH ETH"

    if [ "$BALANCE" = "0" ]; then
        echo "⚠️  Still 0 ETH. Wait a few minutes and try again."
    else
        echo "✅ Got ETH! Ready to proceed."
    fi
    echo ""
fi

# Step 2: Mock USDC
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Get Mock USDC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "For testing, you need to deploy a Mock USDC contract."
echo ""
echo "📝 Option A: Use Remix IDE (No installation needed)"
echo "   1. Go to: https://remix.ethereum.org/"
echo "   2. Create new file: MockUSDC.sol"
echo "   3. Copy contract code from: GET_TESTNET_TOKENS.md"
echo "   4. Connect MetaMask to Base Sepolia"
echo "   5. Import your private key to MetaMask"
echo "   6. Deploy the contract"
echo "   7. Copy the deployed address"
echo ""
echo "📝 Option B: Use Foundry (if installed)"
echo "   Coming soon..."
echo ""

read -p "Enter your Mock USDC contract address (or press ENTER to skip): " USDC_ADDRESS
echo ""

if [ -n "$USDC_ADDRESS" ]; then
    if [ "$HAS_CAST" = true ]; then
        echo "Checking USDC balance..."
        USDC_BAL=$(cast call $USDC_ADDRESS "balanceOf(address)(uint256)" $WALLET --rpc-url $RPC 2>/dev/null || echo "0")
        USDC_BAL_FORMATTED=$(echo "scale=2; $USDC_BAL / 1000000" | bc 2>/dev/null || echo "0")
        echo "USDC Balance: $USDC_BAL_FORMATTED USDC"
        echo ""
    fi

    # Step 3: Approve USDC
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 3: Approve USDC for Bridge"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    echo "You can approve USDC using the backend API:"
    echo ""
    echo "Make sure backend is running, then:"
    echo ""
    echo "  curl -X POST http://localhost:3000/admin/approve-usdc \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"amount\": 1000000}'"
    echo ""
    echo "Or update your .env file:"
    echo "  USDC_ADDRESS_SEPOLIA=$USDC_ADDRESS"
    echo ""

    read -p "Press ENTER when ready to test..."
else
    echo "⚠️  Skipped USDC setup. You'll need to do this before running tests."
    echo ""
fi

# Step 4: Test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Test Complete Flow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Setup checklist:"
echo "  [ ] Base Sepolia ETH in wallet"
echo "  [ ] Mock USDC deployed and minted to wallet"
echo "  [ ] USDC approved for Bridge contract"
echo "  [ ] .env file updated with USDC address"
echo ""
echo "To test the full payment flow:"
echo "  ./test-payment-flow.sh"
echo ""
echo "To check balances anytime:"
echo "  cast balance $WALLET --rpc-url $RPC"
echo "  cast call USDC_ADDR 'balanceOf(address)(uint256)' $WALLET --rpc-url $RPC"
echo ""
echo "View transactions on BaseScan:"
echo "  https://sepolia.basescan.org/address/$WALLET"
echo ""
echo "======================================"
echo "🚀 Ready to test AfriBridge!"
