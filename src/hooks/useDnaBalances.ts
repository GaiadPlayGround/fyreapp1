import { useCallback } from 'react';
import { getCoinHolders, setApiKey } from '@zoralabs/coins-sdk';
import { formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { supabase } from '@/integrations/supabase/client';
import { getSpeciesTickerMappings } from '@/utils/speciesTickers';

interface DnaBalanceUpdateResult {
  success: boolean;
  updatedCount: number;
  error?: string;
}

export const useDnaBalances = () => {
  
  const fetchAndUpdateDnaBalances = useCallback(async (): Promise<DnaBalanceUpdateResult> => {
    try {
      // Set Zora API key if available
      const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
      if (zoraApiKey) {
        setApiKey(zoraApiKey);
      }

      // Fetch top DNA token holders - use CSV data as source of truth
      const speciesMappings = getSpeciesTickerMappings();
      const dnaTokenAddresses: string[] = speciesMappings.map(m => m.contractAddress);

      console.log(`Using ${dnaTokenAddresses.length} DNA token addresses from CSV for leaderboard`);

      const holderBalances: Record<string, number> = {};
      const batchSize = 10;
      const maxTokens = 50;
      
      for (let i = 0; i < Math.min(dnaTokenAddresses.length, maxTokens); i += batchSize) {
        const batch = dnaTokenAddresses.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (tokenAddress) => {
            try {
              let cursor: string | undefined = undefined;
              let hasMore = true;

              while (hasMore) {
                const holdersResponse = await getCoinHolders({
                  address: tokenAddress,
                  chainId: base.id,
                  count: 100,
                  after: cursor,
                });

                const tokenBalances = holdersResponse.data?.zora20Token?.tokenBalances;
                const edges = tokenBalances?.edges || [];
                const pageInfo = tokenBalances?.pageInfo;

                edges.forEach((edge: any) => {
                  const node = edge.node;
                  const holderAddress = node?.ownerAddress || node?.address || '';
                  const balance = node?.balance || '0';

                  if (holderAddress && balance) {
                    const balanceFormatted = parseFloat(formatUnits(BigInt(balance), 18));
                    if (balanceFormatted > 0.000001) {
                      holderBalances[holderAddress.toLowerCase()] = 
                        (holderBalances[holderAddress.toLowerCase()] || 0) + balanceFormatted;
                    }
                  }
                });

                cursor = pageInfo?.endCursor;
                hasMore = pageInfo?.hasNextPage || false;
              }
            } catch (error) {
              console.error(`Error fetching holders for token ${tokenAddress}:`, error);
            }
          })
        );
      }

      // Update database with the fetched DNA balances
      const addresses = Object.keys(holderBalances);
      let updatedCount = 0;

      for (const address of addresses) {
        const dnaBalance = holderBalances[address];
        
        // Update or insert the wallet with DNA balance
        const { error } = await supabase
          .from('wallets')
          .upsert({
            address: address,
            total_dna_balance: dnaBalance
          }, {
            onConflict: 'address'
          });
          
        if (!error) {
          updatedCount++;
        } else {
          console.error(`Error updating DNA balance for ${address}:`, error);
        }
      }

      return {
        success: true,
        updatedCount,
      };

    } catch (error) {
      console.error('Error fetching and updating DNA balances:', error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  const getTopDnaHolders = useCallback(async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('address, total_dna_balance')
        .order('total_dna_balance', { ascending: false })
        .limit(limit)
        .gt('total_dna_balance', 0);

      if (error) {
        console.error('Error fetching top DNA holders:', error);
        return [];
      }

      return data.map(wallet => ({
        address: wallet.address,
        totalDnaBalance: wallet.total_dna_balance || 0
      }));
    } catch (error) {
      console.error('Error in getTopDnaHolders:', error);
      return [];
    }
  }, []);

  return {
    fetchAndUpdateDnaBalances,
    getTopDnaHolders
  };
};

export default useDnaBalances;