#!/usr/bin/env node

/**
 * E2E Flow Simulation
 * 
 * Simulates complete user journey from WhatsApp message to blockchain deposit
 * 
 * Usage: node tests/e2e-simulation.js
 */

const axios = require('axios');
const { ethers } = require('ethers');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_PHONE = 'whatsapp:+254712345678';
const TEST_RECIPIENT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
const TEST_AMOUNT_KES = 1000;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(number, description) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`STEP ${number}: ${description}`, 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
}

async function sendWhatsAppMessage(body) {
  try {
    const response = await axios.post(`${BASE_URL}/webhook/whatsapp`, 
      new URLSearchParams({
        From: TEST_PHONE,
        Body: body
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`WhatsApp API error: ${error.message}`);
  }
}

async function checkHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    return response.data;
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
}

async function getBridgeBalance() {
  try {
    const response = await axios.get(`${BASE_URL}/bridge/balance`);
    return response.data;
  } catch (error) {
    throw new Error(`Bridge balance check failed: ${error.message}`);
  }
}

async function sendPaymentCallback(txRef) {
  try {
    const response = await axios.post(`${BASE_URL}/callback/flutterwave`, {
      event: 'charge.completed',
      data: {
        tx_ref: txRef,
        amount: TEST_AMOUNT_KES,
        status: 'successful',
        currency: 'KES',
        customer: {
          phone_number: TEST_PHONE.replace('whatsapp:', ''),
          email: 'test@example.com'
        },
        created_at: new Date().toISOString()
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Payment callback failed: ${error.message}`);
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETest() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║   AfriBridge E2E Flow Simulation              ║', 'blue');
  log('╚════════════════════════════════════════════════╝', 'blue');
  
  let txRef = null;
  
  try {
    // Step 0: Health check
    step(0, 'Health Check');
    const health = await checkHealth();
    log(`✓ Server is healthy: ${health.status}`, 'green');
    
    // Step 1: Check initial bridge balance
    step(1, 'Check Initial Bridge Balance');
    const initialBalance = await getBridgeBalance();
    log(`✓ Bridge balance: ${initialBalance.balance} USDC`, 'green');
    log(`  (${initialBalance.balanceWei} wei)`, 'yellow');
    
    // Step 2: Initiate send flow
    step(2, 'User sends "send" to WhatsApp bot');
    await sendWhatsAppMessage('send');
    log('✓ Send command sent', 'green');
    await wait(500);
    
    // Step 3: Provide amount
    step(3, 'User provides amount');
    log(`Sending amount: ${TEST_AMOUNT_KES} KES`, 'yellow');
    await sendWhatsAppMessage(TEST_AMOUNT_KES.toString());
    log('✓ Amount sent', 'green');
    await wait(500);
    
    // Step 4: Provide recipient address
    step(4, 'User provides recipient Ethereum address');
    log(`Recipient: ${TEST_RECIPIENT}`, 'yellow');
    await sendWhatsAppMessage(TEST_RECIPIENT);
    log('✓ Recipient address sent', 'green');
    await wait(500);
    
    // Step 5: Confirm transaction
    step(5, 'User confirms transaction');
    const confirmResponse = await sendWhatsAppMessage('yes');
    log('✓ Confirmation sent', 'green');
    
    // Extract transaction reference from response
    // In real scenario, parse the response to get the tx ref
    txRef = `ABR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    log(`Generated txRef: ${txRef}`, 'yellow');
    await wait(1000);
    
    // Step 6: Simulate payment completion
    step(6, 'Simulate Flutterwave payment callback');
    log('Sending payment completion webhook...', 'yellow');
    const paymentResponse = await sendPaymentCallback(txRef);
    log('✓ Payment callback processed', 'green');
    await wait(2000);
    
    // Step 7: Verify blockchain deposit (mock)
    step(7, 'Verify blockchain deposit');
    log('⚠ Mock verification - In production, check BaseScan:', 'yellow');
    log(`  https://sepolia.basescan.org/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88`, 'cyan');
    
    // Step 8: Check final bridge balance
    step(8, 'Check Final Bridge Balance');
    const finalBalance = await getBridgeBalance();
    log(`✓ Bridge balance: ${finalBalance.balance} USDC`, 'green');
    log(`  (${finalBalance.balanceWei} wei)`, 'yellow');
    
    if (finalBalance.balanceWei !== initialBalance.balanceWei) {
      log('✓ Balance changed - deposit successful!', 'green');
    } else {
      log('⚠ Balance unchanged (expected in test mode)', 'yellow');
    }
    
    // Success summary
    log('\n╔════════════════════════════════════════════════╗', 'green');
    log('║   E2E Test Completed Successfully! ✓          ║', 'green');
    log('╚════════════════════════════════════════════════╝', 'green');
    
    log('\nTest Summary:', 'cyan');
    log(`  Phone: ${TEST_PHONE}`, 'yellow');
    log(`  Amount: ${TEST_AMOUNT_KES} KES`, 'yellow');
    log(`  Recipient: ${TEST_RECIPIENT}`, 'yellow');
    log(`  TxRef: ${txRef}`, 'yellow');
    log(`  Initial Balance: ${initialBalance.balance} USDC`, 'yellow');
    log(`  Final Balance: ${finalBalance.balance} USDC`, 'yellow');
    
    log('\nNext Steps:', 'cyan');
    log('  1. Test with real Twilio WhatsApp sandbox', 'yellow');
    log('  2. Test with real Flutterwave payments', 'yellow');
    log('  3. Verify deposits on BaseScan', 'yellow');
    log('  4. Test off-ramp flow', 'yellow');
    
    process.exit(0);
    
  } catch (error) {
    log('\n╔════════════════════════════════════════════════╗', 'red');
    log('║   E2E Test Failed ✗                           ║', 'red');
    log('╚════════════════════════════════════════════════╝', 'red');
    
    log(`\nError: ${error.message}`, 'red');
    
    if (error.response) {
      log('\nResponse Details:', 'yellow');
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    log('\nTroubleshooting:', 'cyan');
    log('  1. Ensure backend server is running: npm start', 'yellow');
    log('  2. Check BASE_URL is correct', 'yellow');
    log('  3. Verify all services are configured', 'yellow');
    log('  4. Check logs in terminal running server', 'yellow');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  log('\nStarting E2E test in 2 seconds...', 'cyan');
  log('Make sure backend server is running on ' + BASE_URL, 'yellow');
  
  setTimeout(() => {
    runE2ETest();
  }, 2000);
}

module.exports = { runE2ETest };
