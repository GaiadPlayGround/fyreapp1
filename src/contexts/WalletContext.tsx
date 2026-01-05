import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';

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
  invites: number;
  shares: number;
  votes: Vote[];
  inviteCode: string | null;
  totalVotes: number;
  totalShares: number;
}

interface WalletContextType extends WalletState {
  connect: () => void;
  disconnect: () => void;
  addVote: (speciesId: string, rating: number) => boolean;
  addShare: () => void;
  hasVoted: (speciesId: string) => boolean;
  getVoteCount: (speciesId: string) => number;
  refreshWalletData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    dnaBalance: 0,
    usdcBalance: 0,
    fcbccBalance: 0,
    invites: 0,
    shares: 0,
    votes: [],
    inviteCode: null,
    totalVotes: 0,
    totalShares: 0,
  });

  // Sync with wagmi connection state
  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      registerOrFetchWallet(wagmiAddress);
    } else if (!wagmiConnected) {
      setState({
        isConnected: false,
        address: null,
        dnaBalance: 0,
        usdcBalance: 0,
        fcbccBalance: 0,
        invites: 0,
        shares: 0,
        votes: [],
        inviteCode: null,
        totalVotes: 0,
        totalShares: 0,
      });
    }
  }, [wagmiConnected, wagmiAddress]);

  const registerOrFetchWallet = async (address: string) => {
    try {
      // Check if wallet exists
      const { data: existingWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('address', address.toLowerCase())
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching wallet:', fetchError);
      }

      if (existingWallet) {
        // Wallet exists, use its data
        setState({
          isConnected: true,
          address: address,
          dnaBalance: 0, // Will be populated by useWalletBalances hook
          usdcBalance: 0,
          fcbccBalance: 0,
          invites: 1,
          shares: existingWallet.total_shares || 0,
          votes: [],
          inviteCode: existingWallet.invite_code,
          totalVotes: existingWallet.total_votes || 0,
          totalShares: existingWallet.total_shares || 0,
        });
      } else {
        // Register new wallet
        const inviteCode = generateInviteCode();
        const { data: newWallet, error: insertError } = await supabase
          .from('wallets')
          .insert({
            address: address.toLowerCase(),
            invite_code: inviteCode,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error registering wallet:', insertError);
          // Still connect even if registration fails
          setState({
            isConnected: true,
            address: address,
            dnaBalance: 0,
            usdcBalance: 0,
            fcbccBalance: 0,
            invites: 1,
            shares: 0,
            votes: [],
            inviteCode: inviteCode,
            totalVotes: 0,
            totalShares: 0,
          });
        } else {
          setState({
            isConnected: true,
            address: address,
            dnaBalance: 0,
            usdcBalance: 0,
            fcbccBalance: 0,
            invites: 1,
            shares: 0,
            votes: [],
            inviteCode: newWallet?.invite_code || inviteCode,
            totalVotes: 0,
            totalShares: 0,
          });
        }
      }
    } catch (err) {
      console.error('Wallet registration error:', err);
      setState({
        isConnected: true,
        address: address,
        dnaBalance: 0,
        usdcBalance: 0,
        fcbccBalance: 0,
        invites: 1,
        shares: 0,
        votes: [],
        inviteCode: generateInviteCode(),
        totalVotes: 0,
        totalShares: 0,
      });
    }
  };

  const refreshWalletData = async () => {
    if (!state.address) return;
    
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('address', state.address.toLowerCase())
      .maybeSingle();

    if (wallet) {
      setState(prev => ({
        ...prev,
        totalVotes: wallet.total_votes || 0,
        totalShares: wallet.total_shares || 0,
        inviteCode: wallet.invite_code,
      }));
    }
  };

  const connect = () => {
    // Connection is now handled by OnchainKit/wagmi
    // This is kept for compatibility
  };

  const disconnect = () => {
    wagmiDisconnect();
    setState({
      isConnected: false,
      address: null,
      dnaBalance: 0,
      usdcBalance: 0,
      fcbccBalance: 0,
      invites: 0,
      shares: 0,
      votes: [],
      inviteCode: null,
      totalVotes: 0,
      totalShares: 0,
    });
  };

  const addShare = () => {
    setState((prev) => ({
      ...prev,
      shares: prev.shares + 1,
    }));
  };

  const addVote = (speciesId: string, rating: number): boolean => {
    if (!state.isConnected) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      votes: [...prev.votes, { speciesId, rating, timestamp: new Date() }],
    }));
    return true;
  };

  const hasVoted = (speciesId: string): boolean => {
    return false; // Always allow voting
  };

  const getVoteCount = (speciesId: string): number => {
    return state.votes.filter((v) => v.speciesId === speciesId).length;
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        addVote,
        addShare,
        hasVoted,
        getVoteCount,
        refreshWalletData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
