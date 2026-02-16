import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { useAccount } from 'wagmi';
import { Address, erc20Abi, formatUnits } from 'viem';
import { getProfileBalances, setApiKey } from '@zoralabs/coins-sdk';
import { base } from 'wagmi/chains';
import { getAllValidDNAAddresses, getTickerByContractAddress } from '@/utils/speciesTickers';

// Token addresses on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const USDC_DECIMALS = 6;

// FCBCC/Warplette token address
const FCBCC_ADDRESS = '0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b' as Address;

interface PortfolioHolding {
  speciesId: string;
  quantityHeld: string;
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

export interface DnaHolding {
  ticker: string;
  quantity: number;
}

export interface WalletBalances {
  usdcBalance: number;
  fcbccBalance: number;
  dnaBalance: number;
  ownedGenomes: number;
  totalDnaTokens: number;
  ownedDnaTickers: string[]; // Array of DNA token tickers (e.g., ["FCBC121", "FCBC123", "FCBC164"])
  dnaHoldings: DnaHolding[]; // Array with ticker + quantity, sorted largest to smallest
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
        ownedDnaTickers: [],
        dnaHoldings: [],
      };
    }

    const walletAddress = address as Address;
    const balances: WalletBalances = {
      usdcBalance: 0,
      fcbccBalance: 0,
      dnaBalance: 0,
      ownedGenomes: 0,
      totalDnaTokens: 0,
      ownedDnaTickers: [],
      dnaHoldings: [],
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
        // Silently fail - USDC balance is optional
      }

      // Set Zora API key if available
      const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
      if (zoraApiKey) {
        setApiKey(zoraApiKey);
      }

      // Use CSV data for valid DNA token addresses - this is the source of truth
      const validDnaTokenAddresses = getAllValidDNAAddresses();
      console.log('=== VALID DNA TOKEN ADDRESSES (from CSV) ===');
      console.log(`Using ${validDnaTokenAddresses.size} valid DNA token addresses from CSV`);

      // Use Zora SDK getProfileBalances with pagination to get ALL actual holdings
      let allBalances: any[] = [];
      let cursor: string | undefined = undefined;
      const pageSize = 50;

      console.log('=== FETCHING ZORA PROFILE BALANCES ===');
      console.log('Wallet Address:', walletAddress);
      console.log('Chain ID:', base.id);

      // Paginate through all balances
      do {
        try {
          const response = await getProfileBalances({
            identifier: walletAddress,
            chainIds: [base.id],
            count: pageSize,
            after: cursor,
          });

          const profile = response.data?.profile;
          const edges = profile?.coinBalances?.edges || [];
          const pageInfo = profile?.coinBalances?.pageInfo;

          console.log(`Fetched page: ${edges.length} balances, hasNextPage: ${pageInfo?.hasNextPage}`);

          allBalances.push(...edges.map((e: any) => e.node));
          cursor = pageInfo?.endCursor;

          if (!pageInfo?.hasNextPage) {
            break;
          }
        } catch (error) {
          console.error('Error fetching profile balances:', error);
          break;
        }
      } while (cursor);

      console.log('=== ALL BALANCES FROM ZORA ===');
      console.log('Total balances fetched:', allBalances.length);
      console.log('Raw balances:', allBalances);

      // Fetch FCBCC/Warplette balance directly using balanceOf
      try {
        const fcbccBalanceBigInt = (await publicClient.readContract({
          address: FCBCC_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress],
        } as any)) as bigint;
        balances.fcbccBalance = parseFloat(formatUnits(fcbccBalanceBigInt, 18));
        console.log(`✓ FCBCC (via balanceOf): ${balances.fcbccBalance}`);
      } catch (error) {
        console.warn('Could not fetch FCBCC balance via balanceOf:', error);
        // Fallback to 0 if balanceOf fails
        balances.fcbccBalance = 0;
      }

      // Process balances
      let totalDnaBalance = 0;
      let ownedGenomesCount = 0;
      const ownedDnaTickers: string[] = [];
      const dnaHoldings: DnaHolding[] = [];

      allBalances.forEach((balanceNode: any) => {
        const coinAddress = balanceNode?.coin?.address;
        const balance = balanceNode?.balance;
        const coinSymbol = balanceNode?.coin?.symbol || '';
        const coinName = balanceNode?.coin?.name || '';

        if (!balance || BigInt(balance) === BigInt(0)) {
          return;
        }

        const balanceFormatted = parseFloat(formatUnits(BigInt(balance), 18));

        // Skip FCBCC/Warplette since we're fetching it directly via balanceOf
        const isFcbcc = coinAddress?.toLowerCase() === FCBCC_ADDRESS.toLowerCase() ||
                        coinSymbol?.toLowerCase().includes('fcbcc') ||
                        coinSymbol?.toLowerCase().includes('warplette') ||
                        coinName?.toLowerCase().includes('warplette');

        if (isFcbcc) {
          // Skip - already fetched via balanceOf
          return;
        }

        if (balanceFormatted > 0.000001) {
          // Check if this is a DNA token by verifying:
          // 1. Token address matches a valid DNA token address from CSV
          // 2. Get ticker from CSV mapping (more reliable than symbol)
          const isValidDnaAddress = coinAddress && validDnaTokenAddresses.has(coinAddress.toLowerCase());
          const tickerFromCSV = coinAddress ? getTickerByContractAddress(coinAddress) : null;
          
          // Only count if it's a valid DNA token address from CSV
          if (isValidDnaAddress && tickerFromCSV) {
            // This is a verified DNA token from FCBC collection (from CSV)
            totalDnaBalance += balanceFormatted;
            ownedGenomesCount++;
            // Use ticker from CSV (more reliable than symbol from Zora)
            ownedDnaTickers.push(tickerFromCSV);
            dnaHoldings.push({ ticker: tickerFromCSV, quantity: balanceFormatted });
            console.log(`✓ DNA Token ${tickerFromCSV} (${coinAddress}): ${balanceFormatted} (count: ${ownedGenomesCount})`);
          } else {
            // Not a valid DNA token from FCBC collection - skip it
            console.log(`✗ Skipped (not FCBC DNA token): ${coinSymbol || coinAddress} - ${balanceFormatted} (valid address: ${isValidDnaAddress}, ticker from CSV: ${tickerFromCSV})`);
          }
        }
      });

      console.log('=== FINAL COUNTS ===');
      console.log('Total DNA Balance:', totalDnaBalance);
      console.log('Owned Genomes:', ownedGenomesCount);
      console.log('FCBCC Balance:', balances.fcbccBalance);

      balances.dnaBalance = totalDnaBalance;
      balances.ownedGenomes = ownedGenomesCount;
      balances.totalDnaTokens = totalDnaBalance;
      balances.ownedDnaTickers = ownedDnaTickers.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      balances.dnaHoldings = dnaHoldings.sort((a, b) => b.quantity - a.quantity);
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }

    return balances;
  }, [address, publicClient]);



  // console.log('fetchBalances', fetchBalances());
  return { fetchBalances };
};
