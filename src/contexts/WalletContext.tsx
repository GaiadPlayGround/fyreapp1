import { createContext, useContext, useState, ReactNode } from 'react';

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
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    dnaBalance: 349000000, // 349m
    usdcBalance: 5747.00,
    fcbccBalance: 8400000, // 8.4m
    ownedGenomes: 174,
    voteTickets: 0,
    invites: 0,
    shares: 0,
    votes: [],
    inviteCode: null,
  });

  const connect = () => {
    // Generate unique invite code based on address
    const uniqueCode = `INV${Date.now().toString(36).toUpperCase()}`;
    setState({
      isConnected: true,
      address: '0x1234...5678',
      dnaBalance: 349000000, // 349m
      usdcBalance: 5747.00,
      fcbccBalance: 8400000, // 8.4m
      ownedGenomes: 174,
      voteTickets: 0,
      invites: 1,
      shares: 0,
      votes: [],
      inviteCode: uniqueCode,
    });
  };

  const disconnect = () => {
    setState({
      isConnected: false,
      address: null,
      dnaBalance: 0,
      usdcBalance: 0,
      fcbccBalance: 0,
      ownedGenomes: 0,
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