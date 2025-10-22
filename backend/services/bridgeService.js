const { ethers } = require('ethers');

const BRIDGE_ABI = [
  'function depositUSDC(address to, uint256 amount, string calldata fiatRef) external',
  'function withdrawUSDC(address to, uint256 amount) external',
  'function getContractBalance() external view returns (uint256)',
  'event TransferEvent(address indexed from, address indexed to, uint256 amount, string fiatRef, uint256 timestamp)'
];

let provider = null;
let wallet = null;
let bridgeContract = null;

function initializeProvider() {
  if (!provider) {
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log('[Bridge] Provider initialized:', rpcUrl);
  }
  return provider;
}

function initializeWallet() {
  if (!wallet) {
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('ETHEREUM_PRIVATE_KEY not configured');
    }

    const provider = initializeProvider();
    wallet = new ethers.Wallet(privateKey, provider);
    console.log('[Bridge] Wallet initialized:', wallet.address);
  }
  return wallet;
}

function getBridgeContract() {
  if (!bridgeContract) {
    const contractAddress = process.env.BRIDGE_CONTRACT_ADDRESS || '0x123456789abcdef123456789abcdef1234567890';
    const wallet = initializeWallet();

    // Normalize contract address to proper checksum format (EIP-55)
    // getAddress() validates checksum, so we need to lowercase first to bypass validation
    const checksummedContractAddress = ethers.getAddress(contractAddress.toLowerCase());

    bridgeContract = new ethers.Contract(checksummedContractAddress, BRIDGE_ABI, wallet);
    console.log('[Bridge] Contract initialized:', checksummedContractAddress);
  }
  return bridgeContract;
}

async function depositToBridge(amount, toAddress, fiatRef) {
  try {
    const bridge = getBridgeContract();
    const wallet = initializeWallet();

    console.log('[Bridge] Original address:', toAddress);
    // Normalize address to proper checksum format (EIP-55)
    // getAddress() validates checksum, so we need to lowercase first to bypass validation
    // then getAddress() will apply the correct checksum
    const checksummedAddress = ethers.getAddress(toAddress.toLowerCase());
    console.log('[Bridge] Checksummed address:', checksummedAddress);

    const amountInWei = ethers.parseUnits(amount.toString(), 6);

    console.log('[Bridge] Depositing USDC:', {
      from: wallet.address,
      to: checksummedAddress,
      amount: amount,
      amountInWei: amountInWei.toString(),
      fiatRef
    });

    const gasEstimate = await bridge.depositUSDC.estimateGas(
      checksummedAddress,
      amountInWei,
      fiatRef
    );

    console.log('[Bridge] Gas estimate:', gasEstimate.toString());

    const tx = await bridge.depositUSDC(
      checksummedAddress,
      amountInWei,
      fiatRef,
      {
        gasLimit: gasEstimate * 120n / 100n
      }
    );

    console.log('[Bridge] Transaction sent:', tx.hash);

    const receipt = await tx.wait();

    console.log('[Bridge] Transaction confirmed:', {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('[Bridge] Error depositing to bridge:', error.message);
    throw new Error(`Bridge deposit failed: ${error.message}`);
  }
}

async function getContractBalance() {
  try {
    const bridge = getBridgeContract();
    
    const balance = await bridge.getContractBalance();
    const balanceFormatted = ethers.formatUnits(balance, 6);

    console.log('[Bridge] Contract balance:', balanceFormatted, 'USDC');

    return {
      success: true,
      balance: balanceFormatted,
      balanceWei: balance.toString()
    };
  } catch (error) {
    console.error('[Bridge] Error getting contract balance:', error.message);
    throw new Error(`Balance check failed: ${error.message}`);
  }
}

async function approveUSDC(amount) {
  try {
    const wallet = initializeWallet();
    const usdcAddress = process.env.USDC_ADDRESS_SEPOLIA || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const bridgeAddress = process.env.BRIDGE_CONTRACT_ADDRESS || '0x123456789abcdef123456789abcdef1234567890';

    // Normalize addresses to proper checksum format (EIP-55)
    // getAddress() validates checksum, so we need to lowercase first to bypass validation
    const checksummedUsdcAddress = ethers.getAddress(usdcAddress.toLowerCase());
    const checksummedBridgeAddress = ethers.getAddress(bridgeAddress.toLowerCase());

    const usdcAbi = [
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function allowance(address owner, address spender) external view returns (uint256)'
    ];

    const usdc = new ethers.Contract(checksummedUsdcAddress, usdcAbi, wallet);
    const amountInWei = ethers.parseUnits(amount.toString(), 6);

    const currentAllowance = await usdc.allowance(wallet.address, checksummedBridgeAddress);

    if (currentAllowance >= amountInWei) {
      console.log('[Bridge] Sufficient allowance already exists');
      return { success: true, txHash: null };
    }

    console.log('[Bridge] Approving USDC:', {
      spender: checksummedBridgeAddress,
      amount: amount,
      amountInWei: amountInWei.toString()
    });

    const tx = await usdc.approve(checksummedBridgeAddress, amountInWei);
    console.log('[Bridge] Approval transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('[Bridge] Approval confirmed:', receipt.hash);

    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('[Bridge] Error approving USDC:', error.message);
    throw new Error(`USDC approval failed: ${error.message}`);
  }
}

async function withdrawUSDC(toAddress, amount) {
  try {
    const bridge = getBridgeContract();
    const wallet = initializeWallet();

    // Normalize address to proper checksum format (EIP-55)
    // getAddress() validates checksum, so we need to lowercase first to bypass validation
    const checksummedAddress = ethers.getAddress(toAddress.toLowerCase());

    const amountInWei = ethers.parseUnits(amount.toString(), 6);

    console.log('[Bridge] Withdrawing USDC:', {
      from: wallet.address,
      to: checksummedAddress,
      amount: amount,
      amountInWei: amountInWei.toString()
    });

    const gasEstimate = await bridge.withdrawUSDC.estimateGas(
      checksummedAddress,
      amountInWei
    );

    console.log('[Bridge] Gas estimate:', gasEstimate.toString());

    const tx = await bridge.withdrawUSDC(
      checksummedAddress,
      amountInWei,
      {
        gasLimit: gasEstimate * 120n / 100n
      }
    );

    console.log('[Bridge] Withdrawal transaction sent:', tx.hash);

    const receipt = await tx.wait();

    console.log('[Bridge] Withdrawal confirmed:', {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('[Bridge] Error withdrawing from bridge:', error.message);
    throw new Error(`Bridge withdrawal failed: ${error.message}`);
  }
}

module.exports = {
  depositToBridge,
  withdrawUSDC,
  getContractBalance,
  approveUSDC
};
