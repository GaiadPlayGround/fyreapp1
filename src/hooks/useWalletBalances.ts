import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { useAccount } from 'wagmi';
import { Address, erc20Abi, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { useSpeciesApi } from './useSpeciesApi';

// Token addresses on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const USDC_DECIMALS = 6;

export interface WalletBalances {
  usdcBalance: number;
  fcbccBalance: number;
  dnaBalance: number; // Total DNA tokens across all species
  ownedGenomes: number; // Number of unique DNA tokens with balance > 0
}

export const useWalletBalances = () => {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { species } = useSpeciesApi();

  const fetchBalances = useCallback(async (): Promise<WalletBalances> => {
    if (!address || !publicClient) {
      return {
        usdcBalance: 0,
        fcbccBalance: 0,
        dnaBalance: 0,
        ownedGenomes: 0,
      };
    }

    const walletAddress = address as Address;
    const balances: WalletBalances = {
      usdcBalance: 0,
      fcbccBalance: 0,
      dnaBalance: 0,
      ownedGenomes: 0,
    };

    try {
      // Fetch USDC balance
      try {
        const usdcBalance = (await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress],
        } as any)) as bigint;
        balances.usdcBalance = parseFloat(formatUnits(usdcBalance, USDC_DECIMALS));
      } catch (error) {
        console.warn('Failed to fetch USDC balance:', error);
      }

      // Fetch FCBCC balance from poolCurrencyToken address in species data
      // The poolCurrencyToken is warplette/FCBCC token - get it from the first species that has it
      const poolCurrencyToken = (species || []).find((s) => s.poolCurrencyToken?.address)?.poolCurrencyToken;
      if (poolCurrencyToken?.address && poolCurrencyToken.address.startsWith('0x')) {
        try {
          const fcbccBalance = (await publicClient.readContract({
            address: poolCurrencyToken.address as Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [walletAddress],
          } as any)) as bigint;
          balances.fcbccBalance = parseFloat(formatUnits(fcbccBalance, poolCurrencyToken.decimals || 18));
        } catch (error) {
          console.warn('Failed to fetch FCBCC balance:', error);
        }
      }

      // Fetch DNA token balances (aggregate across all species)
      // Each species has its own tokenAddress
      // Only process species that have tokenAddresses to avoid unnecessary calls
      const dnaTokenAddresses = (species || [])
        .filter((s) => s.tokenAddress && s.tokenAddress.startsWith('0x'))
        .map((s) => s.tokenAddress as Address);
      
      // If no DNA tokens found, skip the expensive balance fetching
      if (dnaTokenAddresses.length === 0) {
        return balances;
      }

      // Fetch balances for all DNA tokens in parallel (limit to 50 at a time to avoid rate limits)
      const batchSize = 50;
      let totalDnaBalance = 0;
      let ownedGenomesCount = 0;

      for (let i = 0; i < dnaTokenAddresses.length; i += batchSize) {
        const batch = dnaTokenAddresses.slice(i, i + batchSize);
        const balancePromises = batch.map(async (tokenAddress) => {
          try {
            const balance = (await publicClient.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [walletAddress],
            } as any)) as bigint;
            
            // Most DNA tokens use 18 decimals, but we'll try to get it from the contract if possible
            // For now, assume 18 decimals
            const balanceFormatted = parseFloat(formatUnits(balance, 18));
            
            if (balanceFormatted > 0) {
              totalDnaBalance += balanceFormatted;
              ownedGenomesCount++;
            }
            
            return balanceFormatted;
          } catch (error) {
            console.warn(`Failed to fetch balance for token ${tokenAddress}:`, error);
            return 0;
          }
        });

        await Promise.all(balancePromises);
      }

      balances.dnaBalance = totalDnaBalance;
      balances.ownedGenomes = ownedGenomesCount;
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }

    return balances;
  }, [address, publicClient, species.length]); // Only depend on species length to avoid frequent re-creation

  return { fetchBalances };
};

