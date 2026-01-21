import { useState, useEffect } from 'react';
import { getCoinHolders, setApiKey } from '@zoralabs/coins-sdk';
import { formatUnits } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { base } from 'wagmi/chains';

interface WalletLeaderEntry {
  address: string;
  total_votes: number;
  total_shares: number;
}

interface DnaHolderEntry {
  address: string;
  totalDnaBalance: number;
}

export const useWalletLeaderboard = (limit: number = 25) => {
  const [topVoters, setTopVoters] = useState<WalletLeaderEntry[]>([]);
  const [topSharers, setTopSharers] = useState<WalletLeaderEntry[]>([]);
  const [topDnaHolders, setTopDnaHolders] = useState<DnaHolderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        // Set Zora API key if available
        const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
        if (zoraApiKey) {
          setApiKey(zoraApiKey);
        }

        // Fetch top DNA token holders - aggregate across all DNA tokens
        try {
          // First, get all DNA token addresses from FCBC API
          const speciesResponse = await fetch('https://server.fcbc.fun/api/v1/zora/species?count=1234');
          const speciesData = await speciesResponse.json();
          
          const dnaTokenAddresses: string[] = [];
          if (speciesData?.data && Array.isArray(speciesData.data)) {
            speciesData.data.forEach((species: any) => {
              if (species.tokenAddress) {
                dnaTokenAddresses.push(species.tokenAddress);
              }
            });
          }

          console.log(`Found ${dnaTokenAddresses.length} DNA tokens to check holders for`);

          // Aggregate balances across all DNA tokens
          const holderBalances: Record<string, number> = {};

          // Fetch holders for each DNA token (limit to avoid too many calls)
          // Process in batches to avoid overwhelming the API
          const batchSize = 10;
          const maxTokens = 50; // Limit to first 50 tokens to avoid too many API calls
          for (let i = 0; i < Math.min(dnaTokenAddresses.length, maxTokens); i += batchSize) {
            const batch = dnaTokenAddresses.slice(i, i + batchSize);
            
            await Promise.all(
              batch.map(async (tokenAddress) => {
                try {
                  let cursor: string | undefined = undefined;
                  let hasMore = true;

                  // Paginate through all holders for this token
                  while (hasMore) {
                    const holdersResponse = await getCoinHolders({
                      address: tokenAddress,
                      chainId: base.id,
                      count: 100, // Max per page
                      after: cursor,
                    });

                    const tokenBalances = holdersResponse.data?.zora20Token?.tokenBalances;
                    const edges = tokenBalances?.edges || [];
                    const pageInfo = tokenBalances?.pageInfo;

                    // Aggregate balances
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

          // Sort by total DNA balance and get top 15
          const topHolders = Object.entries(holderBalances)
            .map(([address, totalDnaBalance]) => ({ address, totalDnaBalance }))
            .sort((a, b) => b.totalDnaBalance - a.totalDnaBalance)
            .slice(0, 15);

          setTopDnaHolders(topHolders);
          console.log('Fetched top 15 DNA holders:', topHolders);
        } catch (error) {
          console.error('Error fetching DNA holders leaderboard:', error);
        }

        // Fetch top voters from Supabase
        const { data: voters, error: votersError } = await supabase
          .from('wallets')
          .select('address, total_votes, total_shares')
          .order('total_votes', { ascending: false })
          .limit(limit);

        if (votersError) throw votersError;

        // Fetch top sharers from Supabase
        const { data: sharers, error: sharersError } = await supabase
          .from('wallets')
          .select('address, total_votes, total_shares')
          .order('total_shares', { ascending: false })
          .limit(limit);

        if (sharersError) throw sharersError;

        setTopVoters(voters || []);
        setTopSharers(sharers || []);
      } catch (err) {
        console.error('Error fetching leaderboards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [limit]);

  return { topVoters, topSharers, topDnaHolders, loading };
};
