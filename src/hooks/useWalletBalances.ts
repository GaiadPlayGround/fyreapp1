export interface WalletBalances {
  ethBalance: string;
  usdcBalance: string;
  fcbccBalance: string;
  isLoading: boolean;
}

// Wallet balances are currently disabled to keep the app usable without wallet connectivity.
export const useWalletBalances = (): WalletBalances => {
  return {
    ethBalance: '0',
    usdcBalance: '0',
    fcbccBalance: '0',
    isLoading: false,
  };
};

