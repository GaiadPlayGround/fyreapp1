import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { useAccount } from 'wagmi';
import { Address, erc20Abi, formatUnits } from 'viem';
import { base } from 'wagmi/chains';

// Token addresses on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const USDC_DECIMALS = 6;

interface PortfolioHolding {
  speciesId: string;
  quantityHeld: string; // Formatted string like "10,000,000,000,000,000,000,000,000"
  unitPrice: string;
  marketCap: string;
  value: string;
}

interface PortfolioResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    totalCount: number;
    totalBalance: string;
    totalPortfolioValueInEth: string;
    formattedHoldings: PortfolioHolding[];
  };
}

export interface WalletBalances {
  usdcBalance: number;
  fcbccBalance: number;
  dnaBalance: number; // Total DNA tokens across all species
  ownedGenomes: number; // Number of unique DNA tokens with balance > 0
  totalDnaTokens: number; // Raw total DNA units (without decimals conversion)
}

export const useWalletBalances = () => {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const fetchBalances = useCallback(async (): Promise<WalletBalances> => {
    if (!address || !publicClient) {
      return {
        usdcBalance: 0,
        fcbccBalance: 0,
        dnaBalance: 0,
        ownedGenomes: 0,
        totalDnaTokens: 0,
      };
    }

    const walletAddress = address as Address;
    const balances: WalletBalances = {
      usdcBalance: 0,
      fcbccBalance: 0,
      dnaBalance: 0,
      ownedGenomes: 0,
      totalDnaTokens: 0,
    };

    try {
      // Fetch USDC balance (still need to fetch on-chain as it's not in portfolio)
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

      // Fetch portfolio data from API - gets all DNA token holdings at once
      try {
        const portfolioResponse = await fetch(
          `https://server.fcbc.fun/api/v1/zora/portfolio?address=${walletAddress}`
        );
        
        if (portfolioResponse.ok) {
          const portfolioData: PortfolioResponse = await portfolioResponse.json();
          
          if (portfolioData.success && portfolioData.data?.formattedHoldings) {
            let totalDnaBalance = 0;
            let ownedGenomesCount = 0;
            let fcbccBalance = 0;

            // Process all holdings from portfolio API
            portfolioData.data.formattedHoldings.forEach((holding) => {
              // Parse quantity (remove commas and convert to number)
              const quantityStr = holding.quantityHeld.replace(/,/g, '');
              const quantity = parseFloat(quantityStr);
              
              // Check if this is FCBCC (warplette) - usually speciesId is "fcbcc" or similar
              if (holding.speciesId?.toLowerCase() === 'fcbcc' || holding.speciesId?.toLowerCase().includes('warplette')) {
                // Convert from wei (18 decimals) to human readable
                fcbccBalance = parseFloat(formatUnits(BigInt(quantityStr), 18));
              } else if (quantity > 0) {
                // This is a DNA token - convert from wei (18 decimals) to human readable
                const balanceFormatted = parseFloat(formatUnits(BigInt(quantityStr), 18));
                
                // Only count if balance is meaningful (greater than 0.000001 to avoid dust)
                if (balanceFormatted > 0.000001) {
                  totalDnaBalance += balanceFormatted;
                  ownedGenomesCount++;
                }
              }
            });

            balances.dnaBalance = totalDnaBalance;
            balances.ownedGenomes = ownedGenomesCount;
            balances.fcbccBalance = fcbccBalance;
          }
        } else {
          console.warn('Portfolio API request failed:', portfolioResponse.status);
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        // Fallback: try to fetch FCBCC balance on-chain if portfolio API fails
        // (We'll skip individual DNA tokens as fallback since that's expensive)
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }

    return balances;
  }, [address, publicClient]);

  return { fetchBalances };
};

