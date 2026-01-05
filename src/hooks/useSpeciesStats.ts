import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SpeciesStats {
  species_id: string;
  base_squares: number;
  share_count: number;
  view_count: number;
  last_viewed_at: string | null;
}

export const useSpeciesStats = () => {
  const [stats, setStats] = useState<Record<string, SpeciesStats>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('species_stats')
        .select('*');

      if (error) throw error;

      const statsMap: Record<string, SpeciesStats> = {};
      (data || []).forEach((stat: SpeciesStats) => {
        statsMap[stat.species_id] = stat;
      });
      setStats(statsMap);
    } catch (err) {
      console.error('Error fetching species stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getBaseSquares = useCallback((speciesId: string): number => {
    return stats[speciesId]?.base_squares || 0;
  }, [stats]);

  const getShareCount = useCallback((speciesId: string): number => {
    return stats[speciesId]?.share_count || 0;
  }, [stats]);

  const recordVote = async (speciesId: string, walletAddress: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('species_votes')
        .insert({
          species_id: speciesId,
          wallet_address: walletAddress,
          rating,
          usdc_cost: 0.2
        });

      if (error) throw error;
      
      // Refresh stats
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error recording vote:', err);
      return false;
    }
  };

  const recordShare = async (speciesId: string, walletAddress: string, platform: string) => {
    try {
      const { error } = await supabase
        .from('species_shares')
        .insert({
          species_id: speciesId,
          wallet_address: walletAddress,
          platform
        });

      if (error) throw error;
      
      // Refresh stats
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error recording share:', err);
      return false;
    }
  };

  const recordView = async (speciesId: string, walletAddress?: string) => {
    try {
      const { error } = await supabase
        .from('species_views')
        .insert({
          species_id: speciesId,
          wallet_address: walletAddress || null
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error recording view:', err);
      return false;
    }
  };

  // Get trending species (most recently viewed globally)
  const getTrendingOrder = async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('species_stats')
        .select('species_id')
        .order('last_viewed_at', { ascending: false, nullsFirst: false })
        .limit(200);

      if (error) throw error;
      return (data || []).map(d => d.species_id);
    } catch (err) {
      console.error('Error getting trending order:', err);
      return [];
    }
  };

  return {
    stats,
    loading,
    getBaseSquares,
    getShareCount,
    recordVote,
    recordShare,
    recordView,
    getTrendingOrder,
    refetch: fetchStats
  };
};
