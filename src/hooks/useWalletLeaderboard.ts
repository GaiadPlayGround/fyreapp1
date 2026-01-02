import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WalletLeaderEntry {
  address: string;
  total_votes: number;
  total_shares: number;
}

export const useWalletLeaderboard = (limit: number = 25) => {
  const [topVoters, setTopVoters] = useState<WalletLeaderEntry[]>([]);
  const [topSharers, setTopSharers] = useState<WalletLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        // Fetch top voters
        const { data: voters, error: votersError } = await supabase
          .from('wallets')
          .select('address, total_votes, total_shares')
          .order('total_votes', { ascending: false })
          .limit(limit);

        if (votersError) throw votersError;

        // Fetch top sharers
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

  return { topVoters, topSharers, loading };
};
