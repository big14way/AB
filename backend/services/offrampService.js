const flutterwaveService = require('./flutterwaveService');
const bridgeService = require('./bridgeService');
const sessionStore = require('../utils/sessionStore');

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

const fulfilledTransactions = new Map();

function isTransactionFulfilled(txHash) {
  return fulfilledTransactions.has(txHash);
}

function markTransactionFulfilled(txHash, data) {
  fulfilledTransactions.set(txHash, {
    ...data,
    fulfilledAt: Date.now()
  });
  console.log('[OffRamp] Transaction marked as fulfilled:', txHash);
}

async function payoutToPhone(phone, amount, currency, reference) {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY not configured');
    }

    const cleanPhone = phone.replace('whatsapp:', '').replace('+', '');

    const payload = {
      account_bank: getMobileMoneyCode(currency),
      account_number: cleanPhone,
      amount: amount,
      narration: `AfriBridge payout - ${reference}`,
      currency: currency,
      reference: reference,
      callback_url: process.env.FLUTTERWAVE_CALLBACK_URL || 'https://afribridge.app/callback',
      debit_currency: 'USD'
    };

    console.log('[OffRamp] Creating payout:', {
      phone: cleanPhone,
      amount,
      currency,
      reference
    });

    const response = await require('axios').post(
      `${FLUTTERWAVE_BASE_URL}/transfers`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[OffRamp] Payout created:', response.data);

    return {
      success: true,
      transferId: response.data.data?.id,
      status: response.data.data?.status,
      reference: reference
    };
  } catch (error) {
    console.error('[OffRamp] Error creating payout:', error.response?.data || error.message);
    throw new Error(`Payout failed: ${error.response?.data?.message || error.message}`);
  }
}

async function verifyPayout(transferId) {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    console.log('[OffRamp] Verifying payout:', transferId);

    const response = await require('axios').get(
      `${FLUTTERWAVE_BASE_URL}/transfers/${transferId}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data.data;
    console.log('[OffRamp] Payout verified:', {
      status: data.status,
      amount: data.amount
    });

    return {
      success: data.status === 'SUCCESSFUL',
      status: data.status,
      transferId: data.id
    };
  } catch (error) {
    console.error('[OffRamp] Error verifying payout:', error.response?.data || error.message);
    throw new Error(`Payout verification failed: ${error.message}`);
  }
}

function getMobileMoneyCode(currency) {
  const codes = {
    'KES': 'MPS',
    'NGN': 'MPS', 
    'GHS': 'mobilemoney',
    'UGX': 'mobilemoney',
    'RWF': 'mobilemoney'
  };
  return codes[currency] || 'MPS';
}

async function fulfillWithdrawal(txHash, recipientPhone, amount, currency) {
  try {
    if (isTransactionFulfilled(txHash)) {
      console.log('[OffRamp] Transaction already fulfilled:', txHash);
      return {
        success: true,
        alreadyFulfilled: true,
        txHash
      };
    }

    console.log('[OffRamp] Starting fulfillment:', {
      txHash,
      recipientPhone,
      amount,
      currency
    });

    const amountInFiat = convertUSDCToFiat(amount, currency);
    const reference = `AFRIB-PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const withdrawal = await bridgeService.withdrawUSDC(recipientPhone, amount);
    console.log('[OffRamp] Bridge withdrawal successful:', withdrawal.txHash);

    const payout = await payoutToPhone(recipientPhone, amountInFiat, currency, reference);
    console.log('[OffRamp] Payout initiated:', payout.transferId);

    const fulfillmentData = {
      txHash,
      recipientPhone,
      amount,
      currency,
      amountInFiat,
      withdrawalTxHash: withdrawal.txHash,
      payoutTransferId: payout.transferId,
      reference,
      status: 'completed'
    };

    markTransactionFulfilled(txHash, fulfillmentData);

    return {
      success: true,
      ...fulfillmentData
    };
  } catch (error) {
    console.error('[OffRamp] Fulfillment error:', error.message);
    
    markTransactionFulfilled(txHash, {
      txHash,
      status: 'failed',
      error: error.message,
      recipientPhone,
      amount,
      currency
    });

    throw error;
  }
}

function convertUSDCToFiat(usdcAmount, currency) {
  const rates = {
    'KES': 130,
    'NGN': 770,
    'GHS': 12,
    'UGX': 3700,
    'RWF': 1220
  };
  
  const rate = rates[currency] || 100;
  return Math.round(parseFloat(usdcAmount) * rate);
}

async function refundTransaction(phone, txRef, amount, currency) {
  try {
    console.log('[OffRamp] Starting refund:', {
      phone,
      txRef,
      amount,
      currency
    });

    const reference = `AFRIB-REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payout = await payoutToPhone(phone, amount, currency, reference);

    console.log('[OffRamp] Refund payout created:', payout.transferId);

    return {
      success: true,
      transferId: payout.transferId,
      reference,
      amount,
      currency,
      phone
    };
  } catch (error) {
    console.error('[OffRamp] Refund error:', error.message);
    throw new Error(`Refund failed: ${error.message}`);
  }
}

async function checkPendingTransactions() {
  const timeoutThreshold = 30 * 60 * 1000;
  const now = Date.now();
  let timedOutCount = 0;

  console.log('[OffRamp] Checking for timed out transactions...');

  for (const [phone, session] of sessionStore.sessions.entries()) {
    if (session.state === 'PAY' || session.state === 'PROCESSING') {
      const age = now - session.startedAt;
      
      if (age > timeoutThreshold) {
        console.log('[OffRamp] Found timed out transaction:', {
          phone,
          state: session.state,
          ageMinutes: Math.round(age / 60000),
          txRef: session.txRef
        });

        try {
          if (session.state === 'PAY') {
            console.log('[OffRamp] Transaction never paid, marking as failed');
            sessionStore.update(phone, {
              state: 'ERROR',
              error: 'Payment timeout - transaction expired after 30 minutes'
            });
          } else if (session.state === 'PROCESSING') {
            console.log('[OffRamp] Processing timeout, attempting refund');
            
            if (session.paymentResult?.success) {
              await refundTransaction(
                phone,
                session.txRef,
                session.amount,
                session.currency
              );

              sessionStore.update(phone, {
                state: 'ERROR',
                error: 'Processing timeout - refund initiated',
                refundInitiated: true
              });

              console.log('[OffRamp] Refund initiated for:', phone);
            }
          }

          timedOutCount++;
        } catch (error) {
          console.error('[OffRamp] Error handling timeout for', phone, ':', error.message);
        }
      }
    }
  }

  if (timedOutCount > 0) {
    console.log(`[OffRamp] Processed ${timedOutCount} timed out transactions`);
  } else {
    console.log('[OffRamp] No timed out transactions found');
  }

  return { timedOutCount };
}

async function retryFailedPayout(transferId, maxRetries = 3) {
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries) {
    attempt++;
    console.log(`[OffRamp] Retry attempt ${attempt}/${maxRetries} for transfer:`, transferId);

    try {
      const result = await verifyPayout(transferId);
      
      if (result.success) {
        console.log('[OffRamp] Retry successful');
        return result;
      }

      if (result.status === 'FAILED') {
        throw new Error(`Payout permanently failed: ${result.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    } catch (error) {
      lastError = error;
      console.error(`[OffRamp] Retry attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`All retry attempts failed: ${lastError.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    }
  }

  throw lastError;
}

function getFulfillmentStatus(txHash) {
  const fulfillment = fulfilledTransactions.get(txHash);
  
  if (!fulfillment) {
    return { fulfilled: false };
  }

  return {
    fulfilled: true,
    ...fulfillment
  };
}

function cleanupOldFulfillments(maxAgeMs = 86400000) {
  const now = Date.now();
  let cleaned = 0;

  for (const [txHash, data] of fulfilledTransactions.entries()) {
    if (now - data.fulfilledAt > maxAgeMs) {
      fulfilledTransactions.delete(txHash);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[OffRamp] Cleaned up ${cleaned} old fulfillment records`);
  }

  return cleaned;
}

module.exports = {
  payoutToPhone,
  verifyPayout,
  fulfillWithdrawal,
  refundTransaction,
  checkPendingTransactions,
  retryFailedPayout,
  getFulfillmentStatus,
  isTransactionFulfilled,
  cleanupOldFulfillments,
  convertUSDCToFiat
};
