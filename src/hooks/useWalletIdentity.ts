export interface WalletIdentity {
  address: `0x${string}` | undefined;
  shortAddress: string;
  basename: string | null;
  avatar: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

// Wallet identity is currently disabled to keep the app usable without wallet connectivity.
export const useWalletIdentity = (): WalletIdentity => {
  return {
    address: undefined,
    shortAddress: '',
    basename: null,
    avatar: null,
    isConnected: false,
    isLoading: false,
  };
};

