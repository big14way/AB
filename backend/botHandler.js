const sessionStore = require('./utils/sessionStore');
const { parseRemittanceMessage, generateTxRef } = require('./utils/messageParser');
const flutterwaveService = require('./services/flutterwaveService');
const bridgeService = require('./services/bridgeService');

const STATES = {
  WELCOME: 'WELCOME',
  AMOUNT: 'AMOUNT',
  RECIPIENT: 'RECIPIENT',
  CONFIRM: 'CONFIRM',
  PAY: 'PAY',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

const SUPPORTED_CURRENCIES = ['KES', 'NGN', 'GHS', 'UGX', 'RWF'];

const CURRENCY_RATES = {
  'KES': 0.0077,
  'NGN': 0.0013,
  'GHS': 0.085,
  'UGX': 0.00027,
  'RWF': 0.00082
};

function convertToUSDC(amount, currency) {
  const rate = CURRENCY_RATES[currency] || 0.01;
  return (amount * rate).toFixed(2);
}

async function resolveBasename(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}.base.eth`;
}

class BotHandler {
  constructor(sendMessageFn) {
    this.sendMessage = sendMessageFn;
  }

  async handleMessage(from, body) {
    console.log('[BotHandler] Processing message from:', from, 'Body:', body);

    const session = sessionStore.get(from) || {};
    const currentState = session.state || STATES.WELCOME;
    const text = body.trim();

    console.log('[BotHandler] Current state:', currentState);

    switch (currentState) {
      case STATES.WELCOME:
        return await this.handleWelcome(from, text);
      
      case STATES.AMOUNT:
        return await this.handleAmount(from, text);
      
      case STATES.RECIPIENT:
        return await this.handleRecipient(from, text);
      
      case STATES.CONFIRM:
        return await this.handleConfirm(from, text);
      
      case STATES.PAY:
        return await this.handlePay(from, text);
      
      case STATES.PROCESSING:
        return await this.handleProcessing(from, text);
      
      default:
        return await this.handleWelcome(from, text);
    }
  }

  async handleWelcome(from, text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('help') || lowerText.includes('start') || lowerText.includes('hi')) {
      sessionStore.set(from, { state: STATES.WELCOME });
      
      await this.sendMessage(from, 
        `🌍 *Welcome to AfriBridge!*\n\n` +
        `Send money across Africa using USDC on Base blockchain.\n\n` +
        `📱 *Quick Send:*\n` +
        `Send [amount] [currency] to [phone]\n` +
        `Example: "Send 1000 KES to +254712345678"\n\n` +
        `🔄 *Step by Step:*\n` +
        `Reply with "send" to start\n\n` +
        `💰 Supported: KES, NGN, GHS, UGX, RWF`
      );
      return;
    }

    const parsed = parseRemittanceMessage(text);
    
    if (parsed.valid) {
      const { amount, currency, recipientPhone } = parsed;
      
      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        await this.sendMessage(from, 
          `❌ Currency not supported: ${currency}\n\n` +
          `We support: ${SUPPORTED_CURRENCIES.join(', ')}`
        );
        return;
      }

      const usdcAmount = convertToUSDC(amount, currency);
      const txRef = generateTxRef();
      
      sessionStore.set(from, {
        state: STATES.CONFIRM,
        amount,
        currency,
        recipientPhone,
        usdcAmount,
        txRef,
        startedAt: Date.now()
      });

      await this.sendMessage(from, 
        `✅ *Transfer Summary*\n\n` +
        `💰 Amount: ${amount} ${currency} (~${usdcAmount} USDC)\n` +
        `📱 To: ${recipientPhone}\n` +
        `🔗 Network: Base Sepolia\n\n` +
        `Reply "confirm" to proceed or "cancel" to abort.`
      );
      return;
    }

    if (lowerText.includes('send') || lowerText.includes('transfer')) {
      sessionStore.set(from, { state: STATES.AMOUNT });
      
      await this.sendMessage(from, 
        `💰 *How much would you like to send?*\n\n` +
        `Enter amount and currency:\n` +
        `Example: "1000 KES" or "5000 NGN"\n\n` +
        `Supported: KES, NGN, GHS, UGX, RWF`
      );
      return;
    }

    await this.sendMessage(from, 
      `👋 Welcome to AfriBridge!\n\n` +
      `Send money across Africa instantly.\n\n` +
      `Reply "send" to start a transfer or "help" for more info.`
    );
  }

  async handleAmount(from, text) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*([a-z]{3})/i);
    
    if (!match) {
      await this.sendMessage(from, 
        `❌ Invalid format.\n\n` +
        `Please enter amount and currency:\n` +
        `Example: "1000 KES"`
      );
      return;
    }

    const amount = parseFloat(match[1]);
    const currency = match[2].toUpperCase();

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      await this.sendMessage(from, 
        `❌ Currency not supported: ${currency}\n\n` +
        `Supported: ${SUPPORTED_CURRENCIES.join(', ')}`
      );
      return;
    }

    if (amount <= 0) {
      await this.sendMessage(from, `❌ Amount must be greater than 0`);
      return;
    }

    const usdcAmount = convertToUSDC(amount, currency);

    sessionStore.update(from, {
      state: STATES.RECIPIENT,
      amount,
      currency,
      usdcAmount
    });

    await this.sendMessage(from, 
      `✅ Amount: ${amount} ${currency} (~${usdcAmount} USDC)\n\n` +
      `📱 *Enter recipient's phone number:*\n` +
      `Include country code (e.g., +254712345678)`
    );
  }

  async handleRecipient(from, text) {
    const phoneMatch = text.match(/\+?\d{10,15}/);
    
    if (!phoneMatch) {
      await this.sendMessage(from, 
        `❌ Invalid phone number.\n\n` +
        `Please enter a valid phone with country code:\n` +
        `Example: +254712345678`
      );
      return;
    }

    const recipientPhone = phoneMatch[0];
    const session = sessionStore.get(from);
    const txRef = generateTxRef();

    sessionStore.update(from, {
      state: STATES.CONFIRM,
      recipientPhone,
      txRef
    });

    await this.sendMessage(from, 
      `✅ *Transfer Summary*\n\n` +
      `💰 Amount: ${session.amount} ${session.currency} (~${session.usdcAmount} USDC)\n` +
      `📱 To: ${recipientPhone}\n` +
      `🔗 Network: Base Sepolia\n\n` +
      `Reply "confirm" to proceed or "cancel" to abort.`
    );
  }

  async handleConfirm(from, text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('cancel') || lowerText.includes('abort')) {
      sessionStore.delete(from);
      await this.sendMessage(from, `❌ Transfer cancelled.\n\nSend "help" to start over.`);
      return;
    }

    if (!lowerText.includes('confirm') && !lowerText.includes('yes')) {
      await this.sendMessage(from, 
        `Please reply "confirm" to proceed or "cancel" to abort.`
      );
      return;
    }

    const session = sessionStore.get(from);

    sessionStore.update(from, { state: STATES.PAY });

    await this.sendMessage(from, 
      `✅ Creating payment link...\n\n` +
      `Please wait...`
    );

    try {
      const email = from.replace('whatsapp:', '').replace('+', '') + '@afribridge.app';
      const phone = from.replace('whatsapp:', '');

      const payment = await flutterwaveService.createPayment(
        session.amount,
        session.currency,
        phone,
        email,
        session.txRef
      );

      sessionStore.update(from, {
        state: STATES.PAY,
        chargeId: payment.chargeId,
        paymentLink: payment.paymentLink
      });

      await this.sendMessage(from, 
        `💳 *Complete Payment*\n\n` +
        `${payment.paymentLink}\n\n` +
        `⏱️ Waiting for payment confirmation...\n\n` +
        `Once paid, reply "paid" to check status.`
      );

      this.startPaymentPolling(from, payment.chargeId);

    } catch (error) {
      console.error('[BotHandler] Payment creation error:', error.message);
      
      sessionStore.update(from, { state: STATES.ERROR });
      
      await this.sendMessage(from, 
        `❌ Failed to create payment link.\n\n` +
        `Error: ${error.message}\n\n` +
        `Please try again or contact support.`
      );
    }
  }

  async handlePay(from, text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('paid') || lowerText.includes('done') || lowerText.includes('complete')) {
      await this.sendMessage(from, 
        `⏳ Checking payment status...\n\n` +
        `Please wait...`
      );

      const session = sessionStore.get(from);
      
      if (!session.chargeId) {
        await this.sendMessage(from, `❌ No payment found. Please complete payment first.`);
        return;
      }

      return;
    }

    if (lowerText.includes('cancel')) {
      sessionStore.delete(from);
      await this.sendMessage(from, `❌ Transfer cancelled.\n\nSend "help" to start over.`);
      return;
    }

    await this.sendMessage(from, 
      `⏱️ Waiting for payment...\n\n` +
      `Complete the payment and reply "paid" when done.`
    );
  }

  async handleProcessing(from, text) {
    await this.sendMessage(from, 
      `⏳ Your transaction is being processed...\n\n` +
      `You'll receive a confirmation shortly.`
    );
  }

  async startPaymentPolling(from, chargeId) {
    console.log('[BotHandler] Starting payment polling for:', from);

    setTimeout(async () => {
      try {
        const session = sessionStore.get(from);
        
        if (!session || session.state !== STATES.PAY) {
          console.log('[BotHandler] Session expired or state changed');
          return;
        }

        await this.sendMessage(from, 
          `⏳ Still waiting for payment...\n\n` +
          `Complete payment and reply "paid" when done.`
        );

      } catch (error) {
        console.error('[BotHandler] Polling notification error:', error.message);
      }
    }, 30000);
  }

  async processPaymentSuccess(from, paymentResult) {
    console.log('[BotHandler] Processing successful payment for:', from);

    const session = sessionStore.get(from);
    
    if (!session) {
      console.error('[BotHandler] Session not found for payment success');
      return;
    }

    sessionStore.update(from, {
      state: STATES.PROCESSING,
      paymentResult
    });

    await this.sendMessage(from, 
      `✅ *Payment Confirmed!*\n\n` +
      `💱 Converting ${session.amount} ${session.currency} → ${session.usdcAmount} USDC...\n\n` +
      `🔗 Depositing to blockchain...`
    );

    try {
      const recipientAddress = process.env.DEFAULT_RECIPIENT_ADDRESS || session.recipientPhone;
      
      const bridgeResult = await bridgeService.depositToBridge(
        session.usdcAmount,
        recipientAddress,
        `${session.txRef}|${session.amount}${session.currency}|${session.recipientPhone}`
      );

      sessionStore.update(from, {
        state: STATES.SUCCESS,
        bridgeResult,
        completedAt: Date.now()
      });

      const basename = await resolveBasename(recipientAddress);

      await this.sendMessage(from, 
        `🎉 *Transfer Complete!*\n\n` +
        `✅ ${session.usdcAmount} USDC sent to ${session.recipientPhone}\n\n` +
        `🔗 Transaction: ${bridgeResult.txHash.slice(0, 10)}...${bridgeResult.txHash.slice(-8)}\n` +
        `👤 Recipient: ${basename}\n` +
        `⛽ Gas Used: ${bridgeResult.gasUsed}\n\n` +
        `🌐 View on BaseScan:\n` +
        `https://sepolia.basescan.org/tx/${bridgeResult.txHash}\n\n` +
        `Thank you for using AfriBridge! 🌍`
      );

      console.log('[BotHandler] Transfer completed successfully:', {
        from,
        txHash: bridgeResult.txHash,
        recipient: session.recipientPhone
      });

    } catch (error) {
      console.error('[BotHandler] Blockchain transfer error:', error.message);

      sessionStore.update(from, {
        state: STATES.ERROR,
        error: error.message
      });

      await this.sendMessage(from, 
        `❌ *Transfer Failed*\n\n` +
        `Payment received but blockchain transfer failed.\n\n` +
        `Reference: ${session.txRef}\n` +
        `Error: ${error.message}\n\n` +
        `Please contact support for a refund.`
      );
    }
  }

  async processPaymentFailure(from, error) {
    console.log('[BotHandler] Processing payment failure for:', from);

    sessionStore.update(from, {
      state: STATES.ERROR,
      error: error.message
    });

    await this.sendMessage(from, 
      `❌ *Payment Failed*\n\n` +
      `${error.message}\n\n` +
      `Please try again or contact support.`
    );
  }
}

module.exports = { BotHandler, STATES, SUPPORTED_CURRENCIES };
