import { ReactNode } from 'react';

interface OnchainProviderProps {
  children: ReactNode;
}

/**
 * Wallet/onchain providers are currently disabled to keep the app usable without wallet connectivity.
 */
export function OnchainProvider({ children }: OnchainProviderProps) {
  return <>{children}</>;
}

