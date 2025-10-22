const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const twilio = require('twilio');
const cron = require('node-cron');

const { validateTwilioSignature } = require('./middleware/twilioAuth');
const { handleError, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { parseRemittanceMessage, generateTxRef } = require('./utils/messageParser');
const sessionStore = require('./utils/sessionStore');
const flutterwaveService = require('./services/flutterwaveService');
const circleService = require('./services/circleService');
const bridgeService = require('./services/bridgeService');
const offrampService = require('./services/offrampService');
const { BotHandler } = require('./botHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken || !accountSid.startsWith('AC')) {
      console.warn('[Twilio] Invalid or missing credentials - WhatsApp features disabled');
      return null;
    }
    
    twilioClient = twilio(accountSid, authToken);
    console.log('[Twilio] Client initialized');
  }
  
  return twilioClient;
}

async function sendWhatsAppMessage(to, message) {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      console.log('[WhatsApp] MOCK - Would send to', to, ':', message);
      return { success: true, sid: 'MOCK-' + Date.now() };
    }
    
    const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    const response = await client.messages.create({
      from: from,
      to: to,
      body: message
    });

    console.log('[WhatsApp] Message sent:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error.message);
    return { success: false, error: error.message };
  }
}

const botHandler = new BotHandler(sendWhatsAppMessage);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

app.use('/webhook', limiter);

setInterval(() => {
  sessionStore.cleanup();
}, 300000);

async function sendWhatsAppMessage(to, message) {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      console.log('[WhatsApp] MOCK - Would send to', to, ':', message);
      return { success: true, sid: 'MOCK-' + Date.now() };
    }
    
    const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    const response = await client.messages.create({
      from: from,
      to: to,
      body: message
    });

    console.log('[WhatsApp] Message sent:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error.message);
    return { success: false, error: error.message };
  }
}

function convertCurrencyToUSDC(amount, currency) {
  const rates = {
    'KES': 0.0077,
    'NGN': 0.0013,
    'GHS': 0.085,
    'UGX': 0.00027,
    'RWF': 0.00082
  };
  
  const rate = rates[currency] || 0.01;
  return (amount * rate).toFixed(2);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/webhook/whatsapp', validateTwilioSignature, async (req, res) => {
  try {
    const { From: from, Body: body } = req.body;
    
    console.log('[Webhook] Received message:', { from, body });

    res.status(200).send('');

    await botHandler.handleMessage(from, body);

  } catch (error) {
    console.error('[Webhook] Error processing message:', error.message);
    
    await sendWhatsAppMessage(
      req.body.From,
      `❌ Error: ${error.message}. Please try again later.`
    );
  }
});

async function processPayment(userPhone, chargeId, recipientPhone, fiatAmount, currency, txRef) {
  try {
    console.log('[ProcessPayment] Starting payment processing:', {
      userPhone,
      chargeId,
      recipientPhone,
      fiatAmount,
      currency
    });

    const paymentResult = await flutterwaveService.pollCharge(chargeId);

    if (!paymentResult.success) {
      throw new Error('Payment verification failed');
    }

    await sendWhatsAppMessage(
      userPhone,
      `✅ Payment received! Converting to USDC and sending to blockchain...`
    );

    sessionStore.update(userPhone, {
      status: 'payment_confirmed',
      paymentResult
    });

    const usdcAmount = convertCurrencyToUSDC(fiatAmount, currency);

    console.log('[ProcessPayment] Converted amount:', {
      fiat: `${fiatAmount} ${currency}`,
      usdc: `${usdcAmount} USDC`
    });

    await sendWhatsAppMessage(
      userPhone,
      `💱 Converted: ${fiatAmount} ${currency} → ${usdcAmount} USDC\n\nProcessing blockchain transaction...`
    );

    const recipientAddress = process.env.DEFAULT_RECIPIENT_ADDRESS || recipientPhone;

    const bridgeResult = await bridgeService.depositToBridge(
      usdcAmount,
      recipientAddress,
      `${txRef}|${fiatAmount}${currency}|${recipientPhone}`
    );

    sessionStore.update(userPhone, {
      status: 'completed',
      bridgeResult,
      usdcAmount,
      completedAt: Date.now()
    });

    await sendWhatsAppMessage(
      userPhone,
      `🎉 Transfer complete!\n\n💰 ${usdcAmount} USDC sent to ${recipientPhone}\n🔗 Tx: ${bridgeResult.txHash}\n\nThank you for using AfriBridge!`
    );

    console.log('[ProcessPayment] Transfer completed successfully:', {
      txHash: bridgeResult.txHash,
      usdcAmount,
      recipient: recipientPhone
    });

  } catch (error) {
    console.error('[ProcessPayment] Error:', error.message);

    sessionStore.update(userPhone, {
      status: 'failed',
      error: error.message,
      failedAt: Date.now()
    });

    await sendWhatsAppMessage(
      userPhone,
      `❌ Transfer failed: ${error.message}\n\nPlease contact support with reference: ${txRef}`
    );
  }
}

app.post('/webhook/flutterwave', express.json(), async (req, res) => {
  try {
    console.log('[Flutterwave Webhook] Received:', req.body);

    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers['verif-hash'];

    // Skip signature validation in development mode
    if (process.env.NODE_ENV !== 'development') {
      if (!secretHash || signature !== secretHash) {
        console.error('[Flutterwave Webhook] Invalid signature');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      console.log('[Flutterwave Webhook] Skipping signature validation in development mode');
    }

    const { event, data } = req.body;

    if (event === 'charge.completed' && data.status === 'successful') {
      console.log('[Flutterwave Webhook] Payment successful:', data.tx_ref);
      
      const phone = data.customer?.phone_number;
      if (phone) {
        const whatsappPhone = `whatsapp:${phone}`;
        const session = sessionStore.get(whatsappPhone);
        
        if (session && session.txRef === data.tx_ref) {
          const paymentResult = {
            success: true,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            transactionId: data.id
          };
          
          await botHandler.processPaymentSuccess(whatsappPhone, paymentResult);
        }
      }
    }

    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('[Flutterwave Webhook] Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/payment/verify', express.json(), async (req, res) => {
  try {
    const { phone, chargeId } = req.body;
    
    if (!phone || !chargeId) {
      return res.status(400).json({ error: 'Phone and chargeId required' });
    }

    const whatsappPhone = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    
    console.log('[Payment Verify] Checking payment for:', whatsappPhone);

    const result = await flutterwaveService.verifyTransaction(chargeId);

    if (result.success) {
      await botHandler.processPaymentSuccess(whatsappPhone, result);
      res.json({ status: 'success', result });
    } else {
      res.json({ status: 'pending', result });
    }

  } catch (error) {
    console.error('[Payment Verify] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/status/:phone', (req, res) => {
  const phone = req.params.phone;
  const whatsappPhone = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  const session = sessionStore.get(whatsappPhone);
  
  if (!session) {
    return res.status(404).json({ error: 'No active session found' });
  }

  res.json({
    state: session.state,
    amount: session.amount,
    currency: session.currency,
    usdcAmount: session.usdcAmount,
    recipientPhone: session.recipientPhone,
    txRef: session.txRef,
    paymentLink: session.paymentLink,
    txHash: session.bridgeResult?.txHash,
    updatedAt: session.updatedAt
  });
});

app.get('/bridge/balance', async (req, res) => {
  try {
    const balance = await bridgeService.getContractBalance();
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/approve-usdc', express.json(), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }

    console.log('[Admin] Approving USDC:', amount);

    const result = await bridgeService.approveUSDC(amount);

    res.json({
      success: true,
      message: `Approved ${amount} USDC for Bridge contract`,
      txHash: result.txHash
    });
  } catch (error) {
    console.error('[Admin] Approval error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/fulfill', express.json(), asyncHandler(async (req, res) => {
  const { txHash, recipientPhone, amount, currency, adminKey } = req.body;

  if (!txHash || !recipientPhone || !amount || !currency) {
    return res.status(400).json({ 
      error: 'Missing required fields: txHash, recipientPhone, amount, currency' 
    });
  }

  const configuredKey = process.env.ADMIN_API_KEY;
  if (configuredKey && adminKey !== configuredKey) {
    console.error('[Fulfill] Unauthorized access attempt');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  console.log('[Fulfill] Processing fulfillment request:', {
    txHash,
    recipientPhone,
    amount,
    currency
  });

  const status = offrampService.getFulfillmentStatus(txHash);
  if (status.fulfilled) {
    console.log('[Fulfill] Transaction already fulfilled:', txHash);
    return res.json({
      success: true,
      alreadyFulfilled: true,
      fulfillment: status
    });
  }

  try {
    const result = await offrampService.fulfillWithdrawal(
      txHash,
      recipientPhone,
      amount,
      currency
    );

    console.log('[Fulfill] Fulfillment successful:', result);

    res.json({
      success: true,
      fulfillment: result
    });
  } catch (error) {
    console.error('[Fulfill] Fulfillment failed:', error.message);
    throw error;
  }
}));

app.get('/fulfill/status/:txHash', asyncHandler(async (req, res) => {
  const { txHash } = req.params;
  
  const status = offrampService.getFulfillmentStatus(txHash);
  
  res.json({
    txHash,
    ...status
  });
}));

app.post('/retry/:txRef', express.json(), asyncHandler(async (req, res) => {
  const { txRef } = req.params;
  const { phone } = req.body;

  console.log('[Retry] Retry request:', { txRef, phone });

  const whatsappPhone = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  const session = sessionStore.get(whatsappPhone);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.txRef !== txRef) {
    return res.status(400).json({ error: 'Invalid transaction reference' });
  }

  if (session.errorType === 'payment') {
    sessionStore.update(whatsappPhone, { state: 'CONFIRM' });
    res.json({ 
      success: true, 
      message: 'Retry initiated. Please confirm your transaction again.',
      state: 'CONFIRM'
    });
  } else if (session.errorType === 'blockchain') {
    sessionStore.update(whatsappPhone, { state: 'PROCESSING' });
    
    try {
      await botHandler.processPaymentSuccess(whatsappPhone, session.paymentResult);
      res.json({ 
        success: true, 
        message: 'Retry successful. Check WhatsApp for confirmation.',
        state: 'SUCCESS'
      });
    } catch (error) {
      throw error;
    }
  } else {
    res.status(400).json({ error: 'Transaction not retryable' });
  }
}));

cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Running timeout check...');
  
  try {
    const result = await offrampService.checkPendingTransactions();
    console.log('[Cron] Timeout check complete:', result);
  } catch (error) {
    console.error('[Cron] Error in timeout check:', error.message);
  }
});

cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running cleanup...');
  
  try {
    sessionStore.cleanup();
    offrampService.cleanupOldFulfillments();
    console.log('[Cron] Cleanup complete');
  } catch (error) {
    console.error('[Cron] Error in cleanup:', error.message);
  }
});

app.use(notFoundHandler);
app.use(handleError);

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                  AfriBridge API Server                    ║
║                                                            ║
║  Status: Running                                          ║
║  Port: ${PORT}                                             ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║  Endpoints:                                               ║
║    GET  /health                                           ║
║    POST /webhook/whatsapp                                 ║
║    POST /webhook/flutterwave                              ║
║    POST /fulfill                                          ║
║    GET  /fulfill/status/:txHash                           ║
║    POST /retry/:txRef                                     ║
║    GET  /status/:phone                                    ║
║    GET  /bridge/balance                                   ║
║    POST /payment/verify                                   ║
║                                                            ║
║  Cron Jobs:                                               ║
║    */5 * * * * - Check pending transactions               ║
║    0 0 * * * - Daily cleanup                              ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  console.log('[Server] Initialized at:', new Date().toISOString());
});

module.exports = app;
