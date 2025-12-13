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
  votes: Vote[];
}

interface WalletContextType extends WalletState {
  connect: () => void;
  disconnect: () => void;
  addVote: (speciesId: string, rating: number) => boolean;
  hasVoted: (speciesId: string) => boolean;
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
    dnaBalance: 0,
    usdcBalance: 0,
    votes: [],
  });

  const connect = () => {
    // Mock wallet connection
    setState({
      isConnected: true,
      address: '0x1234...5678',
      dnaBalance: 1250,
      usdcBalance: 50.0,
      votes: [],
    });
  };

  const disconnect = () => {
    setState({
      isConnected: false,
      address: null,
      dnaBalance: 0,
      usdcBalance: 0,
      votes: [],
    });
  };

  const addVote = (speciesId: string, rating: number): boolean => {
    if (!state.isConnected || state.usdcBalance < VOTE_COST) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      usdcBalance: prev.usdcBalance - VOTE_COST,
      votes: [...prev.votes, { speciesId, rating, timestamp: new Date() }],
    }));
    return true;
  };

  const hasVoted = (speciesId: string): boolean => {
    return state.votes.some((v) => v.speciesId === speciesId);
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        addVote,
        hasVoted,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
