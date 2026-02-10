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

interface ReferrerEntry {
  address: string;
  referral_count: number;
}

export const useWalletLeaderboard = (limit: number = 25) => {
  const [topVoters, setTopVoters] = useState<WalletLeaderEntry[]>([]);
  const [topSharers, setTopSharers] = useState<WalletLeaderEntry[]>([]);
  const [topDnaHolders, setTopDnaHolders] = useState<DnaHolderEntry[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerEntry[]>([]);
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

          const topHolders = Object.entries(holderBalances)
            .map(([address, totalDnaBalance]) => ({ address, totalDnaBalance }))
            .sort((a, b) => b.totalDnaBalance - a.totalDnaBalance)
            .slice(0, 15);

          setTopDnaHolders(topHolders);
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

        // Fetch top referrers - count wallets that have invited_by set to each invite_code
        // First get all wallets with invite codes
        const { data: allWallets, error: walletsError } = await supabase
          .from('wallets')
          .select('address, invite_code, invited_by');

        if (!walletsError && allWallets) {
          // Count how many users each invite_code has referred
          const referralCounts: Record<string, number> = {};
          const codeToAddress: Record<string, string> = {};
          
          allWallets.forEach((w) => {
            if (w.invite_code) {
              codeToAddress[w.invite_code] = w.address;
            }
          });
          
          allWallets.forEach((w) => {
            if (w.invited_by && codeToAddress[w.invited_by]) {
              const referrerAddr = codeToAddress[w.invited_by];
              referralCounts[referrerAddr] = (referralCounts[referrerAddr] || 0) + 1;
            }
          });

          const sortedReferrers = Object.entries(referralCounts)
            .map(([address, referral_count]) => ({ address, referral_count }))
            .sort((a, b) => b.referral_count - a.referral_count)
            .slice(0, limit);

          setTopReferrers(sortedReferrers);
        }

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

  return { topVoters, topSharers, topDnaHolders, topReferrers, loading };
};
