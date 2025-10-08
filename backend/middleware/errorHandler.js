const sessionStore = require('../utils/sessionStore');

function logError(error, req, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code
    },
    request: {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      ip: req.ip
    },
    context
  };

  console.error('[ErrorHandler] Error logged:', JSON.stringify(errorLog, null, 2));

  return errorLog;
}

function createRetryLink(txRef, errorType) {
  const baseUrl = process.env.APP_BASE_URL || 'https://afribridge.app';
  return `${baseUrl}/retry/${txRef}?error=${encodeURIComponent(errorType)}`;
}

async function handlePaymentError(error, phone, session) {
  try {
    console.log('[ErrorHandler] Handling payment error for:', phone);

    const errorMessage = `❌ Payment Error\n\n${error.message}\n\n`;
    const retryLink = session?.txRef ? createRetryLink(session.txRef, 'payment') : null;
    
    const fullMessage = retryLink 
      ? `${errorMessage}🔄 Retry: ${retryLink}\n\nOr send "help" to start over.`
      : `${errorMessage}Send "help" to start over.`;

    sessionStore.update(phone, {
      state: 'ERROR',
      error: error.message,
      errorType: 'payment',
      retryLink
    });

    return {
      message: fullMessage,
      retryable: true,
      retryLink
    };
  } catch (err) {
    console.error('[ErrorHandler] Error in handlePaymentError:', err.message);
    return {
      message: '❌ An unexpected error occurred. Please contact support.',
      retryable: false
    };
  }
}

async function handleBlockchainError(error, phone, session) {
  try {
    console.log('[ErrorHandler] Handling blockchain error for:', phone);

    const errorMessage = `❌ Blockchain Error\n\nPayment received but blockchain transfer failed.\n\n`;
    const retryLink = session?.txRef ? createRetryLink(session.txRef, 'blockchain') : null;
    
    const fullMessage = retryLink
      ? `${errorMessage}Reference: ${session.txRef}\nError: ${error.message}\n\n🔄 Retry: ${retryLink}\n\nRefund will be initiated if not resolved.`
      : `${errorMessage}Reference: ${session?.txRef || 'N/A'}\nError: ${error.message}\n\nContact support for refund.`;

    sessionStore.update(phone, {
      state: 'ERROR',
      error: error.message,
      errorType: 'blockchain',
      retryLink,
      refundPending: true
    });

    return {
      message: fullMessage,
      retryable: true,
      retryLink,
      refundPending: true
    };
  } catch (err) {
    console.error('[ErrorHandler] Error in handleBlockchainError:', err.message);
    return {
      message: '❌ Transaction failed. Contact support with reference: ' + (session?.txRef || 'N/A'),
      retryable: false,
      refundPending: true
    };
  }
}

async function handleNetworkError(error, phone, session) {
  try {
    console.log('[ErrorHandler] Handling network error for:', phone);

    const errorMessage = `⚠️ Network Error\n\nTemporary connection issue. Please try again.\n\n`;
    const retryLink = session?.txRef ? createRetryLink(session.txRef, 'network') : null;
    
    const fullMessage = retryLink
      ? `${errorMessage}🔄 Retry: ${retryLink}\n\nOr send "retry" to try again.`
      : `${errorMessage}Send "retry" to try again or "help" for assistance.`;

    sessionStore.update(phone, {
      state: 'ERROR',
      error: error.message,
      errorType: 'network',
      retryLink,
      retryable: true
    });

    return {
      message: fullMessage,
      retryable: true,
      retryLink,
      autoRetry: true
    };
  } catch (err) {
    console.error('[ErrorHandler] Error in handleNetworkError:', err.message);
    return {
      message: '⚠️ Connection issue. Please try again.',
      retryable: true,
      autoRetry: true
    };
  }
}

function categorizeError(error) {
  const message = error.message.toLowerCase();

  if (message.includes('payment') || message.includes('flutterwave') || message.includes('charge')) {
    return 'payment';
  }

  if (message.includes('blockchain') || message.includes('transaction') || message.includes('gas') || message.includes('revert')) {
    return 'blockchain';
  }

  if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused') || message.includes('enotfound')) {
    return 'network';
  }

  return 'unknown';
}

async function handleError(error, req, res, next) {
  const phone = req.body?.From || req.params?.phone;
  const session = phone ? sessionStore.get(phone) : null;

  const errorLog = logError(error, req, { phone, session });

  const errorCategory = categorizeError(error);
  let errorResponse;

  switch (errorCategory) {
    case 'payment':
      errorResponse = await handlePaymentError(error, phone, session);
      break;
    case 'blockchain':
      errorResponse = await handleBlockchainError(error, phone, session);
      break;
    case 'network':
      errorResponse = await handleNetworkError(error, phone, session);
      break;
    default:
      errorResponse = {
        message: '❌ An unexpected error occurred. Please contact support.',
        retryable: false
      };
  }

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode || 500).json({
    error: {
      message: error.message,
      category: errorCategory,
      ...errorResponse,
      timestamp: errorLog.timestamp
    }
  });
}

function notFoundHandler(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  handleError,
  notFoundHandler,
  asyncHandler,
  logError,
  createRetryLink,
  handlePaymentError,
  handleBlockchainError,
  handleNetworkError,
  categorizeError
};
