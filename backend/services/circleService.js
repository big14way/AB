const { Circle, CircleEnvironments } = require('@circle-fin/circle-sdk');

let circleClient = null;

function getCircleClient() {
  if (!circleClient) {
    const apiKey = process.env.CIRCLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('CIRCLE_API_KEY not configured');
    }

    circleClient = new Circle(
      apiKey,
      CircleEnvironments.sandbox
    );
    
    console.log('[Circle] Client initialized in sandbox mode');
  }
  
  return circleClient;
}

async function issueUSDC(amount, destinationAddress) {
  try {
    const client = getCircleClient();
    
    console.log('[Circle] Issuing USDC:', {
      amount,
      destination: destinationAddress
    });

    const response = await client.transfers.createTransfer({
      source: {
        type: 'wallet',
        id: process.env.CIRCLE_WALLET_ID
      },
      destination: {
        type: 'blockchain',
        address: destinationAddress,
        chain: 'ETH'
      },
      amount: {
        amount: amount.toString(),
        currency: 'USD'
      }
    });

    console.log('[Circle] USDC issued:', {
      transferId: response.data?.id,
      status: response.data?.status
    });

    return {
      success: true,
      transferId: response.data?.id,
      status: response.data?.status,
      amount: amount
    };
  } catch (error) {
    console.error('[Circle] Error issuing USDC:', error.message);
    throw new Error(`USDC issuance failed: ${error.message}`);
  }
}

async function getTransferStatus(transferId) {
  try {
    const client = getCircleClient();
    
    console.log('[Circle] Checking transfer status:', transferId);

    const response = await client.transfers.getTransfer(transferId);

    console.log('[Circle] Transfer status:', {
      transferId,
      status: response.data?.status
    });

    return {
      success: response.data?.status === 'complete',
      status: response.data?.status,
      transferId: transferId
    };
  } catch (error) {
    console.error('[Circle] Error checking transfer status:', error.message);
    throw new Error(`Status check failed: ${error.message}`);
  }
}

async function getWalletBalance() {
  try {
    const client = getCircleClient();
    const walletId = process.env.CIRCLE_WALLET_ID;
    
    if (!walletId) {
      throw new Error('CIRCLE_WALLET_ID not configured');
    }

    console.log('[Circle] Fetching wallet balance:', walletId);

    const response = await client.wallets.getWallet(walletId);

    console.log('[Circle] Wallet balance:', response.data?.balances);

    return {
      success: true,
      balances: response.data?.balances
    };
  } catch (error) {
    console.error('[Circle] Error fetching wallet balance:', error.message);
    throw new Error(`Balance check failed: ${error.message}`);
  }
}

module.exports = {
  issueUSDC,
  getTransferStatus,
  getWalletBalance
};
