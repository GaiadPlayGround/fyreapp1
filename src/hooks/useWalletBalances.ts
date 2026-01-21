import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { useAccount } from 'wagmi';
import { Address, erc20Abi, formatUnits } from 'viem';
import { getProfileBalances, setApiKey } from '@zoralabs/coins-sdk';
import { base } from 'wagmi/chains';

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

export interface WalletBalances {
  usdcBalance: number;
  fcbccBalance: number;
  dnaBalance: number;
  ownedGenomes: number;
  totalDnaTokens: number;
  ownedDnaTickers: string[]; // Array of DNA token tickers (e.g., ["FCBC121", "FCBC123", "FCBC164"])
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

      // Fetch valid DNA token addresses from FCBC species API
      // This ensures we only count tokens that are actually from the FCBC collection
      const validDnaTokenAddresses = new Set<string>();
      try {
        const speciesResponse = await fetch('https://server.fcbc.fun/api/v1/zora/species?count=1234');
        const speciesData = await speciesResponse.json();
        
        if (speciesData?.data && Array.isArray(speciesData.data)) {
          speciesData.data.forEach((species: any) => {
            if (species.tokenAddress) {
              validDnaTokenAddresses.add(species.tokenAddress.toLowerCase());
            }
          });
        }
        
        console.log('=== VALID DNA TOKEN ADDRESSES ===');
        console.log(`Fetched ${validDnaTokenAddresses.size} valid DNA token addresses from FCBC API`);
      } catch (error) {
        console.error('Error fetching species data for validation:', error);
        // Continue anyway - we'll still filter by symbol pattern as fallback
      }

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

      // Process balances
      let totalDnaBalance = 0;
      let ownedGenomesCount = 0;
      let fcbccBalance = 0;
      const ownedDnaTickers: string[] = [];

      allBalances.forEach((balanceNode: any) => {
        const coinAddress = balanceNode?.coin?.address;
        const balance = balanceNode?.balance;
        const coinSymbol = balanceNode?.coin?.symbol || '';
        const coinName = balanceNode?.coin?.name || '';

        if (!balance || BigInt(balance) === BigInt(0)) {
          return;
        }

        const balanceFormatted = parseFloat(formatUnits(BigInt(balance), 18));

        // Check if this is FCBCC/warplette (main coin)
        const isFcbcc = coinAddress?.toLowerCase() === FCBCC_ADDRESS.toLowerCase() ||
                        coinSymbol?.toLowerCase().includes('fcbcc') ||
                        coinSymbol?.toLowerCase().includes('warplette') ||
                        coinName?.toLowerCase().includes('warplette');

        console.log('Processing balance:', {
          coinAddress,
          coinSymbol,
          coinName,
          balance: balance.toString(),
          balanceFormatted,
          isFcbcc,
        });

        if (isFcbcc) {
          fcbccBalance = balanceFormatted;
          console.log(`✓ FCBCC: ${fcbccBalance}`);
        } else if (balanceFormatted > 0.000001) {
          // Check if this is a DNA token by verifying:
          // 1. Token address matches a valid DNA token address from FCBC API
          // 2. Symbol matches FCBC pattern (as additional validation)
          const isValidDnaAddress = coinAddress && validDnaTokenAddresses.has(coinAddress.toLowerCase());
          const matchesDnaPattern = /^FCBC\d+$/i.test(coinSymbol);
          
          // Only count if it's a valid DNA token address from FCBC collection
          if (isValidDnaAddress && matchesDnaPattern) {
            // This is a verified DNA token from FCBC collection
            totalDnaBalance += balanceFormatted;
            ownedGenomesCount++;
            // Track the ticker (symbol) of this DNA token
            if (coinSymbol) {
              ownedDnaTickers.push(coinSymbol);
            }
            console.log(`✓ DNA Token ${coinSymbol || coinAddress}: ${balanceFormatted} (count: ${ownedGenomesCount})`);
          } else {
            // Not a valid DNA token from FCBC collection - skip it
            console.log(`✗ Skipped (not FCBC DNA token): ${coinSymbol || coinAddress} - ${balanceFormatted} (valid address: ${isValidDnaAddress}, matches pattern: ${matchesDnaPattern})`);
          }
        }
      });

      console.log('=== FINAL COUNTS ===');
      console.log('Total DNA Balance:', totalDnaBalance);
      console.log('Owned Genomes:', ownedGenomesCount);
      console.log('FCBCC Balance:', fcbccBalance);

      balances.dnaBalance = totalDnaBalance;
      balances.ownedGenomes = ownedGenomesCount;
      balances.fcbccBalance = fcbccBalance;
      balances.totalDnaTokens = totalDnaBalance;
      balances.ownedDnaTickers = ownedDnaTickers.sort((a, b) => {
        // Sort tickers by number (FCBC121 < FCBC123)
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    }

    return balances;
  }, [address, publicClient]);



  // console.log('fetchBalances', fetchBalances());
  return { fetchBalances };
};
