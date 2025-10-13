const axios = require('axios');

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

async function createPayment(amount, currency, phone, email, txRef) {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY not configured');
    }

    // Map currency to mobile money type
    const mobileMoneyTypes = {
      'KES': 'mobile_money_kenya',
      'NGN': 'mobile_money_nigeria',
      'GHS': 'mobile_money_ghana',
      'UGX': 'mobile_money_uganda',
      'RWF': 'mobile_money_rwanda'
    };
    
    const chargeType = mobileMoneyTypes[currency] || 'mobile_money_kenya';

    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: currency,
      email: email,
      phone_number: phone,
      redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL || 'https://afribridge.app/callback',
      payment_options: 'mobilemoneykenya,mobilemoneyghana,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyzambia',
      customer: {
        email: email,
        phonenumber: phone,
        name: phone
      },
      customizations: {
        title: 'AfriBridge Remittance',
        description: `Send ${amount} ${currency} via AfriBridge`,
        logo: ''
      }
    };

    console.log('[Flutterwave] Creating payment:', {
      amount,
      currency,
      phone,
      email,
      txRef,
      chargeType
    });

    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/charges?type=${chargeType}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[Flutterwave] Payment created:', response.data);

    return {
      success: true,
      paymentLink: response.data.data.link,
      chargeId: response.data.data.id,
      txRef: txRef,
      status: response.data.status
    };
  } catch (error) {
    console.error('[Flutterwave] Error creating payment:', error.response?.data || error.message);
    throw new Error(`Payment creation failed: ${error.response?.data?.message || error.message}`);
  }
}

async function verifyTransaction(transactionId) {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    console.log('[Flutterwave] Verifying transaction:', transactionId);

    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data.data;
    console.log('[Flutterwave] Transaction verified:', {
      status: data.status,
      amount: data.amount,
      currency: data.currency
    });

    return {
      success: data.status === 'successful',
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      transactionId: data.id,
      customer: data.customer
    };
  } catch (error) {
    console.error('[Flutterwave] Error verifying transaction:', error.response?.data || error.message);
    throw new Error(`Verification failed: ${error.response?.data?.message || error.message}`);
  }
}

async function pollCharge(chargeId, maxAttempts = 10, intervalMs = 3000) {
  console.log('[Flutterwave] Starting to poll charge:', chargeId);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await verifyTransaction(chargeId);
      
      if (result.success) {
        console.log(`[Flutterwave] Charge successful after ${attempt} attempts`);
        return result;
      }
      
      if (result.status === 'failed') {
        throw new Error('Payment failed');
      }

      console.log(`[Flutterwave] Attempt ${attempt}/${maxAttempts}: Status ${result.status}`);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error) {
      console.error(`[Flutterwave] Poll attempt ${attempt} error:`, error.message);
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error('Payment polling timeout');
}

module.exports = {
  createPayment,
  verifyTransaction,
  pollCharge
};
