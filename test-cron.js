const sessionStore = require('./backend/utils/sessionStore');
const offrampService = require('./backend/services/offrampService');

console.log('🧪 Testing Cron Jobs\n');

async function testTimeoutCheck() {
  console.log('Test 1: Timeout Check for Pending Transactions\n');
  console.log('=' .repeat(60));
  
  const testPhone1 = 'whatsapp:+254712345678';
  const testPhone2 = 'whatsapp:+254798765432';
  const testPhone3 = 'whatsapp:+254701234567';

  sessionStore.set(testPhone1, {
    state: 'PAY',
    amount: 1000,
    currency: 'KES',
    txRef: 'AFRIB-TEST-1',
    startedAt: Date.now() - (31 * 60 * 1000)
  });
  console.log('✅ Created PAY session (31 min old - should timeout)');

  sessionStore.set(testPhone2, {
    state: 'PROCESSING',
    amount: 5000,
    currency: 'NGN',
    txRef: 'AFRIB-TEST-2',
    startedAt: Date.now() - (35 * 60 * 1000),
    paymentResult: { success: true }
  });
  console.log('✅ Created PROCESSING session (35 min old - should refund)');

  sessionStore.set(testPhone3, {
    state: 'PAY',
    amount: 100,
    currency: 'GHS',
    txRef: 'AFRIB-TEST-3',
    startedAt: Date.now() - (10 * 60 * 1000)
  });
  console.log('✅ Created PAY session (10 min old - should NOT timeout)\n');

  console.log('Running checkPendingTransactions...\n');
  
  const result = await offrampService.checkPendingTransactions();
  
  console.log('\n📊 Results:', result);
  console.log('\n🔍 Session States After Check:');
  console.log('Phone 1:', sessionStore.get(testPhone1)?.state, '-', sessionStore.get(testPhone1)?.error);
  console.log('Phone 2:', sessionStore.get(testPhone2)?.state, '-', sessionStore.get(testPhone2)?.error);
  console.log('Phone 3:', sessionStore.get(testPhone3)?.state);

  console.log('\n✅ Test 1 Complete\n');
}

async function testFulfillmentIdempotency() {
  console.log('Test 2: Fulfillment Idempotency\n');
  console.log('=' .repeat(60));

  const testTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const recipientPhone = '+254712345678';
  const amount = '7.7';
  const currency = 'KES';

  console.log('Marking transaction as fulfilled:', testTxHash);
  offrampService['fulfilledTransactions'] = offrampService['fulfilledTransactions'] || new Map();
  offrampService['fulfilledTransactions'].set(testTxHash, {
    txHash: testTxHash,
    recipientPhone: recipientPhone,
    amount: amount,
    currency: currency,
    status: 'completed',
    fulfilledAt: Date.now()
  });

  console.log('✅ Transaction marked as fulfilled\n');

  console.log('Checking if transaction is fulfilled...');
  const isFulfilled = offrampService.isTransactionFulfilled(testTxHash);
  console.log('Result:', isFulfilled ? '✅ FULFILLED' : '❌ NOT FULFILLED');

  console.log('\nGetting fulfillment status...');
  const status = offrampService.getFulfillmentStatus(testTxHash);
  console.log('Status:', JSON.stringify(status, null, 2));

  console.log('\n✅ Test 2 Complete\n');
}

async function testCleanup() {
  console.log('Test 3: Cleanup Functions\n');
  console.log('=' .repeat(60));

  console.log('Current sessions:', sessionStore.sessions.size);
  
  const oldPhone = 'whatsapp:+254700000000';
  sessionStore.set(oldPhone, {
    state: 'SUCCESS',
    startedAt: Date.now() - (2 * 60 * 60 * 1000),
    updatedAt: Date.now() - (2 * 60 * 60 * 1000)
  });
  console.log('✅ Created old session (2 hours ago)');

  console.log('\nRunning session cleanup (max age: 1 hour)...');
  const cleaned = sessionStore.cleanup(3600000);
  console.log('Cleaned sessions:', cleaned);

  console.log('\nRunning fulfillment cleanup...');
  const cleanedFulfillments = offrampService.cleanupOldFulfillments();
  console.log('Cleaned fulfillments:', cleanedFulfillments);

  console.log('\n✅ Test 3 Complete\n');
}

async function testConversion() {
  console.log('Test 4: USDC to Fiat Conversion\n');
  console.log('=' .repeat(60));

  const testCases = [
    { usdc: 7.7, currency: 'KES' },
    { usdc: 10, currency: 'NGN' },
    { usdc: 5, currency: 'GHS' },
    { usdc: 20, currency: 'UGX' },
    { usdc: 15, currency: 'RWF' }
  ];

  console.log('Converting USDC to local currencies:\n');

  for (const test of testCases) {
    const fiat = offrampService.convertUSDCToFiat(test.usdc, test.currency);
    console.log(`${test.usdc} USDC → ${fiat} ${test.currency}`);
  }

  console.log('\n✅ Test 4 Complete\n');
}

async function runAllTests() {
  try {
    console.log('Starting Cron Job Tests...\n');
    
    await testTimeoutCheck();
    await testFulfillmentIdempotency();
    await testCleanup();
    await testConversion();

    console.log('=' .repeat(60));
    console.log('🎉 All tests completed!\n');

    sessionStore.sessions.clear();
    console.log('🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n✅ Test script complete');
    process.exit(0);
  });
}

module.exports = { runAllTests };
