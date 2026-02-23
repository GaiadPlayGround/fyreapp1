import { useState, useEffect } from 'react';
import { getCoinHolders, setApiKey } from '@zoralabs/coins-sdk';
import { formatUnits } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { base } from 'wagmi/chains';
import { getSpeciesTickerMappings } from '@/utils/speciesTickers';
import { useDnaBalances } from './useDnaBalances';

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
  const { fetchAndUpdateDnaBalances, getTopDnaHolders } = useDnaBalances();

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        // Set Zora API key if available
        const zoraApiKey = import.meta.env.VITE_ZORA_API_KEY;
        if (zoraApiKey) {
          setApiKey(zoraApiKey);
        }

        // Fetch and update DNA balances from blockchain, then get top holders from database
        try {
          console.log('Fetching and updating DNA balances from blockchain...');
          const updateResult = await fetchAndUpdateDnaBalances();
          
          if (updateResult.success) {
            console.log(`Successfully updated DNA balances for ${updateResult.updatedCount} wallets`);
          } else {
            console.warn('DNA balance update failed, falling back to database data:', updateResult.error);
          }
          
          // Get top DNA holders from database (which now has updated balances)
          const topHolders = await getTopDnaHolders(limit);
          setTopDnaHolders(topHolders);
        } catch (error) {
          console.error('Error fetching DNA holders leaderboard:', error);
          // Fallback: try to get DNA holders from database even if update failed
          try {
            const topHolders = await getTopDnaHolders(limit);
            setTopDnaHolders(topHolders);
          } catch (dbError) {
            console.error('Error fetching DNA holders from database:', dbError);
          }
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

export default useWalletLeaderboard;