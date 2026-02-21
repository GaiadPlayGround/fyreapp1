import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, usePublicClient } from 'wagmi';
import type { DnaHolding } from '@/hooks/useWalletBalances';
import { base } from 'wagmi/chains';
import { useWalletDb } from '@/hooks/useWalletDb';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import WalletSelectDialog from '@/components/WalletSelectDialog';

interface Vote {
  speciesId: string;
  rating: number;
  timestamp: Date;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  dnaBalance: number;
  usdcBalance: number;
  fcbccBalance: number;
  ownedGenomes: number;
  totalDnaTokens: number;
  ownedDnaTickers: string[];
  dnaHoldings: DnaHolding[];
  voteTickets: number;
  invites: number;
  shares: number;
  votes: Vote[];
  inviteCode: string | null;
  fyreKeys: number;
  completedTasksCount: number;
  referralCount: number;
}

interface WalletContextType extends WalletState {
  connect: () => void;
  disconnect: () => void;
  showWalletSelect: () => void;
  addVote: (speciesId: string, rating: number) => boolean;
  addShare: () => void;
  addVoteTicket: () => void;
  addBulkVoteRewards: (numVotes: number) => void;
  hasVoted: (speciesId: string) => boolean;
  getVoteCount: (speciesId: string) => number;
  refreshFyreKeys: () => Promise<void>;
  refreshCompletedTasksCount: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

const VOTE_COST = 0.01; // USDC (1 cent per vote)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // useAccount will detect if wallet is already connected, but won't auto-connect
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const walletDb = useWalletDb();
  const { fetchBalances } = useWalletBalances();
  const [showWalletSelectDialog, setShowWalletSelectDialog] = useState(false);

  // Function to refresh Fyre Keys from database
  const refreshFyreKeys = useCallback(async () => {
    if (!wagmiAddress) return;
    const dbFyreKeys = await walletDb.refreshFyreKeys(wagmiAddress);
    setState((prev) => ({
      ...prev,
      // Use the higher of DB value or local value to preserve local increments
      fyreKeys: Math.max(dbFyreKeys, prev.fyreKeys),
    }));
  }, [wagmiAddress, walletDb.refreshFyreKeys]);

  // Function to refresh completed tasks count from database
  const refreshCompletedTasksCount = useCallback(async () => {
    if (!wagmiAddress) return;
    const completions = await walletDb.getTaskCompletions(wagmiAddress);
    setState((prev) => ({
      ...prev,
      completedTasksCount: completions.size,
    }));
  }, [wagmiAddress, walletDb.getTaskCompletions]);
  
  // Use ref to store latest fetchBalances to avoid dependency issues
  const fetchBalancesRef = useRef(fetchBalances);
  useEffect(() => {
    fetchBalancesRef.current = fetchBalances;
  }, [fetchBalances]);

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    dnaBalance: 0,
    usdcBalance: 0,
    fcbccBalance: 0,
    ownedGenomes: 0,
    totalDnaTokens: 0,
    ownedDnaTickers: [],
    dnaHoldings: [],
    voteTickets: 0,
    invites: 0,
    shares: 0,
    votes: [],
    inviteCode: null,
    fyreKeys: 0,
    completedTasksCount: 0,
    referralCount: 0,
  });

  // Sync wagmi connection state with local state and fetch balances
  // Only run when wallet is actually connected (not on initial mount)
  useEffect(() => {
    // Don't run if wallet is not connected
    if (!wagmiIsConnected || !wagmiAddress) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          address: null,
          inviteCode: null,
          dnaBalance: 0,
          usdcBalance: 0,
          fcbccBalance: 0,
          ownedGenomes: 0,
          totalDnaTokens: 0,
           ownedDnaTickers: [],
           dnaHoldings: [],
        }));
      return;
    }

    // Only fetch wallet data when actually connected
    let cancelled = false;
    let balanceInterval: NodeJS.Timeout | null = null;
    
    const updateBalances = async () => {
      if (cancelled) return;
      try {
        const balances = await fetchBalancesRef.current();
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          usdcBalance: balances.usdcBalance,
          fcbccBalance: balances.fcbccBalance,
          dnaBalance: balances.dnaBalance,
          ownedGenomes: balances.ownedGenomes,
          totalDnaTokens: balances.totalDnaTokens || balances.dnaBalance,
          ownedDnaTickers: balances.ownedDnaTickers || [],
          dnaHoldings: balances.dnaHoldings || [],
        }));
      } catch (error) {
        // Silently handle errors to prevent disconnections
        if (!cancelled) {
          console.error('Failed to fetch balances:', error);
        }
      }
    };
    
    // Fetch wallet data from database
    walletDb.getWalletByAddress(wagmiAddress).then((walletData) => {
      if (cancelled) return;
      if (walletData) {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: wagmiAddress,
          inviteCode: walletData.invite_code || null,
          fyreKeys: walletData.fyre_keys || 0,
          voteTickets: (walletData as any).vote_tickets || 0,
          shares: walletData.total_shares || 0,
          invites: (walletData as any).referral_count || 0,
          referralCount: (walletData as any).referral_count || 0,
        }));
        // Fetch balances and task completions after wallet data is loaded
        updateBalances();
        refreshCompletedTasksCount();
      } else {
        // Register new wallet
        walletDb.registerWallet(wagmiAddress).then((newWalletData) => {
          if (cancelled) return;
          if (newWalletData) {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: wagmiAddress,
              inviteCode: newWalletData.invite_code || null,
              fyreKeys: newWalletData.fyre_keys || 0,
              voteTickets: (newWalletData as any).vote_tickets || 0,
              shares: newWalletData.total_shares || 0,
              invites: (newWalletData as any).referral_count || 0,
              referralCount: (newWalletData as any).referral_count || 0,
            }));
          } else {
            // Fallback if registration fails
            const uniqueCode = `INV${Date.now().toString(36).toUpperCase()}`;
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: wagmiAddress,
              inviteCode: uniqueCode,
              fyreKeys: 0,
            }));
          }
          // Fetch balances and task completions after wallet registration
          updateBalances();
          refreshCompletedTasksCount();
        });
      }
    });

    // Refresh balances every 60 seconds (less frequent to avoid disconnections)
    balanceInterval = setInterval(() => {
      if (!cancelled && wagmiIsConnected && wagmiAddress) {
        updateBalances();
      }
    }, 60000); // Refresh every 60 seconds

    return () => {
      cancelled = true;
      if (balanceInterval) {
        clearInterval(balanceInterval);
      }
    };
  }, [wagmiIsConnected, wagmiAddress, walletDb.getWalletByAddress, walletDb.registerWallet, refreshCompletedTasksCount]); // Removed fetchBalances from deps

  const showWalletSelect = () => {
    setShowWalletSelectDialog(true);
  };

  const connect = async () => {
    // Show wallet selection dialog instead of auto-connecting
    showWalletSelect();
  };

  const disconnect = () => {
    wagmiDisconnect();
    setState({
      isConnected: false,
      address: null,
      dnaBalance: 0,
      usdcBalance: 0,
      fcbccBalance: 0,
      ownedGenomes: 0,
      totalDnaTokens: 0,
      ownedDnaTickers: [],
      dnaHoldings: [],
      voteTickets: 0,
      invites: 0,
      shares: 0,
      votes: [],
      inviteCode: null,
      fyreKeys: 0,
      completedTasksCount: 0,
      referralCount: 0,
    });
  };

  const addShare = async () => {
    if (!state.isConnected || !state.address) return; // Don't count if not connected
    // Persist to DB
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await (supabase as any).rpc('increment_total_shares', { wallet_addr: state.address, amount: 1 });
      await (supabase as any).rpc('increment_fyre_keys', { wallet_addr: state.address, amount: 1 });
    } catch (e) { console.error('Failed to persist share:', e); }
    setState((prev) => ({
      ...prev,
      shares: prev.shares + 1,
      fyreKeys: prev.fyreKeys + 1,
    }));
  };

  const addVoteTicket = () => {
    if (!state.address) return;
    
    // Persist to database
    import('@/integrations/supabase/client').then(async ({ supabase }) => {
      try {
        const result = await supabase.rpc('increment_vote_tickets', { wallet_addr: state.address!, amount: 1 });
        if (result.error) {
          console.error('Failed to persist vote ticket:', result.error);
        }
      } catch (err: any) {
        console.error('Failed to persist vote ticket:', err);
      }
    });
    
    setState((prev) => ({
      ...prev,
      voteTickets: prev.voteTickets + 1,
    }));
  };

  const addVote = (speciesId: string, rating: number): boolean => {
    if (!state.isConnected || state.usdcBalance < VOTE_COST) {
      return false;
    }

    // Persist vote ticket and fyre keys to DB
    if (state.address) {
      import('@/integrations/supabase/client').then(async ({ supabase }) => {
        try {
          const ticketsResult = await supabase.rpc('increment_vote_tickets', { wallet_addr: state.address!, amount: 1 });
          if (ticketsResult.error) {
            console.error('Failed to persist vote ticket:', ticketsResult.error);
          }
        } catch (err: any) {
          console.error('Failed to persist vote ticket:', err);
        }
        
        try {
          const keysResult = await supabase.rpc('increment_fyre_keys', { wallet_addr: state.address!, amount: 10 });
          if (keysResult.error) {
            console.error('Failed to persist fyre keys:', keysResult.error);
          }
        } catch (err: any) {
          console.error('Failed to persist fyre keys:', err);
        }
      });
    }

    // Each successful vote adds 10 Fyre Keys and 1 vote ticket
    setState((prev) => ({
      ...prev,
      usdcBalance: prev.usdcBalance - VOTE_COST,
      voteTickets: prev.voteTickets + 1,
      fyreKeys: prev.fyreKeys + 10,
      votes: [...prev.votes, { speciesId, rating, timestamp: new Date() }],
    }));
    return true;
  };

  // Bulk vote: adds commensurate multiples of tickets and keys
  const addBulkVoteRewards = (numVotes: number) => {
    if (!state.address) return;
    
    // Persist to database
    import('@/integrations/supabase/client').then(async ({ supabase }) => {
      try {
        const ticketsResult = await supabase.rpc('increment_vote_tickets', { wallet_addr: state.address!, amount: numVotes });
        if (ticketsResult.error) {
          console.error('Failed to persist bulk vote tickets:', ticketsResult.error);
        }
      } catch (err: any) {
        console.error('Failed to persist bulk vote tickets:', err);
      }
      
      try {
        const keysResult = await supabase.rpc('increment_fyre_keys', { wallet_addr: state.address!, amount: 100 });
        if (keysResult.error) {
          console.error('Failed to persist bulk vote fyre keys:', keysResult.error);
        }
      } catch (err: any) {
        console.error('Failed to persist bulk vote fyre keys:', err);
      }
    });
    
    setState((prev) => ({
      ...prev,
      voteTickets: prev.voteTickets + numVotes,
      fyreKeys: prev.fyreKeys + 100,
    }));
  };

  // Users can vote multiple times now
  const hasVoted = (speciesId: string): boolean => {
    return false; // Always allow voting
  };

  const getVoteCount = (speciesId: string): number => {
    return state.votes.filter((v) => v.speciesId === speciesId).length;
  };

  // Format helper for display
  const formatBalance = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        showWalletSelect,
        addVote,
        addShare,
        addVoteTicket,
        addBulkVoteRewards,
        hasVoted,
        getVoteCount,
        refreshFyreKeys,
        refreshCompletedTasksCount,
      }}
    >
      {children}
      {showWalletSelectDialog && (
        <WalletSelectDialog
          isOpen={showWalletSelectDialog}
          onClose={() => setShowWalletSelectDialog(false)}
        />
      )}
    </WalletContext.Provider>
  );
};