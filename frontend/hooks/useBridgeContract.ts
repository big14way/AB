import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { baseSepolia } from '../config/wagmi';

// Bridge contract ABI (minimal interface)
const BRIDGE_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'fiatRef', type: 'string' },
    ],
    name: 'depositUSDC',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getContractBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const BRIDGE_ADDRESS = (process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ADDRESS || 
  '0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88') as Address;

/**
 * Hook for interacting with the Bridge contract
 */
export function useBridgeContract() {
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read contract balance
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: BRIDGE_ADDRESS,
    abi: BRIDGE_ABI,
    functionName: 'getContractBalance',
    chainId: baseSepolia.id,
  });

  /**
   * Deposit USDC to the bridge
   */
  const depositUSDC = async (
    recipientAddress: Address,
    amountUSDC: string,
    fiatReference: string
  ) => {
    try {
      // Parse USDC amount (6 decimals)
      const amount = parseUnits(amountUSDC, 6);

      await writeContract({
        address: BRIDGE_ADDRESS,
        abi: BRIDGE_ABI,
        functionName: 'depositUSDC',
        args: [recipientAddress, amount, fiatReference],
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error('Error depositing USDC:', err);
      throw err;
    }
  };

  return {
    // Contract info
    contractAddress: BRIDGE_ADDRESS,
    contractBalance,
    
    // Deposit function
    depositUSDC,
    
    // Transaction states
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    txHash: hash,
    
    // Utilities
    refetchBalance,
  };
}
