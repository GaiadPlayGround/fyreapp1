import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'viem/chains';

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
// Treasury address to receive vote payments
const TREASURY_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f5aB21' as const;

const VOTE_COST_USDC = 0.2; // 0.2 USDC per vote

// ERC20 Transfer ABI
const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function useUsdcVote() {
  const { address, isConnected } = useAccount();
  const [isPending, setIsPending] = useState(false);
  
  const { writeContractAsync, data: hash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const sendVotePayment = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setIsPending(true);
    
    try {
      // USDC has 6 decimals
      const amount = parseUnits(VOTE_COST_USDC.toString(), 6);
      
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, amount],
        chain: base,
        account: address,
      });
      
      return true;
    } catch (error) {
      console.error('Vote payment failed:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [isConnected, address, writeContractAsync]);

  return {
    sendVotePayment,
    isPending: isPending || isConfirming,
    isSuccess,
    voteCost: VOTE_COST_USDC,
  };
}
