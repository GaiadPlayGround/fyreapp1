import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, usePublicClient } from 'wagmi';
import { base } from 'wagmi/chains';
import { useWalletDb } from '@/hooks/useWalletDb';
import { useWalletBalances } from '@/hooks/useWalletBalances';

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
  voteTickets: number;
  invites: number;
  shares: number;
  votes: Vote[];
  inviteCode: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => void;
  disconnect: () => void;
  addVote: (speciesId: string, rating: number) => boolean;
  addShare: () => void;
  addVoteTicket: () => void;
  hasVoted: (speciesId: string) => boolean;
  getVoteCount: (speciesId: string) => number;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

const VOTE_COST = 0.2; // USDC

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // useAccount will detect if wallet is already connected, but won't auto-connect
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const walletDb = useWalletDb();
  const { fetchBalances } = useWalletBalances();
  
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
    voteTickets: 0,
    invites: 0,
    shares: 0,
    votes: [],
    inviteCode: null,
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
        }));
        // Fetch balances after wallet data is loaded
        updateBalances();
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
            }));
          } else {
            // Fallback if registration fails
            const uniqueCode = `INV${Date.now().toString(36).toUpperCase()}`;
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: wagmiAddress,
              inviteCode: uniqueCode,
            }));
          }
          // Fetch balances after wallet registration
          updateBalances();
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
  }, [wagmiIsConnected, wagmiAddress, walletDb.getWalletByAddress, walletDb.registerWallet]); // Removed fetchBalances from deps

  const connect = async () => {
    try {
      // Try to connect with injected connector (MetaMask, etc.) on Base network
      const injectedConnector = connectors.find((c) => c.id === 'injected');
      if (injectedConnector) {
        wagmiConnect({ 
          connector: injectedConnector,
          chainId: base.id, // Connect to Base network
        });
      } else {
        // Fallback: try first available connector
        if (connectors.length > 0) {
          wagmiConnect({ 
            connector: connectors[0],
            chainId: base.id, // Connect to Base network
          });
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
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
      voteTickets: 0,
      invites: 0,
      shares: 0,
      votes: [],
      inviteCode: null,
    });
  };

  const addShare = () => {
    setState((prev) => ({
      ...prev,
      shares: prev.shares + 1,
    }));
  };

  const addVoteTicket = () => {
    setState((prev) => ({
      ...prev,
      voteTickets: prev.voteTickets + 1,
    }));
  };

  const addVote = (speciesId: string, rating: number): boolean => {
    if (!state.isConnected || state.usdcBalance < VOTE_COST) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      usdcBalance: prev.usdcBalance - VOTE_COST,
      voteTickets: prev.voteTickets + 1, // +1 vote ticket with each vote
      votes: [...prev.votes, { speciesId, rating, timestamp: new Date() }],
    }));
    return true;
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
        addVote,
        addShare,
        addVoteTicket,
        hasVoted,
        getVoteCount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};