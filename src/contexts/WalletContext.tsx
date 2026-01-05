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

const initialState: WalletState = {
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
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Wallet connectivity is currently disabled; keep a lightweight local context so UI can still render.
  const [state, setState] = useState<WalletState>(initialState);

  const refreshWalletData = async () => {
    // No-op while wallet is disabled.
  };

  const connect = () => {
    // No-op while wallet is disabled.
  };

  const disconnect = () => {
    setState(initialState);
  };

  const addShare = () => {
    setState((prev) => ({
      ...prev,
      shares: prev.shares + 1,
      totalShares: prev.totalShares + 1,
    }));
  };

  const addVote = (speciesId: string, rating: number): boolean => {
    setState((prev) => ({
      ...prev,
      votes: [...prev.votes, { speciesId, rating, timestamp: new Date() }],
      totalVotes: prev.totalVotes + 1,
    }));
    return true;
  };

  const hasVoted = (_speciesId: string): boolean => {
    return false;
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

